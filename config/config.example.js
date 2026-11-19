/**
 * MediTrack Pro - Environment Configuration Template
 * 
 * Copy this file to config.js and add your real credentials:
 *   cp config/config.example.js config/config.js
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
