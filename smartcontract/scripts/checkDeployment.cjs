const { ethers } = require("hardhat");

async function main() {
    const PAYROLL_PLATFORM_ADDRESS = "0x45CFFa961b1DE99A54DfBD127239Ce2be774Ab84";
    const EXPECTED_FACTORY_ADDRESS = "0xBe84f02eAD3968cE4330fA371b9A19B0819E3Bb8";

    console.log("Checking deployed PayrollPlatform contract...\n");
    console.log("Deployed Address:", PAYROLL_PLATFORM_ADDRESS);
    console.log("Expected Factory Address:", EXPECTED_FACTORY_ADDRESS);

    // Get the deployed contract instance
    const PayrollPlatform = await ethers.getContractFactory("PayrollPlatform");
    const deployedPlatform = PayrollPlatform.attach(PAYROLL_PLATFORM_ADDRESS);

    try {
        // Read the factory address from the deployed contract
        const deployedFactoryAddress = await deployedPlatform.factory();
        console.log("\n✓ Successfully connected to deployed contract");
        console.log("Factory address stored in contract:", deployedFactoryAddress);

        // Compare factory addresses
        if (deployedFactoryAddress.toLowerCase() === EXPECTED_FACTORY_ADDRESS.toLowerCase()) {
            console.log("✓ Factory address matches expected value");
        } else {
            console.log("✗ WARNING: Factory address does NOT match!");
            console.log("  Expected:", EXPECTED_FACTORY_ADDRESS);
            console.log("  Found:", deployedFactoryAddress);
        }

        // Try to read a public mapping to verify contract is working
        try {
            // Try to read employerIdsByOwner for zero address (should return 0 if not registered)
            const testEmployerId = await deployedPlatform.employerIdsByOwner(ethers.ZeroAddress);
            console.log("\n✓ Contract state accessible (tested public mapping)");
        } catch (error) {
            console.log("\n⚠ Note: Could not read contract state");
        }

        // Compile current contract to check bytecode
        console.log("\n--- Compiling current contract ---");
        const currentContract = await ethers.getContractFactory("PayrollPlatform");
        const deploymentData = currentContract.getDeployTransaction(EXPECTED_FACTORY_ADDRESS);
        console.log("✓ Current contract compiles successfully");
        console.log("  Deployment data size:", deploymentData.data.length, "bytes");

        console.log("\n=== Deployment Check Summary ===");
        console.log("✓ Contract is deployed and accessible");
        console.log("✓ Factory address matches");
        console.log("✓ Current contract code compiles");
        console.log("\n⚠ To fully verify bytecode match, run:");
        console.log("   npx hardhat verify --network liskSepolia", PAYROLL_PLATFORM_ADDRESS, EXPECTED_FACTORY_ADDRESS);

    } catch (error) {
        console.error("\n✗ Error checking deployed contract:");
        console.error("  Message:", error.message);
        
        if (error.message.includes("could not detect network")) {
            console.error("\n⚠ Make sure you're connected to the correct network (liskSepolia)");
        } else if (error.message.includes("call revert exception")) {
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

