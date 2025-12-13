/**
 * React hooks for PayrollMultiSigWallet contract interactions
 */

import { useReadContract, useReadContracts } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { Address, formatUnits } from 'viem';
import { MultisigContract } from '../app/abi';

// Multisig Wallet ABI (simplified - add more functions as needed)
const MULTISIG_WALLET_ABI = [
  {
    inputs: [],
    name: 'getSigners',
    outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'threshold',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getEmployees',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'id', type: 'uint256' },
          { internalType: 'address', name: 'wallet', type: 'address' },
          { internalType: 'uint256', name: 'salary', type: 'uint256' },
          { internalType: 'uint8', name: 'frequency', type: 'uint8' },
          { internalType: 'bool', name: 'active', type: 'bool' },
        ],
        internalType: 'struct PayrollMultiSigWallet.Employee[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getTransactionCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/**
 * Hook to get signers from multisig wallet
 */
export function useMultisigSigners(walletAddress?: Address) {
  return useReadContract({
    address: walletAddress,
    abi: MULTISIG_WALLET_ABI,
    functionName: 'getSigners',
    query: {
      enabled: !!walletAddress,
    },
  });
}

/**
 * Hook to get threshold from multisig wallet
 */
export function useMultisigThreshold(walletAddress?: Address) {
  return useReadContract({
    address: walletAddress,
    abi: MULTISIG_WALLET_ABI,
    functionName: 'threshold',
    query: {
      enabled: !!walletAddress,
    },
  });
}

/**
 * Hook to get employees from multisig wallet
 */
export function useMultisigEmployees(walletAddress?: Address) {
  return useReadContract({
    address: walletAddress,
    abi: MULTISIG_WALLET_ABI,
    functionName: 'getEmployees',
    query: {
      enabled: !!walletAddress,
    },
  });
}

/**
 * Hook to get transaction count from multisig wallet
 */
export function useMultisigTransactionCount(walletAddress?: Address) {
  return useReadContract({
    address: walletAddress,
    abi: MULTISIG_WALLET_ABI,
    functionName: 'getTransactionCount',
    query: {
      enabled: !!walletAddress,
    },
  });
}

/**
 * Hook to get all multisig wallet data at once
 */
export function useMultisigWalletData(walletAddress?: Address) {
  const { data: signers } = useMultisigSigners(walletAddress);
  const { data: threshold } = useMultisigThreshold(walletAddress);
  const { data: employees } = useMultisigEmployees(walletAddress);
  const { data: transactionCount } = useMultisigTransactionCount(walletAddress);

  // Calculate monthly payroll
  // For monthly frequency employees, use their salary directly
  // For weekly, multiply by ~4.33 (average weeks per month)
  // For yearly, divide by 12
  const monthlyPayroll = employees
    ? employees
        .filter((emp: any) => emp.active)
        .reduce((sum: bigint, emp: any) => {
          if (emp.frequency === 1) {
            // Monthly - use salary as is
            return sum + emp.salary;
          } else if (emp.frequency === 0) {
            // Weekly - multiply by ~4.33 (433/100 for precision)
            return sum + (emp.salary * 433n) / 100n;
          } else {
            // Yearly - divide by 12
            return sum + emp.salary / 12n;
          }
        }, 0n)
    : 0n;

  return {
    signers: signers as Address[] | undefined,
    threshold: threshold ? Number(threshold) : undefined,
    employees: employees as any[] | undefined,
    employeeCount: employees ? employees.filter((e: any) => e.active).length : 0,
    transactionCount: transactionCount ? Number(transactionCount) : 0,
    monthlyPayroll: monthlyPayroll ? formatUnits(monthlyPayroll, 6) : '0', // USDC has 6 decimals
  };
}

