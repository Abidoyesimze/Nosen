import Multisig from "./Multisig.json";
import Payroll from "./Payroll.json";

/**
 * Contract configuration exports
 * 
 * These exports provide the ABI and address for each deployed contract.
 * Used throughout the application for contract interactions.
 */

export const MultisigContract = {
    abi: Multisig,
    address: "0xBe84f02eAD3968cE4330fA371b9A19B0819E3Bb8" as const,
} as const;

export const PayrollContract = {
    abi: Payroll,
    address: "0x45CFFa961b1DE99A54DfBD127239Ce2be774Ab84" as const,
} as const;

// Type exports for better TypeScript support
export type MultisigContractAddress = typeof MultisigContract.address;
export type PayrollContractAddress = typeof PayrollContract.address;