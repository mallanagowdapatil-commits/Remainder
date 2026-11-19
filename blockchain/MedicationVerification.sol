// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MedicationVerification
 * @dev Smart Contract for Cryptographic Medication Event Integrity Verification
 * 
 * DESIGN PRINCIPLE:
 * This smart contract stores immutable cryptographic event digests (SHA-256) of
 * medication intake acknowledgements. It mathematically proves the timestamp and payload
 * integrity of a recorded event — ensuring that an event was not forged, altered,
 * or backdated after recording.
 * 
 * PRIVACY & CLINICAL NOTICE:
 * 1. Zero Personal Data On-Chain: Only a deterministic SHA-256 hash, UUID, dose status,
 *    and timestamps are anchored. No patient names, medicine names, or prescriptions are stored.
 * 2. An on-chain record proves cryptographic integrity and timestamp existence;
 *    it does not physically or biologically prove that a patient swallowed medication.
 */
contract MedicationVerification {

    // --- Data Structures ---
    struct MedicationRecord {
        bytes32 eventHash;       // Canonical SHA-256 digest of dose event
        address recorder;        // Ethereum wallet address of the patient or caregiver
        string eventId;          // Unique UUID of the medication event
        string doseStatus;       // Ingestion status: 'TAKEN' or 'MISSED'
        uint256 blockTimestamp;  // Immutable Ethereum block timestamp (seconds since Unix epoch)
        uint256 recordedAt;      // Client application reported timestamp (seconds)
        bool exists;             // Existence indicator
    }

    // --- State Variables ---
    address public immutable owner;
    
    // Mapping from canonical eventHash to MedicationRecord
    mapping(bytes32 => MedicationRecord) private records;

    // Mapping to guarantee uniqueness and prevent duplicate submissions
    mapping(bytes32 => bool) public isHashRecorded;

    // Ordered list of all anchored event hashes for auditing
    bytes32[] public recordedHashes;

    // Mapping of patient wallet address to their recorded event hashes
    mapping(address => bytes32[]) private patientHashes;

    // --- Events ---
    event MedicationEventAnchored(
        bytes32 indexed eventHash,
        address indexed recorder,
        string eventId,
        string doseStatus,
        uint256 blockTimestamp
    );

    // --- Custom Errors ---
    error DuplicateEventHash(bytes32 hash);
    error EventNotFound(bytes32 hash);
    error EmptyEventHash();
    error InvalidStatus();

    // --- Constructor ---
    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Anchor a canonical medication event hash on Ethereum Sepolia
     * @dev Reverts if the identical event hash was previously recorded
     * @param _eventHash 32-byte canonical SHA-256 hash of the medication event
     * @param _eventId UUID of the event record in MediTrack
     * @param _doseStatus Dose status: must be 'TAKEN' or 'MISSED'
     * @param _recordedAt Unix epoch timestamp in seconds when the user acknowledged the dose
     */
    function recordEvent(
        bytes32 _eventHash,
        string calldata _eventId,
        string calldata _doseStatus,
        uint256 _recordedAt
    ) external returns (bool) {
        if (_eventHash == bytes32(0)) {
            revert EmptyEventHash();
        }

        // Strict duplicate prevention
        if (isHashRecorded[_eventHash]) {
            revert DuplicateEventHash(_eventHash);
        }

        // Validate status string
        bytes32 statusHash = keccak256(bytes(_doseStatus));
        if (statusHash != keccak256(bytes("TAKEN")) && statusHash != keccak256(bytes("MISSED"))) {
            revert InvalidStatus();
        }

        // Construct immutable on-chain record
        MedicationRecord memory newRecord = MedicationRecord({
            eventHash: _eventHash,
            recorder: msg.sender,
            eventId: _eventId,
            doseStatus: _doseStatus,
            blockTimestamp: block.timestamp,
            recordedAt: _recordedAt,
            exists: true
        });

        records[_eventHash] = newRecord;
        isHashRecorded[_eventHash] = true;
        recordedHashes.push(_eventHash);
        patientHashes[msg.sender].push(_eventHash);

        emit MedicationEventAnchored(
            _eventHash,
            msg.sender,
            _eventId,
            _doseStatus,
            block.timestamp
        );

        return true;
    }

    /**
     * @notice Publicly verify any medication event hash against Ethereum blockchain
     * @dev Anyone can query this view function without paying gas
     * @param _eventHash The 32-byte SHA-256 hash to audit
     */
    function verifyEvent(bytes32 _eventHash)
        external
        view
        returns (
            bool exists,
            address recorder,
            string memory eventId,
            string memory doseStatus,
            uint256 blockTimestamp,
            uint256 recordedAt
        )
    {
        MedicationRecord memory record = records[_eventHash];
        if (!record.exists) {
            return (false, address(0), "", "", 0, 0);
        }

        return (
            true,
            record.recorder,
            record.eventId,
            record.doseStatus,
            record.blockTimestamp,
            record.recordedAt
        );
    }

    /**
     * @notice Get total count of anchored medication events
     */
    function getTotalRecords() external view returns (uint256) {
        return recordedHashes.length;
    }

    /**
     * @notice Get all event hashes anchored by a specific patient wallet
     */
    function getPatientHashes(address _patient) external view returns (bytes32[] memory) {
        return patientHashes[_patient];
    }
}
