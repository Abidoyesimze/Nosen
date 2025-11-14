// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./MultiSigWallet.sol";

contract MultiSigFactory {
    // Event for wallet creation
    event WalletCreated(
        address indexed creator,
        address walletAddress,
        address[] signers,
        uint256 threshold
    );

    // Mapping of organization => list of wallets they created
    mapping(address => address[]) public orgWallets;

    /**
     * @dev Create a new MultiSigWallet for an organization
     * @param _signers Array of signer addresses
     * @param _threshold Minimum number of approvals required
     */
    function createWallet(
        address[] calldata _signers,
        uint256 _threshold
    ) external returns (address walletAddress) {
        // Deploy new MultiSigWallet
        MultiSigWallet wallet = new MultiSigWallet(_signers, _threshold);

        // Store in registry
        orgWallets[msg.sender].push(address(wallet));

        // Emit event
        emit WalletCreated(msg.sender, address(wallet), _signers, _threshold);

        return address(wallet);
    }

    /**
     * @dev Get all wallets created by an organization
     * @param org Address of the organization
     */
    function getOrgWallets(address org) external view returns (address[] memory) {
        return orgWallets[org];
    }
}
