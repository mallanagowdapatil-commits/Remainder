# Medication Reminder and Tracker Application with OCR & Blockchain Integration

An academic engineering mini-project developed by a 3rd-year Computer Science & Engineering student, inspired by a 2024 research paper on **Patient Medication Adherence Systems**.

---

## 1. Project Overview & Core Philosophy

This application is designed to address non-adherence in clinical drug regimens through an evidence-based, mathematically verifiable, and accessible software architecture.

### Core Academic Principle: Explicit Checkbox Ingestion Rule
- The application enforces a strict protocol: **It will NEVER automatically mark medication as TAKEN** because a reminder was displayed, dismissed, or snoozed.
- Dose ingestion requires an **explicit user checkbox acknowledgement**.
- A **blockchain record** mathematically proves the cryptographic integrity and unalterable timestamp of a recorded event, not the physical biological ingestion of the medicine.

---

## 2. Strict Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (Zero frontend frameworks: No React, Vue, Angular, Bootstrap, or Tailwind).
- **Authentication & Database**: Supabase Authentication, PostgreSQL, Storage, Row Level Security (RLS).
- **Prescription OCR**: Tesseract.js (Client-side Optical Character Recognition).
- **Offline / PWA**: IndexedDB, Service Workers, Web App Manifest.
- **Cryptography**: JavaScript Web Crypto API (SHA-256 canonical hashing).
- **Blockchain**: Solidity smart contracts, Ethereum Sepolia Testnet, MetaMask, Ethers.js, Remix IDE.
- **Localization**: English, Kannada (ಕನ್ನಡ), and Hindi (हिंदी).

---

## 3. 12 Major Development Modules

| Module | Title | Status | Description |
|---|---|---|---|
| **01** | **Frontend and UI/UX** | **COMPLETED** | Healthcare design system, landing page, auth pages, responsive dashboard shell, 10 view panels, interactive checkbox dose prototype, toast notifications & modals. |
| **02** | **Supabase Auth & Database** | **COMPLETED** | Client configuration, PostgreSQL schema (7 tables), RLS ownership policies, patient/caregiver registration, session management, Supabase Storage. |
| **03** | **Medication Management** | **COMPLETED** | Full CRUD for medicines, dynamic schedules (once, twice, thrice, custom), start/end dates, reminder intervals, confirmation deadlines, details & edit modals. |
| **04** | **Checkbox Acknowledgement & Reminders** | **COMPLETED** | The core reminder engine: explicit checkbox, Web Audio chime, snooze (5/10/15 min), deadline expiry, SHA-256 event hashing, blockchain queueing, honest browser limits. |
| **05** | **Medication History & Adherence Reports** | **COMPLETED** | Mathematical adherence analytics (`Taken / (Taken + Missed) * 100`), pending dose exclusion, pure SVG circular progress gauge, 7-day SVG trend chart, filterable audit table & CSV export. |
| **06** | **OCR Prescription Scanner** | **COMPLETED** | Tesseract.js prescription scanning, mobile camera capture, candidate regex parsing (medicine, dosage, frequency, instructions), verification sandbox & transfer to schedule. |
| **07** | **Multilingual Support** | **COMPLETED** | Native translation dictionaries for English, Kannada (ಕನ್ನಡ), and Hindi (हिंदी), data-i18n DOM translation engine, persistent selection via localStorage & Supabase profiles. |
| **08** | **Offline Functionality & PWA** | **COMPLETED** | Web App Manifest, Service Worker cache-first application shell, IndexedDB (`MediTrackOfflineDB`) local store, offline event queue, and conflict-safe cloud sync upon reconnection. |
| **09** | **Pharmacy Access** | **COMPLETED** | Verified online pharmacy directory (Apollo Pharmacy, MedPlus Mart), one-click regimen refill search transfer, universal molecule search, mandatory external disclaimers, safe purchasing checklist, and simulated partner REST/GraphQL API gateway. |
| **10** | **Blockchain Verification** | **COMPLETED** | Solidity smart contract (`MedicationVerification.sol`), Ethereum Sepolia testnet integration, MetaMask connector, Ethers.js client, canonical SHA-256 event anchoring, on-chain tamper detection, and academic simulation fallback. |
| **11** | **Caregiver Monitoring** | **COMPLETED** | RLS-enforced caregiver-patient relationship linking, Patient Authorization Center, Monitored Adherence Dashboard, real-time missed-dose alert stream, and strict prohibition on caregiver dose ticking. |
| **12** | **Final Integration & Testing** | **COMPLETED** | Full 12-module end-to-end integration, automated test runner (`verify-all.js`), college viva demonstration script & examiner defense guide (`DEMONSTRATION_GUIDE.md`). |

