// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title PayrollMultiSigWallet
 * @notice Multi-signature wallet tailored for automated USDC payrolls
 * @dev Signers submit/confirm/execute arbitrary transactions (Gnosis-style)
 *      and configure employees + payroll schedule through internal calls
 */
contract PayrollMultiSigWallet {
    using SafeERC20 for IERC20;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------
    event Deposit(address indexed sender, uint256 amount);
    event Withdraw(address indexed to, uint256 amount);

    event SubmitTransaction(
        uint256 indexed txId,
        address indexed to,
        uint256 value,
        bytes data
    );
    event ConfirmTransaction(uint256 indexed txId, address indexed signer);
    event RevokeConfirmation(uint256 indexed txId, address indexed signer);
    event ExecuteTransaction(uint256 indexed txId, address indexed executor);

    event SignerAdded(address indexed signer);
    event SignerRemoved(address indexed signer);
    event ThresholdUpdated(uint256 newThreshold);

    event EmployeeAdded(uint256 indexed employeeId, address indexed wallet, uint256 salary);
    event EmployeeUpdated(uint256 indexed employeeId, address indexed wallet, uint256 salary, bool active);
    event PayrollConfigUpdated(PayrollFrequency frequency, uint256 nextExecution, bool active);
    event PayrollExecuted(uint256 totalPaid, uint256 employeeCount, uint256 timestamp);

    // -------------------------------------------------------------------------
    // Enums / Structs
    // -------------------------------------------------------------------------
    enum PayrollFrequency {
        Weekly,
        Monthly,
        Yearly
    }

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 numConfirmations;
        mapping(address => bool) isConfirmed;
    }

    struct Employee {
        uint256 id;
        address wallet;
        uint256 salary; // USDC value in smallest unit (6 decimals)
        PayrollFrequency frequency;
        bool active;
    }

    struct PayrollConfig {
        PayrollFrequency frequency;
        uint256 nextExecution;
        bool active;
    }

    // -------------------------------------------------------------------------
    // Storage
    // -------------------------------------------------------------------------
    IERC20 public immutable usdc;

    address[] public signers;
    mapping(address => bool) public isSigner;
    uint256 public threshold;

    Transaction[] private transactions;

    uint256 private nextEmployeeId = 1;
    mapping(uint256 => Employee) private employees;
    uint256[] private employeeIds;

    PayrollConfig public payrollConfig;

    // -------------------------------------------------------------------------
    // Modifiers
    // -------------------------------------------------------------------------
    modifier onlySigner() {
        require(isSigner[msg.sender], "MultiSig: not signer");
        _;
    }

    modifier txExists(uint256 _txId) {
        require(_txId < transactions.length, "MultiSig: tx does not exist");
        _;
    }

    modifier notExecuted(uint256 _txId) {
        require(!transactions[_txId].executed, "MultiSig: tx already executed");
        _;
    }

    modifier notConfirmed(uint256 _txId) {
        require(
            !transactions[_txId].isConfirmed[msg.sender],
            "MultiSig: tx already confirmed"
        );
        _;
    }

    modifier onlySelf() {
        require(msg.sender == address(this), "MultiSig: only wallet" );
        _;
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(address[] memory _signers, uint256 _threshold, address _usdc) {
        require(_signers.length > 0, "MultiSig: no signers");
        require(
            _threshold > 0 && _threshold <= _signers.length,
            "MultiSig: invalid threshold"
        );
        require(_usdc != address(0), "MultiSig: invalid token");

        for (uint256 i = 0; i < _signers.length; i++) {
            address signer = _signers[i];
            require(signer != address(0), "MultiSig: invalid signer");
            require(!isSigner[signer], "MultiSig: duplicate signer");
            isSigner[signer] = true;
            signers.push(signer);
        }

        threshold = _threshold;
        usdc = IERC20(_usdc);
    }

    // -------------------------------------------------------------------------
    // Public (Signer) Functions - Transaction lifecycle
    // -------------------------------------------------------------------------
    function submitTransaction(
        address _to,
        uint256 _value,
        bytes calldata _data
    ) external onlySigner returns (uint256 txId) {
        txId = transactions.length;
        transactions.push();
        Transaction storage transaction = transactions[txId];
        transaction.to = _to;
        transaction.value = _value;
        transaction.data = _data;

        emit SubmitTransaction(txId, _to, _value, _data);
    }

    function confirmTransaction(uint256 _txId)
        external
        onlySigner
        txExists(_txId)
        notExecuted(_txId)
        notConfirmed(_txId)
    {
        Transaction storage transaction = transactions[_txId];
        transaction.isConfirmed[msg.sender] = true;
        transaction.numConfirmations += 1;

        emit ConfirmTransaction(_txId, msg.sender);
    }

    function revokeConfirmation(uint256 _txId)
        external
        onlySigner
        txExists(_txId)
        notExecuted(_txId)
    {
        Transaction storage transaction = transactions[_txId];
        require(
            transaction.isConfirmed[msg.sender],
            "MultiSig: tx not confirmed"
        );

        transaction.isConfirmed[msg.sender] = false;
        transaction.numConfirmations -= 1;

        emit RevokeConfirmation(_txId, msg.sender);
    }

    function executeTransaction(uint256 _txId)
        external
        onlySigner
        txExists(_txId)
        notExecuted(_txId)
    {
        Transaction storage transaction = transactions[_txId];
        require(
            transaction.numConfirmations >= threshold,
            "MultiSig: insufficient confirmations"
        );

        transaction.executed = true;

        (bool success, ) = transaction.to.call{value: transaction.value}(
            transaction.data
        );
        require(success, "MultiSig: tx failed");

        emit ExecuteTransaction(_txId, msg.sender);
    }

    // -------------------------------------------------------------------------
    // Signer management (invoked via multi-sig transactions)
    // -------------------------------------------------------------------------
    function addSigner(address newSigner) external onlySelf {
        require(newSigner != address(0), "MultiSig: invalid signer");
        require(!isSigner[newSigner], "MultiSig: already signer");
        isSigner[newSigner] = true;
        signers.push(newSigner);
        emit SignerAdded(newSigner);
    }

    function removeSigner(address signer) external onlySelf {
        require(isSigner[signer], "MultiSig: not signer");
        require(
            signers.length - 1 >= threshold,
            "MultiSig: threshold would break"
        );
        isSigner[signer] = false;

        for (uint256 i = 0; i < signers.length; i++) {
            if (signers[i] == signer) {
                signers[i] = signers[signers.length - 1];
                signers.pop();
                break;
            }
        }

        emit SignerRemoved(signer);
    }

    function updateThreshold(uint256 newThreshold) external onlySelf {
        require(newThreshold > 0 && newThreshold <= signers.length, "MultiSig: invalid threshold");
        threshold = newThreshold;
        emit ThresholdUpdated(newThreshold);
    }

    // -------------------------------------------------------------------------
    // Employee management (invoked via multi-sig transactions)
    // -------------------------------------------------------------------------
    function addEmployee(
        address wallet,
        uint256 salary,
        PayrollFrequency frequency
    ) external onlySelf returns (uint256 employeeId) {
        require(wallet != address(0), "Payroll: invalid wallet");
        require(salary > 0, "Payroll: invalid salary");

        employeeId = nextEmployeeId++;
        employees[employeeId] = Employee({
            id: employeeId,
            wallet: wallet,
            salary: salary,
            frequency: frequency,
            active: true
        });
        employeeIds.push(employeeId);

        emit EmployeeAdded(employeeId, wallet, salary);
    }

    function updateEmployee(
        uint256 employeeId,
        address wallet,
        uint256 salary,
        PayrollFrequency frequency,
        bool active
    ) external onlySelf {
        Employee storage employee = employees[employeeId];
        require(employee.id != 0, "Payroll: employee not found");
        require(wallet != address(0), "Payroll: invalid wallet");
        require(salary > 0, "Payroll: invalid salary");

        employee.wallet = wallet;
        employee.salary = salary;
        employee.frequency = frequency;
        employee.active = active;

        emit EmployeeUpdated(employeeId, wallet, salary, active);
    }

    function removeEmployee(uint256 employeeId) external onlySelf {
        Employee storage employee = employees[employeeId];
        require(employee.id != 0, "Payroll: employee not found");
        employee.active = false;
        emit EmployeeUpdated(employeeId, employee.wallet, employee.salary, false);
    }

    // -------------------------------------------------------------------------
    // Payroll configuration
    // -------------------------------------------------------------------------
    function setPayrollConfig(
        PayrollFrequency frequency,
        uint256 firstExecutionTimestamp,
        bool active
    ) external onlySelf {
        require(firstExecutionTimestamp >= block.timestamp, "Payroll: invalid time");
        payrollConfig = PayrollConfig({
            frequency: frequency,
            nextExecution: firstExecutionTimestamp,
            active: active
        });
        emit PayrollConfigUpdated(frequency, firstExecutionTimestamp, active);
    }

    function frequencyInterval(PayrollFrequency frequency)
        public
        pure
        returns (uint256)
    {
        if (frequency == PayrollFrequency.Weekly) {
            return 7 days;
        } else if (frequency == PayrollFrequency.Monthly) {
            return 30 days;
        }
        return 365 days;
    }

    function executePayroll() external {
        require(payrollConfig.active, "Payroll: inactive");
        require(block.timestamp >= payrollConfig.nextExecution, "Payroll: not due");

        uint256 total;
        uint256 activeEmployees;
        for (uint256 i = 0; i < employeeIds.length; i++) {
            Employee storage employee = employees[employeeIds[i]];
            if (employee.active && employee.frequency == payrollConfig.frequency) {
                total += employee.salary;
                activeEmployees++;
            }
        }
        require(activeEmployees > 0, "Payroll: no employees");
        require(
            usdc.balanceOf(address(this)) >= total,
            "Payroll: insufficient USDC"
        );

        for (uint256 i = 0; i < employeeIds.length; i++) {
            Employee storage employee = employees[employeeIds[i]];
            if (employee.active && employee.frequency == payrollConfig.frequency) {
                usdc.safeTransfer(employee.wallet, employee.salary);
            }
        }

        payrollConfig.nextExecution =
            block.timestamp + frequencyInterval(payrollConfig.frequency);

        emit PayrollExecuted(total, activeEmployees, block.timestamp);
    }

    // -------------------------------------------------------------------------
    // Funding helpers
    // -------------------------------------------------------------------------
    function deposit(uint256 amount) external {
        require(amount > 0, "Payroll: invalid amount");
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        emit Deposit(msg.sender, amount);
    }

    function withdraw(address to, uint256 amount) external onlySelf {
        require(to != address(0), "Payroll: invalid recipient");
        usdc.safeTransfer(to, amount);
        emit Withdraw(to, amount);
    }

    // -------------------------------------------------------------------------
    // Views
    // -------------------------------------------------------------------------
    function getTransactionCount() external view returns (uint256) {
        return transactions.length;
    }

    function getTransaction(uint256 txId)
        external
        view
        returns (address to, uint256 value, bytes memory data, bool executed, uint256 numConfirmations)
    {
        Transaction storage transaction = transactions[txId];
        return (transaction.to, transaction.value, transaction.data, transaction.executed, transaction.numConfirmations);
    }

    function getSigners() external view returns (address[] memory) {
        return signers;
    }

    function getEmployees()
        external
        view
        returns (Employee[] memory)
    {
        uint256 count = employeeIds.length;
        Employee[] memory list = new Employee[](count);
        for (uint256 i = 0; i < count; i++) {
            list[i] = employees[employeeIds[i]];
        }
        return list;
    }

    // Accept ETH (optional, e.g., to pay gas refunds if needed)
    receive() external payable {}
}
