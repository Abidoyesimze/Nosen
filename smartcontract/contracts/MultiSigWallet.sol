// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MultiSigWallet
 * @dev Enhanced multi-signature wallet with batch payments and payroll system
 * @notice Supports single transactions, batch payments, and recurring payroll
 */
contract MultiSigWallet {
    // Events
    event TransactionProposed(
        uint256 indexed transactionId,
        address indexed proposer,
        address to,
        uint256 value,
        bytes data
    );

    event BatchPaymentProposed(
        uint256 indexed batchId,
        address indexed proposer,
        uint256 recipientCount,
        uint256 totalAmount
    );

    event PayrollProposed(
        uint256 indexed payrollId,
        address indexed proposer,
        uint256 employeeCount,
        uint256 totalAmount,
        uint256 scheduledTime
    );

    event TransactionApproved(
        uint256 indexed transactionId,
        address indexed approver
    );

    event BatchPaymentApproved(
        uint256 indexed batchId,
        address indexed approver
    );

    event PayrollApproved(uint256 indexed payrollId, address indexed approver);

    event TransactionExecuted(
        uint256 indexed transactionId,
        address indexed executor
    );

    event BatchPaymentExecuted(
        uint256 indexed batchId,
        address indexed executor,
        uint256 successfulTransfers
    );

    event PayrollExecuted(
        uint256 indexed payrollId,
        address indexed executor,
        uint256 successfulTransfers
    );

    event SignerAdded(address indexed signer, address indexed addedBy);
    event SignerRemoved(address indexed signer, address indexed removedBy);
    event ThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);

    // Structs
    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 approvalCount;
        mapping(address => bool) approvals;
    }

    struct BatchPayment {
        address[] recipients;
        uint256[] amounts;
        bool executed;
        uint256 approvalCount;
        uint256 totalAmount;
        mapping(address => bool) approvals;
    }

    struct PayrollSchedule {
        address[] employees;
        uint256[] salaries;
        uint256 scheduledTime;
        uint256 lastExecuted;
        bool executed;
        uint256 approvalCount;
        uint256 totalAmount;
        bool recurring;
        uint256 frequency; // in seconds (e.g., 30 days)
        mapping(address => bool) approvals;
    }

    // State variables
    mapping(address => bool) public isSigner;
    mapping(uint256 => Transaction) public transactions;
    mapping(uint256 => BatchPayment) public batchPayments;
    mapping(uint256 => PayrollSchedule) public payrolls;

    address[] public signers;
    uint256 public threshold;
    uint256 public transactionCount;
    uint256 public batchPaymentCount;
    uint256 public payrollCount;
    uint256 public nonce;

    // Modifiers
    modifier onlySigner() {
        require(isSigner[msg.sender], "MultiSig: caller is not a signer");
        _;
    }

    modifier transactionExists(uint256 transactionId) {
        require(
            transactionId < transactionCount,
            "MultiSig: transaction does not exist"
        );
        _;
    }

    modifier batchExists(uint256 batchId) {
        require(
            batchId < batchPaymentCount,
            "MultiSig: batch payment does not exist"
        );
        _;
    }

    modifier payrollExists(uint256 payrollId) {
        require(payrollId < payrollCount, "MultiSig: payroll does not exist");
        _;
    }

    modifier notExecuted(uint256 transactionId) {
        require(
            !transactions[transactionId].executed,
            "MultiSig: transaction already executed"
        );
        _;
    }

    modifier batchNotExecuted(uint256 batchId) {
        require(
            !batchPayments[batchId].executed,
            "MultiSig: batch payment already executed"
        );
        _;
    }

    modifier payrollNotExecuted(uint256 payrollId) {
        require(
            !payrolls[payrollId].executed,
            "MultiSig: payroll already executed"
        );
        _;
    }

    modifier notApproved(uint256 transactionId) {
        require(
            !transactions[transactionId].approvals[msg.sender],
            "MultiSig: transaction already approved"
        );
        _;
    }

    modifier batchNotApproved(uint256 batchId) {
        require(
            !batchPayments[batchId].approvals[msg.sender],
            "MultiSig: batch payment already approved"
        );
        _;
    }

    modifier payrollNotApproved(uint256 payrollId) {
        require(
            !payrolls[payrollId].approvals[msg.sender],
            "MultiSig: payroll already approved"
        );
        _;
    }

    // Constructor
    constructor(address[] memory _signers, uint256 _threshold) {
        require(_signers.length > 0, "MultiSig: no signers provided");
        require(
            _threshold > 0 && _threshold <= _signers.length,
            "MultiSig: invalid threshold"
        );

        for (uint256 i = 0; i < _signers.length; i++) {
            address signer = _signers[i];
            require(signer != address(0), "MultiSig: invalid signer address");
            require(!isSigner[signer], "MultiSig: duplicate signer");

            isSigner[signer] = true;
            signers.push(signer);
        }

        threshold = _threshold;
    }

    // ========== SINGLE TRANSACTION FUNCTIONS ==========

    /**
     * @dev Propose a new transaction
     * @param to Target address for the transaction
     * @param value Amount of ETH to send
     * @param data Transaction data (for token transfers)
     */
    function proposeTransaction(
        address to,
        uint256 value,
        bytes calldata data
    ) external onlySigner returns (uint256 transactionId) {
        require(to != address(0), "MultiSig: invalid target address");

        transactionId = transactionCount;
        Transaction storage transaction = transactions[transactionId];
        transaction.to = to;
        transaction.value = value;
        transaction.data = data;
        transaction.executed = false;
        transaction.approvalCount = 0;

        transactionCount++;

        emit TransactionProposed(transactionId, msg.sender, to, value, data);
    }

    /**
     * @dev Approve a pending transaction
     * @param transactionId ID of the transaction to approve
     */
    function approveTransaction(
        uint256 transactionId
    )
        external
        onlySigner
        transactionExists(transactionId)
        notExecuted(transactionId)
        notApproved(transactionId)
    {
        Transaction storage transaction = transactions[transactionId];
        transaction.approvals[msg.sender] = true;
        transaction.approvalCount++;

        emit TransactionApproved(transactionId, msg.sender);
    }

    /**
     * @dev Execute a transaction when threshold is met
     * @param transactionId ID of the transaction to execute
     */
    function executeTransaction(
        uint256 transactionId
    )
        external
        onlySigner
        transactionExists(transactionId)
        notExecuted(transactionId)
    {
        Transaction storage transaction = transactions[transactionId];
        require(
            transaction.approvalCount >= threshold,
            "MultiSig: insufficient approvals"
        );

        transaction.executed = true;

        // Execute the transaction
        (bool success, ) = transaction.to.call{value: transaction.value}(
            transaction.data
        );
        require(success, "MultiSig: transaction execution failed");

        emit TransactionExecuted(transactionId, msg.sender);
    }

    // ========== BATCH PAYMENT FUNCTIONS ==========

    /**
     * @dev Propose a batch payment to multiple recipients
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts corresponding to each recipient
     */
    function proposeBatchPayment(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlySigner returns (uint256 batchId) {
        require(recipients.length > 0, "MultiSig: no recipients provided");
        require(
            recipients.length == amounts.length,
            "MultiSig: recipients and amounts length mismatch"
        );
        require(recipients.length <= 200, "MultiSig: too many recipients");

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "MultiSig: invalid recipient");
            require(amounts[i] > 0, "MultiSig: amount must be greater than 0");
            totalAmount += amounts[i];
        }

        batchId = batchPaymentCount;
        BatchPayment storage batch = batchPayments[batchId];
        batch.recipients = recipients;
        batch.amounts = amounts;
        batch.executed = false;
        batch.approvalCount = 0;
        batch.totalAmount = totalAmount;

        batchPaymentCount++;

        emit BatchPaymentProposed(
            batchId,
            msg.sender,
            recipients.length,
            totalAmount
        );
    }

    /**
     * @dev Approve a batch payment
     * @param batchId ID of the batch payment to approve
     */
    function approveBatchPayment(
        uint256 batchId
    )
        external
        onlySigner
        batchExists(batchId)
        batchNotExecuted(batchId)
        batchNotApproved(batchId)
    {
        BatchPayment storage batch = batchPayments[batchId];
        batch.approvals[msg.sender] = true;
        batch.approvalCount++;

        emit BatchPaymentApproved(batchId, msg.sender);
    }

    /**
     * @dev Execute a batch payment when threshold is met
     * @param batchId ID of the batch payment to execute
     */
    function executeBatchPayment(
        uint256 batchId
    ) external onlySigner batchExists(batchId) batchNotExecuted(batchId) {
        BatchPayment storage batch = batchPayments[batchId];
        require(
            batch.approvalCount >= threshold,
            "MultiSig: insufficient approvals"
        );
        require(
            address(this).balance >= batch.totalAmount,
            "MultiSig: insufficient balance"
        );

        batch.executed = true;

        uint256 successfulTransfers = 0;
        for (uint256 i = 0; i < batch.recipients.length; i++) {
            (bool success, ) = batch.recipients[i].call{
                value: batch.amounts[i]
            }("");
            if (success) {
                successfulTransfers++;
            }
        }

        emit BatchPaymentExecuted(batchId, msg.sender, successfulTransfers);
    }

    // ========== PAYROLL FUNCTIONS ==========

    /**
     * @dev Propose a payroll schedule
     * @param employees Array of employee addresses
     * @param salaries Array of salaries corresponding to each employee
     * @param scheduledTime Unix timestamp for when payroll should be executed
     * @param recurring Whether this payroll repeats
     * @param frequency How often payroll repeats (in seconds, e.g., 2592000 for 30 days)
     */
    function proposePayroll(
        address[] calldata employees,
        uint256[] calldata salaries,
        uint256 scheduledTime,
        bool recurring,
        uint256 frequency
    ) external onlySigner returns (uint256 payrollId) {
        require(employees.length > 0, "MultiSig: no employees provided");
        require(
            employees.length == salaries.length,
            "MultiSig: employees and salaries length mismatch"
        );
        require(employees.length <= 200, "MultiSig: too many employees");
        require(
            scheduledTime >= block.timestamp,
            "MultiSig: invalid scheduled time"
        );

        if (recurring) {
            require(
                frequency > 0,
                "MultiSig: frequency must be greater than 0"
            );
        }

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < employees.length; i++) {
            require(employees[i] != address(0), "MultiSig: invalid employee");
            require(salaries[i] > 0, "MultiSig: salary must be greater than 0");
            totalAmount += salaries[i];
        }

        payrollId = payrollCount;
        PayrollSchedule storage payroll = payrolls[payrollId];
        payroll.employees = employees;
        payroll.salaries = salaries;
        payroll.scheduledTime = scheduledTime;
        payroll.lastExecuted = 0;
        payroll.executed = false;
        payroll.approvalCount = 0;
        payroll.totalAmount = totalAmount;
        payroll.recurring = recurring;
        payroll.frequency = frequency;

        payrollCount++;

        emit PayrollProposed(
            payrollId,
            msg.sender,
            employees.length,
            totalAmount,
            scheduledTime
        );
    }

    /**
     * @dev Approve a payroll
     * @param payrollId ID of the payroll to approve
     */
    function approvePayroll(
        uint256 payrollId
    )
        external
        onlySigner
        payrollExists(payrollId)
        payrollNotApproved(payrollId)
    {
        PayrollSchedule storage payroll = payrolls[payrollId];
        payroll.approvals[msg.sender] = true;
        payroll.approvalCount++;

        emit PayrollApproved(payrollId, msg.sender);
    }

    /**
     * @dev Execute a payroll when threshold is met and time has arrived
     * @param payrollId ID of the payroll to execute
     */
    function executePayroll(
        uint256 payrollId
    ) external onlySigner payrollExists(payrollId) {
        PayrollSchedule storage payroll = payrolls[payrollId];
        require(
            payroll.approvalCount >= threshold,
            "MultiSig: insufficient approvals"
        );
        require(
            block.timestamp >= payroll.scheduledTime,
            "MultiSig: payroll not yet due"
        );

        if (!payroll.recurring) {
            require(!payroll.executed, "MultiSig: payroll already executed");
        } else {
            // For recurring payroll, check if enough time has passed since last execution
            if (payroll.lastExecuted > 0) {
                require(
                    block.timestamp >= payroll.lastExecuted + payroll.frequency,
                    "MultiSig: payroll not yet due"
                );
            }
        }

        require(
            address(this).balance >= payroll.totalAmount,
            "MultiSig: insufficient balance"
        );

        uint256 successfulTransfers = 0;
        for (uint256 i = 0; i < payroll.employees.length; i++) {
            (bool success, ) = payroll.employees[i].call{
                value: payroll.salaries[i]
            }("");
            if (success) {
                successfulTransfers++;
            }
        }

        // Update execution status
        if (!payroll.recurring) {
            payroll.executed = true;
        } else {
            payroll.lastExecuted = block.timestamp;
        }

        emit PayrollExecuted(payrollId, msg.sender, successfulTransfers);
    }

    // ========== SIGNER MANAGEMENT FUNCTIONS ==========

    /**
     * @dev Add a new signer (requires threshold approval via transaction)
     * @param newSigner Address of the new signer
     */
    function addSigner(address newSigner) external onlySigner {
        require(newSigner != address(0), "MultiSig: invalid signer address");
        require(!isSigner[newSigner], "MultiSig: signer already exists");

        isSigner[newSigner] = true;
        signers.push(newSigner);

        emit SignerAdded(newSigner, msg.sender);
    }

    /**
     * @dev Remove a signer (requires threshold approval via transaction)
     * @param signerToRemove Address of the signer to remove
     */
    function removeSigner(address signerToRemove) external onlySigner {
        require(isSigner[signerToRemove], "MultiSig: signer does not exist");
        require(
            signers.length - 1 >= threshold,
            "MultiSig: cannot remove signer, threshold would be violated"
        );

        isSigner[signerToRemove] = false;

        // Remove from signers array
        for (uint256 i = 0; i < signers.length; i++) {
            if (signers[i] == signerToRemove) {
                signers[i] = signers[signers.length - 1];
                signers.pop();
                break;
            }
        }

        emit SignerRemoved(signerToRemove, msg.sender);
    }

    /**
     * @dev Update the threshold (requires threshold approval via transaction)
     * @param newThreshold New threshold value
     */
    function updateThreshold(uint256 newThreshold) external onlySigner {
        require(
            newThreshold > 0 && newThreshold <= signers.length,
            "MultiSig: invalid threshold"
        );

        uint256 oldThreshold = threshold;
        threshold = newThreshold;

        emit ThresholdUpdated(oldThreshold, newThreshold);
    }

    // ========== VIEW FUNCTIONS ==========

    /**
     * @dev Get transaction details
     */
    function getTransaction(
        uint256 transactionId
    )
        external
        view
        returns (
            address to,
            uint256 value,
            bytes memory data,
            bool executed,
            uint256 approvalCount
        )
    {
        require(
            transactionId < transactionCount,
            "MultiSig: transaction does not exist"
        );
        Transaction storage transaction = transactions[transactionId];

        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.approvalCount
        );
    }

    /**
     * @dev Get batch payment details
     */
    function getBatchPayment(
        uint256 batchId
    )
        external
        view
        returns (
            address[] memory recipients,
            uint256[] memory amounts,
            bool executed,
            uint256 approvalCount,
            uint256 totalAmount
        )
    {
        require(
            batchId < batchPaymentCount,
            "MultiSig: batch payment does not exist"
        );
        BatchPayment storage batch = batchPayments[batchId];

        return (
            batch.recipients,
            batch.amounts,
            batch.executed,
            batch.approvalCount,
            batch.totalAmount
        );
    }

    /**
     * @dev Get payroll details
     */
    function getPayroll(
        uint256 payrollId
    )
        external
        view
        returns (
            address[] memory employees,
            uint256[] memory salaries,
            uint256 scheduledTime,
            uint256 lastExecuted,
            bool executed,
            uint256 approvalCount,
            uint256 totalAmount,
            bool recurring,
            uint256 frequency
        )
    {
        require(payrollId < payrollCount, "MultiSig: payroll does not exist");
        PayrollSchedule storage payroll = payrolls[payrollId];

        return (
            payroll.employees,
            payroll.salaries,
            payroll.scheduledTime,
            payroll.lastExecuted,
            payroll.executed,
            payroll.approvalCount,
            payroll.totalAmount,
            payroll.recurring,
            payroll.frequency
        );
    }

    /**
     * @dev Check if a signer has approved a transaction
     */
    function hasApproved(
        uint256 transactionId,
        address signer
    ) external view returns (bool) {
        require(
            transactionId < transactionCount,
            "MultiSig: transaction does not exist"
        );
        return transactions[transactionId].approvals[signer];
    }

    /**
     * @dev Check if a signer has approved a batch payment
     */
    function hasApprovedBatch(
        uint256 batchId,
        address signer
    ) external view returns (bool) {
        require(
            batchId < batchPaymentCount,
            "MultiSig: batch payment does not exist"
        );
        return batchPayments[batchId].approvals[signer];
    }

    /**
     * @dev Check if a signer has approved a payroll
     */
    function hasApprovedPayroll(
        uint256 payrollId,
        address signer
    ) external view returns (bool) {
        require(payrollId < payrollCount, "MultiSig: payroll does not exist");
        return payrolls[payrollId].approvals[signer];
    }

    /**
     * @dev Get all signers
     */
    function getSigners() external view returns (address[] memory) {
        return signers;
    }

    /**
     * @dev Get wallet status
     */
    function getWalletStatus()
        external
        view
        returns (
            uint256 totalSigners,
            uint256 currentThreshold,
            uint256 totalTransactions,
            uint256 totalBatchPayments,
            uint256 totalPayrolls,
            uint256 walletBalance
        )
    {
        return (
            signers.length,
            threshold,
            transactionCount,
            batchPaymentCount,
            payrollCount,
            address(this).balance
        );
    }

    /**
     * @dev Get pending items count
     */
    function getPendingCounts()
        external
        view
        returns (
            uint256 pendingTransactions,
            uint256 pendingBatchPayments,
            uint256 pendingPayrolls
        )
    {
        uint256 pendingTx = 0;
        uint256 pendingBatch = 0;
        uint256 pendingPay = 0;

        for (uint256 i = 0; i < transactionCount; i++) {
            if (!transactions[i].executed) {
                pendingTx++;
            }
        }

        for (uint256 i = 0; i < batchPaymentCount; i++) {
            if (!batchPayments[i].executed) {
                pendingBatch++;
            }
        }

        for (uint256 i = 0; i < payrollCount; i++) {
            if (!payrolls[i].executed || payrolls[i].recurring) {
                pendingPay++;
            }
        }

        return (pendingTx, pendingBatch, pendingPay);
    }

    // Receive function to accept ETH
    receive() external payable {}
}
