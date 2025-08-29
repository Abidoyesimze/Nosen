// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title Nosen
 * @notice ENS Professional Identity & DAO Verification
 *
 * Core Features:
 * 1. Get yourname.nosen.eth for professional identity
 * 2. DAOs can verify users and issue attestations
 * 3. Build verifiable work history
 */
// ============ ENS INTERFACES ============
interface IENSRegistry {
    function setSubnodeRecord(
        bytes32 node,
        bytes32 label,
        address owner,
        address resolver,
        uint64 ttl
    ) external;

    function setSubnodeOwner(
        bytes32 node,
        bytes32 label,
        address owner
    ) external returns (bytes32);
}

interface IENSResolver {
    function setAddr(bytes32 node, address addr) external;

    function setText(
        bytes32 node,
        string calldata key,
        string calldata value
    ) external;
}

contract Nosen is Ownable, ReentrancyGuard, Pausable {
    // ============ STATE VARIABLES ============
    IENSRegistry public ensRegistry;
    IENSResolver public ensResolver;
    bytes32 public mainDomainNode; // e.g., "nosen.eth"

    uint256 public subdomainFee = 0.01 ether;
    uint256 public subdomainDuration = 365 days;
    bool public testMode = false;

    // ============ MAPPINGS ============
    mapping(string => SubdomainInfo) public subdomains;
    mapping(address => string[]) public userSubdomains;
    mapping(address => bool) public verifiedDAOs;
    mapping(bytes32 => Proof) public proofs;
    mapping(address => bytes32[]) public userProofs;
    mapping(address => uint256) public userProofNonce;

    // ============ STRUCTS ============
    struct SubdomainInfo {
        address owner;
        uint256 expiry;
        bool verified;
        address verifiedBy;
        string verificationNote;
    }

    struct Proof {
        address issuer;
        string ipfsCid;
        uint256 timestamp;
        bool verified;
        address[] verifiers;
        bool exists;
    }

    // ============ EVENTS ============
    event SubdomainRegistered(string subdomain, address owner);
    event SubdomainVerified(string subdomain, address dao, string note);
    event ProofAnchored(bytes32 proofId, address issuer, string ipfsCid);
    event ProofVerified(bytes32 proofId, address verifier);

    // ============ CONSTRUCTOR ============
    constructor() Ownable(msg.sender) {}

    // ============ ADMIN FUNCTIONS ============
    function setENSAddresses(
        address registry,
        address resolver,
        bytes32 domainNode
    ) external onlyOwner {
        ensRegistry = IENSRegistry(registry);
        ensResolver = IENSResolver(resolver);
        mainDomainNode = domainNode;
    }

    function setVerifiedDAO(address dao, bool status) external onlyOwner {
        verifiedDAOs[dao] = status;
    }

    function updateFee(uint256 newFee) external onlyOwner {
        subdomainFee = newFee;
    }

    function setTestMode(bool enabled) external onlyOwner {
        testMode = enabled;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ SUBDOMAIN REGISTRATION ============
    function registerSubdomain(
        string calldata subdomain
    ) external payable whenNotPaused nonReentrant {
        require(msg.value >= subdomainFee, "Insufficient fee");
        require(
            bytes(subdomain).length > 0 && bytes(subdomain).length <= 63,
            "Invalid length"
        );
        require(subdomains[subdomain].owner == address(0), "Taken");
        require(_isValidSubdomain(subdomain), "Invalid format");

        // Register in ENS (skip in test mode)
        if (!testMode) {
            bytes32 labelHash = keccak256(abi.encodePacked(subdomain));
            bytes32 subdomainNode = ensRegistry.setSubnodeOwner(
                mainDomainNode,
                labelHash,
                address(this)
            );

            // Set resolver and records
            ensRegistry.setSubnodeRecord(
                mainDomainNode,
                labelHash,
                address(this),
                address(ensResolver),
                0
            );
            ensResolver.setAddr(subdomainNode, msg.sender);
            ensResolver.setText(
                subdomainNode,
                "description",
                "Nosen Professional Identity"
            );

            // Transfer ownership to user
            ensRegistry.setSubnodeOwner(mainDomainNode, labelHash, msg.sender);
        }

        // Store locally
        subdomains[subdomain] = SubdomainInfo({
            owner: msg.sender,
            expiry: block.timestamp + subdomainDuration,
            verified: false,
            verifiedBy: address(0),
            verificationNote: ""
        });

        userSubdomains[msg.sender].push(subdomain);

        emit SubdomainRegistered(subdomain, msg.sender);

        // Refund excess
        if (msg.value > subdomainFee) {
            payable(msg.sender).transfer(msg.value - subdomainFee);
        }
    }

    // ============ DAO VERIFICATION ============
    function verifySubdomain(
        string calldata subdomain,
        string calldata note
    ) external {
        require(verifiedDAOs[msg.sender], "Not verified DAO");
        require(
            subdomains[subdomain].owner != address(0),
            "Subdomain not found"
        );
        require(!subdomains[subdomain].verified, "Already verified");

        subdomains[subdomain].verified = true;
        subdomains[subdomain].verifiedBy = msg.sender;
        subdomains[subdomain].verificationNote = note;

        // Update ENS record (skip in test mode)
        if (!testMode) {
            bytes32 labelHash = keccak256(abi.encodePacked(subdomain));
            bytes32 subdomainNode = ensRegistry.setSubnodeOwner(
                mainDomainNode,
                labelHash,
                address(this)
            );
            ensResolver.setText(subdomainNode, "verified", "true");
            ensResolver.setText(subdomainNode, "verifiedBy", note);
            ensRegistry.setSubnodeOwner(
                mainDomainNode,
                labelHash,
                subdomains[subdomain].owner
            );
        }

        emit SubdomainVerified(subdomain, msg.sender, note);
    }

    // ============ PROOF SYSTEM ============
    function anchorProof(
        string calldata ipfsCid
    ) external whenNotPaused returns (bytes32) {
        bytes32 proofId = keccak256(
            abi.encodePacked(msg.sender, ipfsCid, userProofNonce[msg.sender])
        );

        proofs[proofId] = Proof({
            issuer: msg.sender,
            ipfsCid: ipfsCid,
            timestamp: block.timestamp,
            verified: false,
            verifiers: new address[](0),
            exists: true
        });

        userProofs[msg.sender].push(proofId);
        userProofNonce[msg.sender]++;

        emit ProofAnchored(proofId, msg.sender, ipfsCid);
        return proofId;
    }

    function verifyProof(bytes32 proofId) external {
        require(verifiedDAOs[msg.sender], "Not verified DAO");
        require(proofs[proofId].exists, "Proof not found");

        Proof storage proof = proofs[proofId];
        require(!_hasVerified(proof, msg.sender), "Already verified");

        proof.verifiers.push(msg.sender);
        if (proof.verifiers.length >= 2) {
            proof.verified = true;
        }

        emit ProofVerified(proofId, msg.sender);
    }

    // ============ VIEW FUNCTIONS ============
    function getSubdomainInfo(
        string calldata subdomain
    ) external view returns (SubdomainInfo memory) {
        return subdomains[subdomain];
    }

    function getUserSubdomains(
        address user
    ) external view returns (string[] memory) {
        return userSubdomains[user];
    }

    function getProof(bytes32 proofId) external view returns (Proof memory) {
        return proofs[proofId];
    }

    function getUserProofs(
        address user
    ) external view returns (bytes32[] memory) {
        return userProofs[user];
    }

    function isSubdomainAvailable(
        string calldata subdomain
    ) external view returns (bool) {
        return subdomains[subdomain].owner == address(0);
    }

    // ============ INTERNAL FUNCTIONS ============
    function _isValidSubdomain(
        string memory subdomain
    ) internal pure returns (bool) {
        bytes memory b = bytes(subdomain);
        if (b.length == 0 || b[0] == "-" || b[b.length - 1] == "-")
            return false;

        for (uint256 i = 0; i < b.length; i++) {
            bytes1 char = b[i];
            if (
                !(char >= 0x30 && char <= 0x39) && // 0-9
                !(char >= 0x41 && char <= 0x5A) && // A-Z
                !(char >= 0x61 && char <= 0x7A) && // a-z
                char != 0x2D
            ) {
                // -
                return false;
            }
        }
        return true;
    }

    function _hasVerified(
        Proof storage proof,
        address verifier
    ) internal view returns (bool) {
        for (uint256 i = 0; i < proof.verifiers.length; i++) {
            if (proof.verifiers[i] == verifier) return true;
        }
        return false;
    }

    // ============ RECEIVE ============
    receive() external payable {}
}
