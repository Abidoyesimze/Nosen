/**
 * TypeScript types for PayrollPlatform contract
 * These match the Solidity structs exactly
 */

export interface Employer {
  id: bigint;
  owner: `0x${string}`;
  companyName: string;
  email: string;
  location: string;
  wallet: `0x${string}`;
  createdAt: bigint;
}

export interface EmployeeProfile {
  id: bigint;
  account: `0x${string}`;
  name: string;
  email: string;
  location: string;
  createdAt: bigint;
}

/**
 * Formatted types for UI display (converts bigint to number, timestamps to Date)
 */
export interface EmployerFormatted {
  id: number;
  owner: string;
  companyName: string;
  email: string;
  location: string;
  wallet: string;
  createdAt: Date;
  createdAtTimestamp: number;
}

export interface EmployeeProfileFormatted {
  id: number;
  account: string;
  name: string;
  email: string;
  location: string;
  createdAt: Date;
  createdAtTimestamp: number;
}

/**
 * Registration parameters
 */
export interface RegisterEmployerParams {
  companyName: string;
  email: string;
  location: string;
  signers: `0x${string}`[];
  threshold: number;
}

export interface RegisterEmployeeParams {
  name: string;
  email: string;
  location: string;
}

/**
 * Transaction result
 */
export interface TransactionResult {
  success: boolean;
  hash?: `0x${string}`;
  error?: string;
}

export interface RegisterEmployerResult extends TransactionResult {
  wallet?: `0x${string}`;
  employerId?: number;
}

export interface RegisterEmployeeResult extends TransactionResult {
  employeeId?: number;
}




