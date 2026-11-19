/**
 * MediTrack Pro - Environment Configuration
 * 
 * SETUP INSTRUCTIONS:
 * 1. Supabase Setup:
 *    - Create a project at https://supabase.com
 *    - Run database/schema.sql then database/rls-policies.sql in the Supabase SQL Editor.
 *    - Copy Project URL and anon public key from Project Settings -> API.
 *    - Paste below in SUPABASE_URL and SUPABASE_ANON_KEY.
 * 
 * 2. Blockchain Setup (Ethereum Sepolia):
 *    - Deploy blockchain/MedicationVerification.sol via Remix IDE (https://remix.ethereum.org)
 *      to Ethereum Sepolia testnet using MetaMask.
 *    - Copy the deployed contract address and paste below in CONTRACT_ADDRESS.
 * 
 * SECURITY WARNING:
 * Never put your Supabase service_role secret key or wallet private key here.
 */

window.ENV_CONFIG = {
  // Supabase Configuration
  SUPABASE_URL: "https://YOUR_SUPABASE_PROJECT_ID.supabase.co",
  SUPABASE_ANON_KEY: "YOUR_SUPABASE_ANON_PUBLIC_KEY",

  // Blockchain Configuration (Ethereum Sepolia Testnet)
  BLOCKCHAIN: {
    NETWORK_NAME: "Ethereum Sepolia Testnet",
    CHAIN_ID: "0xaa36a7", // 11155111 in hex
    CHAIN_ID_DECIMAL: 11155111,
    RPC_URL: "https://rpc.sepolia.org",
    CONTRACT_ADDRESS: "PASTE_YOUR_DEPLOYED_SEPOLIA_CONTRACT_ADDRESS_HERE",
    EXPLORER_URL: "https://sepolia.etherscan.io"
  }
};