---

## 4. Complete Project Folder Structure

```text
Remainder/
|-- index.html                        # Healthcare landing page & research foundation
|-- login.html                        # Dedicated authentication login with role selector
|-- register.html                     # Registration portal with strength meter & terms
|-- dashboard.html                    # Responsive master dashboard hosting 10 modular views
|-- server.js                         # Zero-dependency local development server (port 3000)
|-- verify-all.js                     # Automated system integration test suite
|-- DEMONSTRATION_GUIDE.md            # Step-by-step viva presentation & defense guide
|-- README.md                         # Master engineering roadmap & setup documentation
|
|-- assets/
|   |-- css/
|   |   |-- style.css                 # Design tokens, healthcare palette, resets, toasts, modals
|   |   |-- auth.css                  # Form styling, role pills, strength meter
|   |   |-- dashboard.css             # Responsive layout, sidebar drawer, dose cards, stat widgets
|   |
|   |-- js/
|       |-- app.js                    # Global toast manager, modal system, live clock, safe storage
|       |-- auth.js                   # Form validation, password visibility, demo fill helpers
|       |-- dashboard.js              # Sidebar router, view switcher, user snippet
|       |-- medicines.js              # Full CRUD, dynamic schedules, live preview card
|       |-- reminders.js              # Checkbox acknowledgement engine, chime, snooze, SHA-256
|       |-- reports.js                # Adherence math, SVG circular ring, SVG 7-day bar chart
|       |-- history.js                # Filterable audit table, CSV export, hash viewer
|       |-- ocr.js                    # Tesseract.js prescription scanner & candidate regex parser
|       |-- language.js               # Localization dictionaries (English, Kannada, Hindi)
|       |-- offline.js                # IndexedDB store, offline event queue, conflict-safe sync
|       |-- pharmacy.js               # Verified pharmacy links, refill transfer, simulated API
|       |-- caregiver.js              # Caregiver-patient linking, RLS permissions, alert stream
|       |-- blockchain.js             # Ethereum Sepolia, MetaMask, Ethers.js, tamper detection
|       |-- supabase.js               # Supabase PostgreSQL, Auth, Storage & local simulation
|
|-- database/
|   |-- schema.sql                    # Complete PostgreSQL schema (7 tables, triggers, indexes)
|   |-- rls-policies.sql              # Strict Row Level Security policies & storage buckets
|
|-- blockchain/
|   |-- MedicationVerification.sol    # Solidity smart contract for Sepolia testnet
|
|-- pwa/
|   |-- manifest.json                 # Web App Manifest for progressive installation
|   |-- service-worker.js             # App shell caching, fetch interceptor & offline fallback
|
|-- config/
|   |-- config.js                     # Active environment configuration (Supabase & Sepolia)
|   |-- config.example.js             # Configuration template for deployment
```

---

## 5. Module 02: Supabase PostgreSQL Setup Guide

To connect your project to a real Supabase cloud PostgreSQL database:

