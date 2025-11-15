// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./MultiSigFactory.sol";

/**
 * @title PayrollPlatform
 * @notice Handles employer/employee onboarding and deploys company multisig wallets
 */
contract PayrollPlatform {
    struct Employer {
        uint256 id;
        address owner;
        string companyName;
        string email;
        string location;
        address wallet;
        uint256 createdAt;
    }

    struct EmployeeProfile {
        uint256 id;
        address account;
        string name;
        string email;
        string location;
        uint256 createdAt;
    }

    event EmployerRegistered(
        uint256 indexed employerId,
        address indexed owner,
        address wallet,
        string companyName
    );
    event EmployeeRegistered(
        uint256 indexed employeeId,
        address indexed account,
        string name
    );

    MultiSigFactory public immutable factory;

    uint256 private employerCounter;
    uint256 private employeeCounter;

    mapping(address => uint256) public employerIdsByOwner;
    mapping(uint256 => Employer) public employers;

    mapping(address => uint256) public employeeIdsByAccount;
    mapping(uint256 => EmployeeProfile) public employees;

    constructor(MultiSigFactory _factory) {
        require(address(_factory) != address(0), "Platform: factory zero");
        factory = _factory;
    }

    // ---------------------------------------------------------------------
    // Employer Flow
    // ---------------------------------------------------------------------
    function registerEmployer(
        string calldata companyName,
        string calldata email,
        string calldata location,
        address[] calldata signers,
        uint256 threshold
    ) external returns (address wallet) {
        require(bytes(companyName).length > 0, "Platform: name required");
        require(bytes(email).length > 0, "Platform: email required");
        require(bytes(location).length > 0, "Platform: location required");
        require(signers.length > 0, "Platform: signers required");
        require(employerIdsByOwner[msg.sender] == 0, "Platform: already registered");

        wallet = factory.createWallet(signers, threshold);

        employerCounter += 1;
        employerIdsByOwner[msg.sender] = employerCounter;
        employers[employerCounter] = Employer({
            id: employerCounter,
            owner: msg.sender,
            companyName: companyName,
            email: email,
            location: location,
            wallet: wallet,
            createdAt: block.timestamp
        });

        emit EmployerRegistered(employerCounter, msg.sender, wallet, companyName);
    }

    function getEmployer(address owner)
        external
        view
        returns (Employer memory)
    {
        uint256 employerId = employerIdsByOwner[owner];
        require(employerId != 0, "Platform: employer missing");
        return employers[employerId];
    }

    // ---------------------------------------------------------------------
    // Employee Flow
    // ---------------------------------------------------------------------
    function registerEmployee(
        string calldata name,
        string calldata email,
        string calldata location
    ) external returns (uint256 employeeId) {
        require(bytes(name).length > 0, "Platform: name required");
        require(bytes(email).length > 0, "Platform: email required");
        require(bytes(location).length > 0, "Platform: location required");
        require(employeeIdsByAccount[msg.sender] == 0, "Platform: already registered");

        employeeCounter += 1;
        employeeIdsByAccount[msg.sender] = employeeCounter;
        employees[employeeCounter] = EmployeeProfile({
            id: employeeCounter,
            account: msg.sender,
            name: name,
            email: email,
            location: location,
            createdAt: block.timestamp
        });

        emit EmployeeRegistered(employeeCounter, msg.sender, name);

        return employeeCounter;
    }

    function getEmployee(address account)
        external
        view
        returns (EmployeeProfile memory)
    {
        uint256 employeeId = employeeIdsByAccount[account];
        require(employeeId != 0, "Platform: employee missing");
        return employees[employeeId];
    }
}
