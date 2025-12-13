/**
 * React hooks for PayrollPlatform contract interactions
 * 
 * These hooks provide easy-to-use React interfaces for the PayrollPlatform contract,
 * using wagmi for wallet connection and contract interactions.
 */

import { useAccount, usePublicClient, useWalletClient, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollService, formatEmployer, formatEmployeeProfile } from '../services/payrollService';
import { PayrollContract } from '../app/abi';
import type {
  RegisterEmployerParams,
  RegisterEmployeeParams,
  EmployerFormatted,
  EmployeeProfileFormatted,
} from '../types/payroll';
import { Address } from 'viem';

/**
 * Hook to get the current user's employer profile
 * Returns null if not registered as an employer
 */
export function useEmployerProfile() {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['employer', address],
    queryFn: async (): Promise<EmployerFormatted | null> => {
      if (!address || !publicClient) return null;
      return await payrollService.getEmployer(address as Address, publicClient);
    },
    enabled: !!address && !!publicClient,
  });
}

/**
 * Hook to get an employee profile by address
 */
export function useEmployeeProfile(accountAddress?: Address) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const targetAddress = accountAddress || address;

  return useQuery({
    queryKey: ['employee', targetAddress],
    queryFn: async (): Promise<EmployeeProfileFormatted | null> => {
      if (!targetAddress || !publicClient) return null;
      return await payrollService.getEmployee(targetAddress, publicClient);
    },
    enabled: !!targetAddress && !!publicClient,
  });
}

/**
 * Hook to check if current user is registered as an employer
 */
export function useIsEmployerRegistered() {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['isEmployerRegistered', address],
    queryFn: async (): Promise<boolean> => {
      if (!address || !publicClient) return false;
      return await payrollService.isEmployerRegistered(address as Address, publicClient);
    },
    enabled: !!address && !!publicClient,
  });
}

/**
 * Hook to check if current user is registered as an employee
 */
export function useIsEmployeeRegistered() {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['isEmployeeRegistered', address],
    queryFn: async (): Promise<boolean> => {
      if (!address || !publicClient) return false;
      return await payrollService.isEmployeeRegistered(address as Address, publicClient);
    },
    enabled: !!address && !!publicClient,
  });
}

/**
 * Hook to register as an employer
 * Returns mutation object with loading states and callbacks
 */
export function useRegisterEmployer() {
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();

  return useMutation({
    mutationFn: async (params: RegisterEmployerParams) => {
      if (!writeContractAsync) {
        throw new Error('Wallet not connected');
      }

      // Write contract using wagmi
      const hash = await writeContractAsync({
        address: PayrollContract.address as Address,
        abi: PayrollContract.abi,
        functionName: 'registerEmployer',
        args: [
          params.companyName,
          params.email,
          params.location,
          params.signers,
          BigInt(params.threshold),
        ],
      });

      return hash;
    },
    onSuccess: (hash) => {
      // Invalidate queries to refetch employer data
      queryClient.invalidateQueries({ queryKey: ['employer'] });
      queryClient.invalidateQueries({ queryKey: ['isEmployerRegistered'] });
    },
  });
}

/**
 * Hook to wait for a specific transaction hash
 */
export function useWaitForTransaction(hash?: `0x${string}`) {
  return useWaitForTransactionReceipt({
    hash,
  });
}

/**
 * Hook to register as an employee
 * Returns mutation object with loading states and callbacks
 */
export function useRegisterEmployee() {
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();

  return useMutation({
    mutationFn: async (params: RegisterEmployeeParams) => {
      if (!writeContractAsync) {
        throw new Error('Wallet not connected');
      }

      // Write contract using wagmi
      const hash = await writeContractAsync({
        address: PayrollContract.address as Address,
        abi: PayrollContract.abi,
        functionName: 'registerEmployee',
        args: [params.name, params.email, params.location],
      });

      return hash;
    },
    onSuccess: (hash) => {
      // Invalidate queries to refetch employee data
      queryClient.invalidateQueries({ queryKey: ['employee'] });
      queryClient.invalidateQueries({ queryKey: ['isEmployeeRegistered'] });
    },
  });
}


/**
 * Hook to read employer data directly from contract
 * Useful for reading any employer by address
 */
export function useReadEmployer(ownerAddress?: Address) {
  return useReadContract({
    address: PayrollContract.address as Address,
    abi: PayrollContract.abi,
    functionName: 'getEmployer',
    args: ownerAddress ? [ownerAddress] : undefined,
    query: {
      enabled: !!ownerAddress,
    },
  });
}

/**
 * Hook to read employee data directly from contract
 * Useful for reading any employee by address
 */
export function useReadEmployee(accountAddress?: Address) {
  return useReadContract({
    address: PayrollContract.address as Address,
    abi: PayrollContract.abi,
    functionName: 'getEmployee',
    args: accountAddress ? [accountAddress] : undefined,
    query: {
      enabled: !!accountAddress,
    },
  });
}

