const { ethers } = require("ethers");
const dotenv = require("dotenv");

dotenv.config();

const PAYROLL_PLATFORM_ADDRESS = "0x45CFFa961b1DE99A54DfBD127239Ce2be774Ab84";
const EXPECTED_FACTORY_ADDRESS = "0xBe84f02eAD3968cE4330fA371b9A19B0819E3Bb8";
const RPC_URL = process.env.LISK_SEPOLIA_RPC_URL || "https://rpc.sepolia.lisk.com";

// Simple ABI to read the factory address
const FACTORY_ABI = [
    "function factory() external view returns (address)"
];

async function main() {
    console.log("Checking deployed PayrollPlatform contract...\n");
    console.log("Deployed Address:", PAYROLL_PLATFORM_ADDRESS);
    console.log("Expected Factory Address:", EXPECTED_FACTORY_ADDRESS);
    console.log("RPC URL:", RPC_URL);

    try {
        const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(PAYROLL_PLATFORM_ADDRESS, FACTORY_ABI, provider);

        // Read the factory address from the deployed contract
        const deployedFactoryAddress = await contract.factory();
        console.log("\n✓ Successfully connected to deployed contract");
        console.log("Factory address stored in contract:", deployedFactoryAddress);

        // Compare factory addresses
        if (deployedFactoryAddress.toLowerCase() === EXPECTED_FACTORY_ADDRESS.toLowerCase()) {
            console.log("✓ Factory address matches expected value");
            console.log("\n=== Summary ===");
            console.log("✓ Contract is deployed and accessible");
            console.log("✓ Factory address is correct");
            console.log("\n⚠ To fully verify the contract bytecode matches your current code:");
            console.log("   1. Make sure hardhat.config.js is properly configured");
            console.log("   2. Run: npx hardhat verify --network liskSepolia", PAYROLL_PLATFORM_ADDRESS, EXPECTED_FACTORY_ADDRESS);
            console.log("   3. Or check the contract on Blockscout:");
            console.log("      https://sepolia-blockscout.lisk.com/address/" + PAYROLL_PLATFORM_ADDRESS);
        } else {
            console.log("✗ WARNING: Factory address does NOT match!");
            console.log("  Expected:", EXPECTED_FACTORY_ADDRESS);
            console.log("  Found:", deployedFactoryAddress);
            console.log("\n⚠ This suggests the deployed contract may be different from what's expected.");
        }
    } catch (error) {
        console.error("\n✗ Error checking deployed contract:");
        console.error("  Message:", error.message);
        
        if (error.message.includes("network")) {
            console.error("\n⚠ Make sure you're connected to the correct network (liskSepolia)");
        } else if (error.message.includes("revert") || error.message.includes("call")) {
            console.error("\n⚠ Contract might not be deployed at this address, or network mismatch");
        }
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