1. **Create a Free Project:**
   - Sign up at [supabase.com](https://supabase.com) and click **"New Project"**.
2. **Execute Schema & Tables:**
   - Go to the **SQL Editor** in your Supabase Dashboard.
   - Open and copy the contents of [`database/schema.sql`](file:///c:/Users/MallanaGowda%20Patil/OneDrive/Desktop/Remainder/database/schema.sql) and click **RUN**.
   - This creates all 7 tables (`profiles`, `medications`, `medication_schedules`, `medication_events`, `prescriptions`, `caregiver_relationships`, `blockchain_records`), performance indexes, and the user signup trigger.
3. **Apply Row Level Security (RLS) & Storage Policies:**
   - In the **SQL Editor**, open and copy [`database/rls-policies.sql`](file:///c:/Users/MallanaGowda%20Patil/OneDrive/Desktop/Remainder/database/rls-policies.sql) and click **RUN**.
   - This enables strict ownership checks, caregiver access scopes, and creates the private `prescriptions` storage bucket.
4. **Configure Frontend Client:**
   - In Supabase, go to **Project Settings -> API**.
   - Copy your **Project URL** and **anon public key**.
   - Open [`config/config.js`](file:///c:/Users/MallanaGowda%20Patil/OneDrive/Desktop/Remainder/config/config.js) and paste them:
     ```javascript
     window.ENV_CONFIG = {
       SUPABASE_URL: "https://your-project-id.supabase.co",
       SUPABASE_ANON_KEY: "eyJhbGciOi..."
     };
     ```
   - *Security Note: Never paste the `service_role` secret key into client-side code.*
5. **Simulation Mode Fallback:**
   - If credentials are not yet entered, the app functions in **Local Simulation Mode**, allowing seamless demonstration and UI testing without blocking evaluator review.

---

## 6. Module 10: Ethereum Sepolia Smart Contract Deployment Guide (Remix IDE)

To deploy [`blockchain/MedicationVerification.sol`](file:///c:/Users/MallanaGowda%20Patil/OneDrive/Desktop/Remainder/blockchain/MedicationVerification.sol) to Ethereum Sepolia Testnet using the official Remix IDE:

1. **Open Remix IDE:**
   - Navigate to [remix.ethereum.org](https://remix.ethereum.org).
2. **Create Contract File:**
   - In the **File Explorer**, create a new file named `MedicationVerification.sol` under the `contracts/` directory.
   - Copy and paste the full contents of [`blockchain/MedicationVerification.sol`](file:///c:/Users/MallanaGowda%20Patil/OneDrive/Desktop/Remainder/blockchain/MedicationVerification.sol).
3. **Compile the Smart Contract:**
   - Switch to the **Solidity Compiler** tab (left sidebar).
   - Set Compiler Version to `0.8.20` or higher.
   - Click **"Compile MedicationVerification.sol"**.
4. **Deploy to Sepolia Testnet:**
   - Ensure your MetaMask wallet is set to **Ethereum Sepolia Testnet** with a small amount of testnet SepoliaETH (available free from Sepolia faucets like [sepoliafaucet.com](https://sepoliafaucet.com)).
   - In Remix, switch to the **Deploy & Run Transactions** tab.
   - Under **ENVIRONMENT**, select **Injected Provider - MetaMask**.
   - Ensure `MedicationVerification` is selected in the **CONTRACT** dropdown.
   - Click **Deploy** and confirm the transaction in MetaMask.
5. **Update Frontend Configuration:**
   - Copy the deployed contract address from the **Deployed Contracts** section in Remix.
   - Open [`config/config.js`](file:///c:/Users/MallanaGowda%20Patil/OneDrive/Desktop/Remainder/config/config.js) and paste your contract address:
     ```javascript
     BLOCKCHAIN: {
       CONTRACT_ADDRESS: "0xYourDeployedContractAddressHere"
     }
     ```
6. **Academic Simulation Mode:**
   - If MetaMask is not installed or testnet SepoliaETH is unavailable, click **"Activate Simulation Mode 🧪"** in the dashboard to test the full cryptographic anchoring, event hashing, and tamper detection pipeline in high fidelity.

---

## 7. How to Run & Test the Application

You can launch the development server and run tests using standard `npm` or `node` commands:

### Option A: Using NPM (Recommended)
```bash
# Start local development server (serves at http://localhost:3000)
npm start

# Or using npm run dev
npm run dev

# Run automated 12-module integration test suite
npm test
```

### Option B: Using Direct Node.js
```bash
# Start server
node server.js

# Run test suite
node verify-all.js
```

### Accessing the Application:
Open your browser and navigate to:
- **Landing Page:** [http://localhost:3000/index.html](http://localhost:3000/index.html)
- **Sign In Portal:** [http://localhost:3000/login.html](http://localhost:3000/login.html)
- **Registration:** [http://localhost:3000/register.html](http://localhost:3000/register.html)
- **Master Dashboard:** [http://localhost:3000/dashboard.html](http://localhost:3000/dashboard.html)

For a complete step-by-step 15-minute college presentation walkthrough and viva defense Q&A, refer to [`DEMONSTRATION_GUIDE.md`](file:///c:/Users/MallanaGowda%20Patil/OneDrive/Desktop/Remainder/DEMONSTRATION_GUIDE.md).
