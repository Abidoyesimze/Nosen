// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title Nosen Platform
 * @notice Decentralized Professional Income Management Platform
 * @dev Handles verification, reputation, and document generation
 * @dev Indexing handled off-chain via The Graph
 */
contract Nosen is Ownable, ReentrancyGuard, Pausable {
    // ============ STRUCTS ============

    struct IncomeSource {
        uint256 id;
        string name;
        string role;
        uint256 monthlyAmount;
        string token;
        string network;
        string ensDomain;
        bool isVerified;
        uint256 startDate;
        bool isRecurring;
        string frequency;
        string ipfsCid;
        address owner;
        uint256 createdAt;
        bool exists;
        bool isActive;
        // Verification data
        address[] verifiers;
        uint256 verificationThreshold;
        uint256 verificationCount;
        mapping(address => bool) hasVerified;
        // Transaction linking (for frontend)
        string[] transactionHashes; // Store as strings for gas efficiency
        uint256 totalVerifiedAmount;
        uint256 lastVerifiedDate;
    }

    struct Employer {
        uint256 id;
        string name;
        string employerType;
        bool isVerified;
        string contactPerson;
        string email;
        string phone;
        string website;
        string ensDomain;
        address owner;
        uint256 createdAt;
        bool exists;
        bool isActive;
        uint256 totalVerifiedIncome;
        uint256 verifiedUsersCount;
        string[] supportedNetworks;
        string[] supportedTokens;
        // Verification data
        address[] verifiers;
        uint256 verificationThreshold;
        uint256 verificationCount;
        mapping(address => bool) hasVerified;
    }

    struct Document {
        uint256 id;
        string title;
        string docType;
        string purpose;
        string ipfsCid;
        uint256 generatedAt;
        uint256 validUntil;
        uint256 incomeAmount;
        string currency;
        string period;
        string[] networks;
        uint256[] sourceIds;
        bool isVerified;
        address owner;
        bool exists;
        bool isExpired;
        // Verification data
        address[] verifiers;
        uint256 verificationThreshold;
        uint256 verificationCount;
        mapping(address => bool) hasVerified;
        // Transaction proof
        string[] transactionProofs; // IPFS hashes of transaction data
    }

    struct UserReputation {
        address user;
        uint256 reputationScore;
        uint256 verificationsGiven;
        uint256 verificationsReceived;
        uint256 lastActivity;
        bool exists;
    }

    // ============ STATE VARIABLES ============

    uint256 public incomeSourceFee = 0.0005 ether;
    uint256 public employerVerificationFee = 0.002 ether;
    uint256 public documentGenerationFee = 0.0003 ether;

    uint256 public verificationThreshold = 3;
    uint256 public minimumReputationToVerify = 10;

    uint256 public incomeSourceIdCounter = 0;
    uint256 public employerIdCounter = 0;
    uint256 public documentIdCounter = 0;

    // ============ MAPPINGS ============

    mapping(uint256 => IncomeSource) public incomeSources;
    mapping(uint256 => Employer) public employers;
    mapping(uint256 => Document) public documents;
    mapping(address => UserReputation) public userReputations;

    mapping(address => uint256[]) public userIncomeSourceIds;
    mapping(address => uint256[]) public userDocumentIds;
    mapping(address => uint256[]) public userEmployerIds;

    // ============ EVENTS ============

    event IncomeSourceAdded(
        address indexed user,
        uint256 sourceId,
        string name,
        string network
    );
    event IncomeSourceUpdated(address indexed user, uint256 sourceId);
    event IncomeSourceVerified(
        uint256 indexed sourceId,
        address indexed verifier,
        uint256 verificationCount
    );
    event IncomeSourceDeactivated(uint256 indexed sourceId);
    event IncomeSourceReactivated(uint256 indexed sourceId);
    event TransactionLinked(uint256 indexed sourceId, string transactionHash);

    event EmployerAdded(
        uint256 indexed employerId,
        string name,
        string employerType
    );
    event EmployerVerified(
        uint256 indexed employerId,
        address indexed verifier,
        uint256 verificationCount
    );
    event EmployerUpdated(uint256 indexed employerId);
    event EmployerDeactivated(uint256 indexed employerId);

    event DocumentGenerated(
        uint256 indexed documentId,
        address indexed owner,
        string docType
    );
    event DocumentVerified(
        uint256 indexed documentId,
        address indexed verifier,
        uint256 verificationCount
    );
    event DocumentUpdated(uint256 indexed documentId);
    event DocumentExpired(uint256 indexed documentId);

    event UserReputationUpdated(
        address indexed user,
        uint256 newScore,
        uint256 verificationsGiven
    );
    event VerificationThresholdUpdated(uint256 newThreshold);
    event MinimumReputationUpdated(uint256 newReputation);

    // ============ MODIFIERS ============

    modifier onlyIncomeSourceOwner(uint256 sourceId) {
        require(incomeSources[sourceId].exists, "Income source not found");
        require(incomeSources[sourceId].owner == msg.sender, "Not owner");
        _;
    }

    modifier onlyDocumentOwner(uint256 documentId) {
        require(documents[documentId].exists, "Document not found");
        require(documents[documentId].owner == msg.sender, "Not owner");
        _;
    }

    modifier onlyEmployerOwner(uint256 employerId) {
        require(employers[employerId].exists, "Employer not found");
        require(employers[employerId].owner == msg.sender, "Not owner");
        _;
    }

    modifier hasMinimumReputation() {
        require(
            userReputations[msg.sender].reputationScore >=
                minimumReputationToVerify,
            "Insufficient reputation"
        );
        _;
    }

    modifier notAlreadyVerified(uint256 itemId, string memory itemType) {
        if (keccak256(bytes(itemType)) == keccak256(bytes("income"))) {
            require(
                !incomeSources[itemId].hasVerified[msg.sender],
                "Already verified"
            );
        } else if (keccak256(bytes(itemType)) == keccak256(bytes("employer"))) {
            require(
                !employers[itemId].hasVerified[msg.sender],
                "Already verified"
            );
        } else if (keccak256(bytes(itemType)) == keccak256(bytes("document"))) {
            require(
                !documents[itemId].hasVerified[msg.sender],
                "Already verified"
            );
        }
        _;
    }

    modifier itemExists(uint256 itemId, string memory itemType) {
        if (keccak256(bytes(itemType)) == keccak256(bytes("income"))) {
            require(incomeSources[itemId].exists, "Income source not found");
        } else if (keccak256(bytes(itemType)) == keccak256(bytes("employer"))) {
            require(employers[itemId].exists, "Employer not found");
        } else if (keccak256(bytes(itemType)) == keccak256(bytes("document"))) {
            require(documents[itemId].exists, "Document not found");
        }
        _;
    }

    // ============ CONSTRUCTOR ============

    constructor() Ownable(msg.sender) {
        userReputations[msg.sender] = UserReputation({
            user: msg.sender,
            reputationScore: 100,
            verificationsGiven: 0,
            verificationsReceived: 0,
            lastActivity: block.timestamp,
            exists: true
        });
    }

    // ============ INCOME SOURCE MANAGEMENT ============
    function addIncomeSource(
        string memory name,
        string memory role,
        uint256 monthlyAmount,
        string memory token,
        string memory network,
        string memory ensDomain,
        bool isRecurring,
        string memory frequency,
        string memory ipfsCid
    ) external payable nonReentrant whenNotPaused {
        require(msg.value >= incomeSourceFee, "Insufficient fee");
        require(bytes(name).length > 0, "Name required");
        require(monthlyAmount > 0, "Amount must be positive");
        require(bytes(network).length > 0, "Network required");
        require(bytes(ipfsCid).length > 0, "IPFS CID required");
        require(bytes(frequency).length > 0, "Frequency required");

        if (!userReputations[msg.sender].exists) {
            userReputations[msg.sender] = UserReputation({
                user: msg.sender,
                reputationScore: 5,
                verificationsGiven: 0,
                verificationsReceived: 0,
                lastActivity: block.timestamp,
                exists: true
            });
        }

        incomeSourceIdCounter++;

        IncomeSource storage newSource = incomeSources[incomeSourceIdCounter];
        newSource.id = incomeSourceIdCounter;
        newSource.name = name;
        newSource.role = role;
        newSource.monthlyAmount = monthlyAmount;
        newSource.token = token;
        newSource.network = network;
        newSource.ensDomain = ensDomain;
        newSource.isVerified = false;
        newSource.startDate = block.timestamp;
        newSource.isRecurring = isRecurring;
        newSource.frequency = frequency;
        newSource.ipfsCid = ipfsCid;
        newSource.owner = msg.sender;
        newSource.createdAt = block.timestamp;
        newSource.exists = true;
        newSource.isActive = true;
        newSource.verificationThreshold = verificationThreshold;
        newSource.verificationCount = 0;
        newSource.transactionHashes = new string[](0);
        newSource.totalVerifiedAmount = 0;
        newSource.lastVerifiedDate = 0;

        userIncomeSourceIds[msg.sender].push(incomeSourceIdCounter);

        emit IncomeSourceAdded(
            msg.sender,
            incomeSourceIdCounter,
            name,
            network
        );

        if (msg.value > incomeSourceFee) {
            payable(msg.sender).transfer(msg.value - incomeSourceFee);
        }
    }

    function updateIncomeSource(
        uint256 sourceId,
        string memory name,
        string memory role,
        uint256 monthlyAmount,
        string memory token,
        string memory network,
        string memory ensDomain,
        bool isRecurring,
        string memory frequency,
        string memory ipfsCid
    ) external onlyIncomeSourceOwner(sourceId) whenNotPaused {
        require(bytes(name).length > 0, "Name required");
        require(monthlyAmount > 0, "Amount must be positive");
        require(bytes(network).length > 0, "Network required");
        require(bytes(ipfsCid).length > 0, "IPFS CID required");
        require(bytes(frequency).length > 0, "Frequency required");

        IncomeSource storage source = incomeSources[sourceId];
        source.name = name;
        source.role = role;
        source.monthlyAmount = monthlyAmount;
        source.token = token;
        source.network = network;
        source.ensDomain = ensDomain;
        source.isRecurring = isRecurring;
        source.frequency = frequency;
        source.ipfsCid = ipfsCid;

        if (source.isVerified) {
            source.isVerified = false;
            source.verificationCount = 0;
            delete source.verifiers;
        }

        emit IncomeSourceUpdated(msg.sender, sourceId);
    }

    function verifyIncomeSource(
        uint256 sourceId
    )
        external
        hasMinimumReputation
        notAlreadyVerified(sourceId, "income")
        itemExists(sourceId, "income")
        whenNotPaused
    {
        require(
            incomeSources[sourceId].owner != msg.sender,
            "Cannot verify own income source"
        );
        require(!incomeSources[sourceId].isVerified, "Already verified");

        IncomeSource storage source = incomeSources[sourceId];
        source.hasVerified[msg.sender] = true;
        source.verifiers.push(msg.sender);
        source.verificationCount++;

        userReputations[msg.sender].verificationsGiven++;
        userReputations[msg.sender].reputationScore += 2;
        userReputations[msg.sender].lastActivity = block.timestamp;

        if (source.verificationCount >= source.verificationThreshold) {
            source.isVerified = true;
            userReputations[source.owner].verificationsReceived++;
            userReputations[source.owner].reputationScore += 5;
            userReputations[source.owner].lastActivity = block.timestamp;
        }

        emit IncomeSourceVerified(
            sourceId,
            msg.sender,
            source.verificationCount
        );
        emit UserReputationUpdated(
            msg.sender,
            userReputations[msg.sender].reputationScore,
            userReputations[msg.sender].verificationsGiven
        );
    }

    function linkTransactionToSource(
        uint256 sourceId,
        string memory transactionHash
    ) external onlyIncomeSourceOwner(sourceId) whenNotPaused {
        require(incomeSources[sourceId].exists, "Income source not found");
        require(bytes(transactionHash).length > 0, "Transaction hash required");

        IncomeSource storage source = incomeSources[sourceId];
        source.transactionHashes.push(transactionHash);

        emit TransactionLinked(sourceId, transactionHash);
    }

    function deactivateIncomeSource(
        uint256 sourceId
    ) external onlyIncomeSourceOwner(sourceId) whenNotPaused {
        require(incomeSources[sourceId].exists, "Income source not found");
        incomeSources[sourceId].isActive = false;
        emit IncomeSourceDeactivated(sourceId);
    }

    function reactivateIncomeSource(
        uint256 sourceId
    ) external onlyIncomeSourceOwner(sourceId) whenNotPaused {
        require(incomeSources[sourceId].exists, "Income source not found");
        require(!incomeSources[sourceId].isActive, "Already active");
        incomeSources[sourceId].isActive = true;
        emit IncomeSourceReactivated(sourceId);
    }

    // ============ EMPLOYER MANAGEMENT ============

    function addEmployer(
        string memory name,
        string memory employerType,
        string memory contactPerson,
        string memory email,
        string memory phone,
        string memory website,
        string memory ensDomain,
        string memory ipfsCid,
        string[] memory supportedNetworks,
        string[] memory supportedTokens
    ) external payable nonReentrant whenNotPaused {
        require(msg.value >= employerVerificationFee, "Insufficient fee");
        require(bytes(name).length > 0, "Name required");
        require(bytes(employerType).length > 0, "Type required");
        require(bytes(ipfsCid).length > 0, "IPFS CID required");
        require(supportedNetworks.length > 0, "Supported networks required");
        require(supportedTokens.length > 0, "Supported tokens required");

        if (!userReputations[msg.sender].exists) {
            userReputations[msg.sender] = UserReputation({
                user: msg.sender,
                reputationScore: 5,
                verificationsGiven: 0,
                verificationsReceived: 0,
                lastActivity: block.timestamp,
                exists: true
            });
        }

        employerIdCounter++;

        Employer storage newEmployer = employers[employerIdCounter];
        newEmployer.id = employerIdCounter;
        newEmployer.name = name;
        newEmployer.employerType = employerType;
        newEmployer.isVerified = false;
        newEmployer.contactPerson = contactPerson;
        newEmployer.email = email;
        newEmployer.phone = phone;
        newEmployer.website = website;
        newEmployer.ensDomain = ensDomain;
        newEmployer.owner = msg.sender;
        newEmployer.createdAt = block.timestamp;
        newEmployer.exists = true;
        newEmployer.isActive = true;
        newEmployer.totalVerifiedIncome = 0;
        newEmployer.verifiedUsersCount = 0;
        newEmployer.supportedNetworks = supportedNetworks;
        newEmployer.supportedTokens = supportedTokens;
        newEmployer.verificationThreshold = verificationThreshold;
        newEmployer.verificationCount = 0;

        userEmployerIds[msg.sender].push(employerIdCounter);

        emit EmployerAdded(employerIdCounter, name, employerType);

        if (msg.value > employerVerificationFee) {
            payable(msg.sender).transfer(msg.value - employerVerificationFee);
        }
    }

    function verifyEmployer(
        uint256 employerId
    )
        external
        hasMinimumReputation
        notAlreadyVerified(employerId, "employer")
        itemExists(employerId, "employer")
        whenNotPaused
    {
        require(
            employers[employerId].owner != msg.sender,
            "Cannot verify own employer"
        );
        require(!employers[employerId].isVerified, "Already verified");

        Employer storage employer = employers[employerId];
        employer.hasVerified[msg.sender] = true;
        employer.verifiers.push(msg.sender);
        employer.verificationCount++;

        userReputations[msg.sender].verificationsGiven++;
        userReputations[msg.sender].reputationScore += 2;
        userReputations[msg.sender].lastActivity = block.timestamp;

        if (employer.verificationCount >= employer.verificationThreshold) {
            employer.isVerified = true;
            userReputations[employer.owner].verificationsReceived++;
            userReputations[employer.owner].reputationScore += 5;
            userReputations[employer.owner].lastActivity = block.timestamp;
        }

        emit EmployerVerified(
            employerId,
            msg.sender,
            employer.verificationCount
        );
        emit UserReputationUpdated(
            msg.sender,
            userReputations[msg.sender].reputationScore,
            userReputations[msg.sender].verificationsGiven
        );
    }

    function updateEmployer(
        uint256 employerId,
        string memory name,
        string memory employerType,
        string memory contactPerson,
        string memory email,
        string memory phone,
        string memory website,
        string memory ensDomain,
        string[] memory supportedNetworks,
        string[] memory supportedTokens
    ) external onlyEmployerOwner(employerId) whenNotPaused {
        require(bytes(name).length > 0, "Name required");
        require(bytes(employerType).length > 0, "Type required");
        require(supportedNetworks.length > 0, "Supported networks required");
        require(supportedTokens.length > 0, "Supported tokens required");

        Employer storage employer = employers[employerId];
        employer.name = name;
        employer.employerType = employerType;
        employer.contactPerson = contactPerson;
        employer.email = email;
        employer.phone = phone;
        employer.website = website;
        employer.ensDomain = ensDomain;
        employer.supportedNetworks = supportedNetworks;
        employer.supportedTokens = supportedTokens;

        if (employer.isVerified) {
            employer.isVerified = false;
            employer.verificationCount = 0;
            delete employer.verifiers;
        }

        emit EmployerUpdated(employerId);
    }

    function deactivateEmployer(
        uint256 employerId
    ) external onlyEmployerOwner(employerId) whenNotPaused {
        require(employers[employerId].exists, "Employer not found");
        employers[employerId].isActive = false;
        emit EmployerDeactivated(employerId);
    }

    function updateDocument(
        uint256 documentId,
        string memory title,
        string memory purpose,
        string memory ipfsCid,
        uint256 validUntil,
        uint256 incomeAmount,
        string memory currency,
        string memory period
    ) external onlyDocumentOwner(documentId) whenNotPaused {
        require(bytes(title).length > 0, "Title required");
        require(bytes(ipfsCid).length > 0, "IPFS CID required");
        require(validUntil > block.timestamp, "Invalid expiry date");
        require(incomeAmount > 0, "Amount must be positive");

        Document storage doc = documents[documentId];
        doc.title = title;
        doc.purpose = purpose;
        doc.ipfsCid = ipfsCid;
        doc.validUntil = validUntil;
        doc.incomeAmount = incomeAmount;
        doc.currency = currency;
        doc.period = period;

        if (doc.isVerified) {
            doc.isVerified = false;
            doc.verificationCount = 0;
            delete doc.verifiers;
        }

        emit DocumentUpdated(documentId);
    }

    function checkDocumentExpiry(
        uint256 documentId
    ) external view returns (bool) {
        require(documents[documentId].exists, "Document not found");
        return block.timestamp > documents[documentId].validUntil;
    }

    // ============ REPUTATION SYSTEM ============

    function getUserReputation(
        address user
    )
        external
        view
        returns (
            uint256 reputationScore,
            uint256 verificationsGiven,
            uint256 verificationsReceived,
            uint256 lastActivity
        )
    {
        UserReputation memory rep = userReputations[user];
        return (
            rep.reputationScore,
            rep.verificationsGiven,
            rep.verificationsReceived,
            rep.lastActivity
        );
    }

    function canUserVerify(address user) external view returns (bool) {
        return
            userReputations[user].reputationScore >= minimumReputationToVerify;
    }

    function getVerificationProgress(
        uint256 itemId,
        string memory itemType
    )
        external
        view
        returns (uint256 currentCount, uint256 threshold, bool isVerified)
    {
        if (keccak256(bytes(itemType)) == keccak256(bytes("income"))) {
            IncomeSource storage source = incomeSources[itemId];
            return (
                source.verificationCount,
                source.verificationThreshold,
                source.isVerified
            );
        } else if (keccak256(bytes(itemType)) == keccak256(bytes("employer"))) {
            Employer storage employer = employers[itemId];
            return (
                employer.verificationCount,
                employer.verificationThreshold,
                employer.isVerified
            );
        } else if (keccak256(bytes(itemType)) == keccak256(bytes("document"))) {
            Document storage doc = documents[itemId];
            return (
                doc.verificationCount,
                doc.verificationThreshold,
                doc.isVerified
            );
        }
        revert("Invalid item type");
    }

    // ============ VIEW FUNCTIONS ============

    function getUserIncomeSources(
        address user
    ) external view returns (uint256[] memory) {
        return userIncomeSourceIds[user];
    }

    function getIncomeSource(
        uint256 sourceId
    )
        external
        view
        returns (
            uint256 id,
            string memory name,
            string memory role,
            uint256 monthlyAmount,
            string memory token,
            string memory network,
            string memory ensDomain,
            bool isVerified,
            uint256 startDate,
            bool isRecurring,
            string memory frequency,
            string memory ipfsCid,
            address owner,
            uint256 createdAt,
            bool isActive,
            uint256 verificationCount,
            uint256 verificationThreshold,
            uint256 transactionCount
        )
    {
        IncomeSource storage source = incomeSources[sourceId];
        return (
            source.id,
            source.name,
            source.role,
            source.monthlyAmount,
            source.token,
            source.network,
            source.ensDomain,
            source.isVerified,
            source.startDate,
            source.isRecurring,
            source.frequency,
            source.ipfsCid,
            source.owner,
            source.createdAt,
            source.isActive,
            source.verificationCount,
            source.verificationThreshold,
            source.transactionHashes.length
        );
    }

    function getIncomeSourceTransactions(
        uint256 sourceId
    ) external view returns (string[] memory) {
        require(incomeSources[sourceId].exists, "Income source not found");
        return incomeSources[sourceId].transactionHashes;
    }

    function getUserDocuments(
        address user
    ) external view returns (uint256[] memory) {
        return userDocumentIds[user];
    }

    function getDocument(
        uint256 documentId
    )
        external
        view
        returns (
            uint256 id,
            string memory title,
            string memory docType,
            string memory purpose,
            string memory ipfsCid,
            uint256 generatedAt,
            uint256 validUntil,
            uint256 incomeAmount,
            string memory currency,
            string memory period,
            bool isVerified,
            address owner,
            bool isExpired,
            uint256 verificationCount,
            uint256 verificationThreshold
        )
    {
        Document storage doc = documents[documentId];
        return (
            doc.id,
            doc.title,
            doc.docType,
            doc.purpose,
            doc.ipfsCid,
            doc.generatedAt,
            doc.validUntil,
            doc.incomeAmount,
            doc.currency,
            doc.period,
            doc.isVerified,
            doc.owner,
            doc.isExpired,
            doc.verificationCount,
            doc.verificationThreshold
        );
    }

    function getUserEmployers(
        address user
    ) external view returns (uint256[] memory) {
        return userEmployerIds[user];
    }

    function getEmployer(
        uint256 employerId
    )
        external
        view
        returns (
            uint256 id,
            string memory name,
            string memory employerType,
            bool isVerified,
            string memory contactPerson,
            string memory email,
            string memory phone,
            string memory website,
            string memory ensDomain,
            address owner,
            uint256 createdAt,
            bool isActive,
            uint256 totalVerifiedIncome,
            uint256 verifiedUsersCount,
            uint256 verificationCount,
            uint256 verificationThreshold
        )
    {
        Employer storage employer = employers[employerId];
        return (
            employer.id,
            employer.name,
            employer.employerType,
            employer.isVerified,
            employer.contactPerson,
            employer.email,
            employer.phone,
            employer.website,
            employer.ensDomain,
            employer.owner,
            employer.createdAt,
            employer.isActive,
            employer.totalVerifiedIncome,
            employer.verifiedUsersCount,
            employer.verificationCount,
            employer.verificationThreshold
        );
    }

    function isIncomeSourceVerified(
        uint256 sourceId
    ) external view returns (bool) {
        return incomeSources[sourceId].isVerified;
    }

    function isDocumentVerified(
        uint256 documentId
    ) external view returns (bool) {
        return documents[documentId].isVerified;
    }

    function isEmployerVerified(
        uint256 employerId
    ) external view returns (bool) {
        return employers[employerId].isVerified;
    }

    function getIncomeSourceCount(
        address user
    ) external view returns (uint256) {
        return userIncomeSourceIds[user].length;
    }

    function getDocumentCount(address user) external view returns (uint256) {
        return userDocumentIds[user].length;
    }

    function getEmployerCount(address user) external view returns (uint256) {
        return userEmployerIds[user].length;
    }

    // ============ ADMIN FUNCTIONS ============

    function updateVerificationThreshold(
        uint256 newThreshold
    ) external onlyOwner {
        require(newThreshold >= 2, "Threshold too low");
        require(newThreshold <= 10, "Threshold too high");
        verificationThreshold = newThreshold;
        emit VerificationThresholdUpdated(newThreshold);
    }

    function updateMinimumReputation(uint256 newReputation) external onlyOwner {
        require(newReputation >= 5, "Reputation too low");
        require(newReputation <= 50, "Reputation too high");
        minimumReputationToVerify = newReputation;
        emit MinimumReputationUpdated(newReputation);
    }

    function updateFees(
        uint256 newIncomeSourceFee,
        uint256 newEmployerFee,
        uint256 newDocumentFee
    ) external onlyOwner {
        incomeSourceFee = newIncomeSourceFee;
        employerVerificationFee = newEmployerFee;
        documentGenerationFee = newDocumentFee;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        payable(owner()).transfer(balance);
    }

    // ============ UTILITY FUNCTIONS ============

    function getContractStats()
        external
        view
        returns (
            uint256 totalIncomeSources,
            uint256 totalEmployers,
            uint256 totalDocuments,
            uint256 totalVerifiedIncomeSources,
            uint256 totalVerifiedEmployers,
            uint256 totalVerifiedDocuments
        )
    {
        uint256 verifiedSources = 0;
        uint256 verifiedEmployers = 0;
        uint256 verifiedDocs = 0;

        for (uint256 i = 1; i <= incomeSourceIdCounter; i++) {
            if (incomeSources[i].exists && incomeSources[i].isVerified) {
                verifiedSources++;
            }
        }

        for (uint256 i = 1; i <= employerIdCounter; i++) {
            if (employers[i].exists && employers[i].isVerified) {
                verifiedEmployers++;
            }
        }

        for (uint256 i = 1; i <= documentIdCounter; i++) {
            if (documents[i].exists && documents[i].isVerified) {
                verifiedDocs++;
            }
        }

        return (
            incomeSourceIdCounter,
            employerIdCounter,
            documentIdCounter,
            verifiedSources,
            verifiedEmployers,
            verifiedDocs
        );
    }

    function getIncomeSourceStats(
        address user
    )
        external
        view
        returns (
            uint256 totalSources,
            uint256 verifiedSources,
            uint256 totalMonthlyIncome,
            uint256 totalTransactions
        )
    {
        uint256[] memory sourceIds = userIncomeSourceIds[user];
        uint256 verified = 0;
        uint256 totalIncome = 0;
        uint256 totalTxs = 0;

        for (uint256 i = 0; i < sourceIds.length; i++) {
            if (incomeSources[sourceIds[i]].isVerified) {
                verified++;
                totalIncome += incomeSources[sourceIds[i]].monthlyAmount;
            }
            totalTxs += incomeSources[sourceIds[i]].transactionHashes.length;
        }

        return (sourceIds.length, verified, totalIncome, totalTxs);
    }

    function getDocumentStats(
        address user
    )
        external
        view
        returns (
            uint256 totalDocuments,
            uint256 verifiedDocuments,
            uint256 expiredDocuments,
            uint256 validDocuments
        )
    {
        uint256[] memory docIds = userDocumentIds[user];
        uint256 verified = 0;
        uint256 expired = 0;
        uint256 valid = 0;

        for (uint256 i = 0; i < docIds.length; i++) {
            if (documents[docIds[i]].isVerified) {
                verified++;
            }
            if (block.timestamp > documents[docIds[i]].validUntil) {
                expired++;
            } else {
                valid++;
            }
        }

        return (docIds.length, verified, expired, valid);
    }

    // ============ RECEIVE FUNCTION ============

    receive() external payable {}
}
