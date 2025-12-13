/**
 * PayrollPlatform Service
 * 
 * Modern service layer using wagmi/viem for interacting with the PayrollPlatform contract.
 * This service provides type-safe methods for all contract operations.
 */

import { Address } from 'viem';
import { PayrollContract } from '../app/abi';
import type {
  Employer,
  EmployeeProfile,
  EmployerFormatted,
  EmployeeProfileFormatted,
} from '../types/payroll';

// Contract ABI - using the imported ABI from the contract artifacts
const PAYROLL_ABI = PayrollContract.abi;
const PAYROLL_ADDRESS = PayrollContract.address as Address;

/**
 * Helper function to format Employer struct from contract to UI-friendly format
 */
export function formatEmployer(employer: Employer): EmployerFormatted {
  return {
    id: Number(employer.id),
    owner: employer.owner,
    companyName: employer.companyName,
    email: employer.email,
    location: employer.location,
    wallet: employer.wallet,
    createdAt: new Date(Number(employer.createdAt) * 1000),
    createdAtTimestamp: Number(employer.createdAt),
  };
}

/**
 * Helper function to format EmployeeProfile struct from contract to UI-friendly format
 */
export function formatEmployeeProfile(employee: EmployeeProfile): EmployeeProfileFormatted {
  return {
    id: Number(employee.id),
    account: employee.account,
    name: employee.name,
    email: employee.email,
    location: employee.location,
    createdAt: new Date(Number(employee.createdAt) * 1000),
    createdAtTimestamp: Number(employee.createdAt),
  };
}

/**
 * PayrollService class
 * 
 * Provides methods to interact with the PayrollPlatform contract.
 * All methods are designed to work with wagmi's publicClient and walletClient.
 */
export class PayrollService {
  private contractAddress: Address;

  constructor(contractAddress?: Address) {
    this.contractAddress = contractAddress || PAYROLL_ADDRESS;
  }

  /**
   * Get the contract address
   */
  getAddress(): Address {
    return this.contractAddress;
  }

  /**
   * Validate employer registration parameters
   */
  validateEmployerParams(params: {
    companyName: string;
    email: string;
    location: string;
    signers: Address[];
    threshold: number;
  }): { valid: boolean; error?: string } {
    if (!params.companyName.trim()) {
      return { valid: false, error: 'Company name is required' };
    }
    if (!params.email.trim()) {
      return { valid: false, error: 'Email is required' };
    }
    if (!params.location.trim()) {
      return { valid: false, error: 'Location is required' };
    }
    if (!params.signers || params.signers.length === 0) {
      return { valid: false, error: 'At least one signer is required' };
    }
    if (params.threshold < 1 || params.threshold > params.signers.length) {
      return { 
        valid: false, 
        error: `Threshold must be between 1 and ${params.signers.length}` 
      };
    }
    return { valid: true };
  }

  /**
   * Validate employee registration parameters
   */
  validateEmployeeParams(params: {
    name: string;
    email: string;
    location: string;
  }): { valid: boolean; error?: string } {
    if (!params.name.trim()) {
      return { valid: false, error: 'Name is required' };
    }
    if (!params.email.trim()) {
      return { valid: false, error: 'Email is required' };
    }
    if (!params.location.trim()) {
      return { valid: false, error: 'Location is required' };
    }
    return { valid: true };
  }

  /**
   * Get employer information by owner address
   * 
   * @param owner - Owner address
   * @param publicClient - wagmi publicClient for reading contract state
   * @returns Formatted employer data or null if not found
   */
  async getEmployer(
    owner: Address,
    publicClient: any
  ): Promise<EmployerFormatted | null> {
    try {
      const result = await publicClient.readContract({
        address: this.contractAddress,
        abi: PAYROLL_ABI,
        functionName: 'getEmployer',
        args: [owner],
      });

      return formatEmployer(result as Employer);
    } catch (error: any) {
      // Contract throws if employer doesn't exist
      if (error.message?.includes('employer missing') || error.message?.includes('revert')) {
        return null;
      }
      console.error('Error getting employer:', error);
      throw error;
    }
  }

  /**
   * Get employee information by account address
   * 
   * @param account - Employee account address
   * @param publicClient - wagmi publicClient for reading contract state
   * @returns Formatted employee data or null if not found
   */
  async getEmployee(
    account: Address,
    publicClient: any
  ): Promise<EmployeeProfileFormatted | null> {
    try {
      const result = await publicClient.readContract({
        address: this.contractAddress,
        abi: PAYROLL_ABI,
        functionName: 'getEmployee',
        args: [account],
      });

      return formatEmployeeProfile(result as EmployeeProfile);
    } catch (error: any) {
      // Contract throws if employee doesn't exist
      if (error.message?.includes('employee missing') || error.message?.includes('revert')) {
        return null;
      }
      console.error('Error getting employee:', error);
      throw error;
    }
  }

  /**
   * Check if an address is registered as an employer
   * 
   * @param owner - Owner address to check
   * @param publicClient - wagmi publicClient for reading contract state
   * @returns True if registered, false otherwise
   */
  async isEmployerRegistered(
    owner: Address,
    publicClient: any
  ): Promise<boolean> {
    try {
      const employerId = await publicClient.readContract({
        address: this.contractAddress,
        abi: PAYROLL_ABI,
        functionName: 'employerIdsByOwner',
        args: [owner],
      });

      return Number(employerId) > 0;
    } catch (error) {
      console.error('Error checking employer registration:', error);
      return false;
    }
  }

  /**
   * Check if an address is registered as an employee
   * 
   * @param account - Account address to check
   * @param publicClient - wagmi publicClient for reading contract state
   * @returns True if registered, false otherwise
   */
  async isEmployeeRegistered(
    account: Address,
    publicClient: any
  ): Promise<boolean> {
    try {
      const employeeId = await publicClient.readContract({
        address: this.contractAddress,
        abi: PAYROLL_ABI,
        functionName: 'employeeIdsByAccount',
        args: [account],
      });

      return Number(employeeId) > 0;
    } catch (error) {
      console.error('Error checking employee registration:', error);
      return false;
    }
  }
}

// Export singleton instance
export const payrollService = new PayrollService();

