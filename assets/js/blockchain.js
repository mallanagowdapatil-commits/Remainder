/**
 * MediTrack - Blockchain Verification Engine
 * Ethereum Sepolia Testnet, MetaMask, Ethers.js & Cryptographic Verification
 * Proves timestamp and event integrity via deterministic SHA-256 hashes anchored to smart contract.
 * Note: Never puts patient names or prescription data on-chain. Zero fake transaction simulations.
 */

const BlockchainService = {
  walletAddress: null,
  chainId: null,
  isConnected: false,
  provider: null,
  signer: null,
  contract: null,

  // Sepolia Testnet Configuration
  SEPOLIA_CHAIN_ID_HEX: '0xaa36a7', // 11155111
  SEPOLIA_CHAIN_ID_DECIMAL: 11155111,
  EXPLORER_URL: 'https://sepolia.etherscan.io',
  
  CONTRACT_ABI: [
    "function recordEvent(bytes32 _eventHash, string calldata _eventId, string calldata _doseStatus, uint256 _recordedAt) external returns (bool)",
    "function verifyEvent(bytes32 _eventHash) external view returns (bool exists, address recorder, string memory eventId, string memory doseStatus, uint256 blockTimestamp, uint256 recordedAt)",
    "function isHashRecorded(bytes32 _eventHash) external view returns (bool)",
    "function getTotalRecords() external view returns (uint256)",
    "function getPatientHashes(address _patient) external view returns (bytes32[] memory)",
    "event MedicationEventAnchored(bytes32 indexed eventHash, address indexed recorder, string eventId, string doseStatus, uint256 blockTimestamp)"
  ],

  async init() {
    this.contractAddress = (window.ENV_CONFIG && window.ENV_CONFIG.BLOCKCHAIN && window.ENV_CONFIG.BLOCKCHAIN.CONTRACT_ADDRESS) || '';

    this.bindUIEvents();
    this.renderEventSubmissionQueue();
    await this.checkExistingWalletConnection();
    console.log('[BlockchainService] Subsystem Initialized. Contract Address:', this.contractAddress || '(Not set in config.js)');
  },

  /**
   * Check if MetaMask is already connected
   */
  async checkExistingWalletConnection() {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          await this.setupConnectedWallet(accounts[0], chainId);
        } else {
          this.updateWalletUI(false);
        }
      } catch (err) {
        console.warn('[BlockchainService] Could not restore existing wallet session:', err);
        this.updateWalletUI(false);
      }
    } else {
      this.updateWalletUI(false);
    }
  },

  /**
   * Bind Buttons & Forms in Blockchain View
   */
  bindUIEvents() {
    const connectBtn = document.getElementById('connect-wallet-btn');
    const verifyBtn = document.getElementById('verify-hash-btn');
    const contractInput = document.getElementById('blockchain-contract-input');

    if (connectBtn) {
      connectBtn.addEventListener('click', () => this.connectMetaMask());
    }

    if (verifyBtn) {
      verifyBtn.addEventListener('click', () => this.handleManualVerification());
    }

    if (contractInput && this.contractAddress) {
      contractInput.value = this.contractAddress;
    }

    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (!accounts || accounts.length === 0) {
          this.disconnectWallet();
        } else {
          this.walletAddress = accounts[0];
          this.updateWalletUI(true);
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
  },

  /**
   * Connect MetaMask Wallet to Sepolia
   */
  async connectMetaMask() {
    if (typeof window.ethereum === 'undefined') {
      Toast.show(
        'MetaMask was not detected. Please install the MetaMask extension to submit records to Ethereum Sepolia.',
        'warning',
        'MetaMask Required',
        5000
      );
      return;
    }

    try {
      Toast.show('Connecting to MetaMask...', 'info', 'Wallet');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

      if (!accounts || accounts.length === 0) {
        Toast.show('No Ethereum account selected in MetaMask.', 'warning', 'No Account');
        return;
      }

      // Check and prompt network switch to Sepolia (11155111)
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (parseInt(chainId, 16) !== this.SEPOLIA_CHAIN_ID_DECIMAL) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: this.SEPOLIA_CHAIN_ID_HEX }]
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: this.SEPOLIA_CHAIN_ID_HEX,
                chainName: 'Sepolia Test Network',
                nativeCurrency: { name: 'Sepolia ETH', symbol: 'SEP', decimals: 18 },
                rpcUrls: ['https://rpc.sepolia.org'],
                blockExplorerUrls: ['https://sepolia.etherscan.io']
              }]
            });
          } else {
            Toast.show('Please switch network to Sepolia in MetaMask.', 'warning', 'Wrong Network');
            return;
          }
        }
      }

      const activeChainId = await window.ethereum.request({ method: 'eth_chainId' });
      await this.setupConnectedWallet(accounts[0], activeChainId);
      Toast.show('Connected to MetaMask on Ethereum Sepolia!', 'success', 'Wallet Connected');
    } catch (err) {
      console.error('[BlockchainService] Connection failed:', err);
      Toast.show(err.message || 'MetaMask connection rejected.', 'error', 'Connection Error');
    }
  },

  /**
   * Setup Connected Wallet State with Ethers.js
   */
  async setupConnectedWallet(account, chainId) {
    this.walletAddress = account;
    this.chainId = chainId;
    this.isConnected = true;

    try {
      if (typeof ethers !== 'undefined') {
        if (ethers.BrowserProvider) {
          // Ethers v6
          this.provider = new ethers.BrowserProvider(window.ethereum);
          this.signer = await this.provider.getSigner();
        } else if (ethers.providers && ethers.providers.Web3Provider) {
          // Ethers v5
          this.provider = new ethers.providers.Web3Provider(window.ethereum);
          this.signer = this.provider.getSigner();
        }

        if (this.contractAddress && this.contractAddress.startsWith('0x') && this.contractAddress.length === 42) {
          this.contract = new ethers.Contract(this.contractAddress, this.CONTRACT_ABI, this.signer);
        }
      }
    } catch (e) {
      console.warn('[BlockchainService] Ethers initialization warning:', e);
    }

    this.updateWalletUI(true);
    this.renderEventSubmissionQueue();
  },

  disconnectWallet() {
    this.walletAddress = null;
    this.isConnected = false;
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.updateWalletUI(false);
    this.renderEventSubmissionQueue();
    Toast.show('Wallet disconnected.', 'info', 'Disconnected');
  },

  updateWalletUI(connected) {
    const connectBtn = document.getElementById('connect-wallet-btn');
    const walletAddressEl = document.getElementById('wallet-address-display');
    const networkBadge = document.getElementById('network-badge-display');

    if (connectBtn) {
      connectBtn.textContent = connected ? 'Disconnect Wallet' : 'Connect MetaMask';
      connectBtn.className = connected ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm';
      connectBtn.onclick = connected ? () => this.disconnectWallet() : () => this.connectMetaMask();
    }

    if (walletAddressEl) {
      if (connected && this.walletAddress) {
        walletAddressEl.textContent = `${this.walletAddress.substring(0, 6)}...${this.walletAddress.substring(this.walletAddress.length - 4)}`;
        walletAddressEl.title = this.walletAddress;
      } else {
        walletAddressEl.textContent = 'Not Connected';
      }
    }

    if (networkBadge) {
      networkBadge.textContent = connected ? 'Sepolia Testnet' : 'Disconnected';
      networkBadge.className = connected ? 'badge badge-taken' : 'badge badge-secondary';
    }
  },

  /**
   * Render Recent Events with 4 Distinct Verification Statuses:
   * 1. VERIFIED
   * 2. MODIFIED OR INVALID
   * 3. PENDING VERIFICATION
   * 4. NOT YET RECORDED
   */
  renderEventSubmissionQueue() {
    const container = document.getElementById('blockchain-event-queue');
    if (!container) return;

    const today = new Date().toISOString().split('T')[0];
    const todayEvents = StorageHelper.get(`med_events_${today}`, []);
    const historyEvents = StorageHelper.get('med_app_history', []);

    // Merge and deduplicate by medId + time
    const combined = [...todayEvents];
    historyEvents.forEach(h => {
      if (!combined.some(c => c.medId === h.medId && c.time === h.time)) {
        combined.push(h);
      }
    });

    if (combined.length === 0) {
      container.innerHTML = `
        <div class="card text-center text-muted" style="padding: 2.5rem 1rem;">
          <p class="text-xs">No dose events logged yet. Acknowledge or mark doses on the dashboard to generate SHA-256 event hashes.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = combined.map(ev => {
      const status = ev.blockchain_status || 'PENDING_VERIFICATION';
      let badgeHtml = '';
      let actionBtn = '';
      let detailsHtml = '';

      if (status === 'VERIFIED') {
        badgeHtml = `<span class="badge badge-taken"><span class="badge-dot"></span> VERIFIED</span>`;
        if (ev.blockchain_tx_hash) {
          detailsHtml = `
            <div class="text-xs text-muted" style="margin-top: 0.5rem; word-break: break-all;">
              <span>Tx Hash: </span>
              <a href="${this.EXPLORER_URL}/tx/${ev.blockchain_tx_hash}" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary); font-family: var(--font-family-mono);">
                ${ev.blockchain_tx_hash}
              </a>
            </div>
          `;
        }
      } else if (status === 'MODIFIED_OR_INVALID') {
        badgeHtml = `<span class="badge badge-missed"><span class="badge-dot"></span> MODIFIED OR INVALID</span>`;
        detailsHtml = `
          <div class="text-xs" style="color: var(--color-danger); margin-top: 0.5rem;">
            Integrity check failed: regenerated hash does not match original event signature.
          </div>
        `;
      } else if (status === 'NOT_YET_RECORDED') {
        badgeHtml = `<span class="badge badge-secondary">NOT YET RECORDED</span>`;
        actionBtn = `
          <button class="btn btn-outline btn-sm" onclick="BlockchainService.submitEventToSepolia('${ev.id}')">
            Submit Hash
          </button>
        `;
      } else {
        // PENDING_VERIFICATION
        badgeHtml = `<span class="badge badge-warning"><span class="badge-dot"></span> PENDING VERIFICATION</span>`;
        actionBtn = `
          <button class="btn btn-primary btn-sm" onclick="BlockchainService.submitEventToSepolia('${ev.id}')">
            ${this.isConnected ? 'Anchor to Sepolia' : 'Connect Wallet & Anchor'}
          </button>
        `;
      }

      return `
        <div class="card" style="margin-bottom: 0.75rem; padding: 1.25rem; border: 1px solid var(--color-neutral-200);">
          <div class="flex justify-between items-center" style="flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem;">
            <div>
              <strong style="font-size: 0.95rem;">${escapeHtml(ev.medName || 'Medication')}</strong>
              <span class="text-xs text-muted" style="margin-left: 0.5rem;">Dose: ${escapeHtml(ev.dosage || '')} • ${escapeHtml(ev.time || '')}</span>
            </div>
            <div>${badgeHtml}</div>
          </div>

          <div class="text-xs text-muted" style="margin-bottom: 0.5rem; font-family: var(--font-family-mono); word-break: break-all; background: var(--color-neutral-50); padding: 0.5rem; border-radius: var(--radius-sm);">
            <strong>SHA-256:</strong> ${escapeHtml(ev.event_hash || 'None')}
          </div>

          <div class="flex justify-between items-center" style="flex-wrap: wrap; gap: 0.5rem;">
            <div class="text-xs text-muted">
              Intake Status: <strong>${escapeHtml(ev.status)}</strong> • Recorded: ${new Date(ev.acknowledged_at || ev.scheduled_for).toLocaleTimeString()}
            </div>
            <div class="flex gap-2">
              <button class="btn btn-secondary btn-sm" onclick="BlockchainService.verifyLocalEventIntegrity('${ev.id}')">
                Verify Integrity
              </button>
              ${actionBtn}
            </div>
          </div>

          ${detailsHtml}
        </div>
      `;
    }).join('');
  },

  /**
   * Submit Real Event Hash to Ethereum Sepolia Smart Contract
   */
  async submitEventToSepolia(eventId) {
    if (!this.isConnected || !this.signer) {
      await this.connectMetaMask();
      if (!this.isConnected) return;
    }

    if (!this.contractAddress || !this.contractAddress.startsWith('0x') || this.contractAddress.length !== 42) {
      Toast.show(
        'Contract address is not configured yet. Deploy MedicationVerification.sol to Sepolia and paste address into config/config.js.',
        'warning',
        'Contract Not Deployed',
        6000
      );
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const todayEvents = StorageHelper.get(`med_events_${today}`, []);
    const eventRecord = todayEvents.find(e => e.id === eventId) || StorageHelper.get('med_app_history', []).find(e => e.id === eventId);

    if (!eventRecord || !eventRecord.event_hash) {
      Toast.show('Event record not found or missing SHA-256 hash.', 'error', 'Error');
      return;
    }

    try {
      Toast.show('Submitting event hash to Sepolia smart contract... Please confirm in MetaMask.', 'info', 'Transaction Pending');

      // Ensure contract instance is ready
      if (!this.contract) {
        this.contract = new ethers.Contract(this.contractAddress, this.CONTRACT_ABI, this.signer);
      }

      // Convert hex hash to bytes32 format if needed
      let hashBytes32 = eventRecord.event_hash;
      if (!hashBytes32.startsWith('0x')) {
        hashBytes32 = '0x' + hashBytes32;
      }

      const unixTimestamp = Math.floor(new Date(eventRecord.acknowledged_at || eventRecord.scheduled_for).getTime() / 1000);

      // Execute on-chain transaction
      const tx = await this.contract.recordEvent(
        hashBytes32,
        eventRecord.id,
        eventRecord.status,
        unixTimestamp
      );

      Toast.show(`Transaction broadcast! Waiting for block confirmation... Tx: ${tx.hash.substring(0, 10)}...`, 'info', 'Confirming');

      const receipt = await tx.wait();

      // Update record state to VERIFIED with real transaction metadata
      eventRecord.blockchain_status = 'VERIFIED';
      eventRecord.blockchain_tx_hash = tx.hash;
      eventRecord.block_number = receipt.blockNumber;

      // Persist in local storage
      const filteredToday = todayEvents.filter(e => e.id !== eventRecord.id);
      filteredToday.push(eventRecord);
      StorageHelper.set(`med_events_${today}`, filteredToday);

      // Persist in Supabase if logged in
      const user = StorageHelper.get('med_app_user', {});
      if (typeof SupabaseService !== 'undefined' && user.id && SupabaseService.hasActiveConfig()) {
        try {
          await SupabaseService.recordMedicationEvent(user.id, eventRecord);
        } catch (e) {
          console.warn('Failed to update Supabase tx record:', e);
        }
      }

      this.renderEventSubmissionQueue();
      Toast.show(`Event anchored to Sepolia! Block #${receipt.blockNumber}.`, 'success', 'On-Chain Verified', 5000);

    } catch (err) {
      console.error('[BlockchainService] On-chain submission failed:', err);
      Toast.show(err.message || 'Transaction failed or rejected by user.', 'error', 'Transaction Error');
    }
  },

  /**
   * Verify Local Event Cryptographic Integrity (Tamper Detection)
   */
  async verifyLocalEventIntegrity(eventId) {
    const today = new Date().toISOString().split('T')[0];
    const todayEvents = StorageHelper.get(`med_events_${today}`, []);
    const eventRecord = todayEvents.find(e => e.id === eventId) || StorageHelper.get('med_app_history', []).find(e => e.id === eventId);

    if (!eventRecord) {
      Toast.show('Event record not found.', 'error', 'Error');
      return;
    }

    try {
      // Regenerate canonical payload: v1|medId|scheduledIso|acknowledgedIso|status
      const ackIso = eventRecord.acknowledged_at || eventRecord.scheduled_for;
      const canonicalPayload = `v1|${eventRecord.medId}|${eventRecord.scheduled_for}|${ackIso}|${eventRecord.status}`;

      const msgBuffer = new TextEncoder().encode(canonicalPayload);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashHex = '0x' + Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

      if (hashHex.toLowerCase() === (eventRecord.event_hash || '').toLowerCase()) {
        Toast.show(
          `Event integrity confirmed! Deterministic SHA-256 matches: ${hashHex.substring(0, 14)}...`,
          'success',
          'Payload Valid'
        );
      } else {
        eventRecord.blockchain_status = 'MODIFIED_OR_INVALID';
        this.renderEventSubmissionQueue();
        Toast.show(
          'Integrity Alert: Stored fields do not match original SHA-256 hash! Tampering detected.',
          'error',
          'Tamper Alert',
          6000
        );
      }
    } catch (e) {
      Toast.show('Integrity verification failed: ' + e.message, 'error', 'Error');
    }
  },

  /**
   * Manual Hash Verification Search
   */
  async handleManualVerification() {
    const input = document.getElementById('manual-verify-hash-input');
    const resultBox = document.getElementById('manual-verify-result');

    if (!input || !resultBox) return;

    let hash = input.value.trim();
    if (!hash) {
      Toast.show('Please enter a SHA-256 hash to verify.', 'warning', 'Hash Required');
      return;
    }

    if (!hash.startsWith('0x')) {
      hash = '0x' + hash;
    }

    resultBox.style.display = 'block';
    resultBox.innerHTML = '<p class="text-xs text-muted">Checking hash on Ethereum Sepolia contract...</p>';

    if (!this.contract || !this.contractAddress) {
      resultBox.innerHTML = `
        <div class="card" style="border-left: 4px solid var(--color-warning); padding: 1rem;">
          <h4 style="margin: 0 0 0.25rem;">Contract Not Connected</h4>
          <p class="text-xs text-muted" style="margin: 0;">Connect MetaMask on Sepolia and configure contract address in config/config.js to query on-chain records.</p>
        </div>
      `;
      return;
    }

    try {
      const record = await this.contract.verifyEvent(hash);
      if (record && record.exists) {
        resultBox.innerHTML = `
          <div class="card" style="border-left: 4px solid var(--color-success); padding: 1.25rem;">
            <div class="flex items-center gap-2" style="margin-bottom: 0.5rem;">
              <span class="badge badge-taken">VERIFIED ON SEPOLIA</span>
              <strong style="font-size: 0.95rem;">Cryptographic Proof Valid</strong>
            </div>
            <div class="text-xs text-muted" style="line-height: 1.6;">
              <div><strong>Recorder Wallet:</strong> ${record.recorder}</div>
              <div><strong>Dose Status:</strong> ${record.doseStatus}</div>
              <div><strong>Event ID:</strong> ${record.eventId}</div>
              <div><strong>Block Timestamp:</strong> ${new Date(Number(record.blockTimestamp) * 1000).toLocaleString()}</div>
            </div>
          </div>
        `;
      } else {
        resultBox.innerHTML = `
          <div class="card" style="border-left: 4px solid var(--color-danger); padding: 1rem;">
            <div class="flex items-center gap-2" style="margin-bottom: 0.35rem;">
              <span class="badge badge-missed">NOT YET RECORDED</span>
            </div>
            <p class="text-xs text-muted" style="margin: 0;">This hash does not exist on the Sepolia smart contract registry.</p>
          </div>
        `;
      }
    } catch (err) {
      resultBox.innerHTML = `
        <div class="card" style="border-left: 4px solid var(--color-danger); padding: 1rem;">
          <p class="text-xs text-muted" style="margin: 0;">Contract query failed: ${escapeHtml(err.message)}</p>
        </div>
      `;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  BlockchainService.init();
});
