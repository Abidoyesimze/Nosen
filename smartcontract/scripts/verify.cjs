const { run } = require("hardhat");

async function main() {
    // Contract addresses from deployment
    const MULTISIG_FACTORY_ADDRESS = "0xBe84f02eAD3968cE4330fA371b9A19B0819E3Bb8";
    const PAYROLL_PLATFORM_ADDRESS = "0x45CFFa961b1DE99A54DfBD127239Ce2be774Ab84";

    // Constructor arguments
    const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
    const FACTORY_ADDRESS = MULTISIG_FACTORY_ADDRESS;

    console.log("Verifying contracts on Lisk Sepolia...\n");

    // Verify MultiSigFactory
    console.log("1. Verifying MultiSigFactory...");
    try {
        await run("verify:verify", {
            address: MULTISIG_FACTORY_ADDRESS,
            constructorArguments: [USDC_ADDRESS],
            network: "liskSepolia"
        });
        console.log("✓ MultiSigFactory verified successfully!\n");
    } catch (error) {
        if (error.message.toLowerCase().includes("already verified")) {
            console.log("✓ MultiSigFactory already verified!\n");
        } else {
            console.error("✗ Error verifying MultiSigFactory:", error.message);
        }
    }

    // Verify PayrollPlatform
    console.log("2. Verifying PayrollPlatform...");
    try {
        await run("verify:verify", {
            address: PAYROLL_PLATFORM_ADDRESS,
            constructorArguments: [FACTORY_ADDRESS],
            network: "liskSepolia"
        });
        console.log("✓ PayrollPlatform verified successfully!\n");
    } catch (error) {
        if (error.message.toLowerCase().includes("already verified")) {
            console.log("✓ PayrollPlatform already verified!\n");
        } else {
            console.error("✗ Error verifying PayrollPlatform:", error.message);
        }
    }

    console.log("\n=== Verification Summary ===");
    console.log("MultiSigFactory:", MULTISIG_FACTORY_ADDRESS);
    console.log("PayrollPlatform:", PAYROLL_PLATFORM_ADDRESS);
    console.log("\nView on Blockscout:");
    console.log(`MultiSigFactory: https://sepolia-blockscout.lisk.com/address/${MULTISIG_FACTORY_ADDRESS}`);
    console.log(`PayrollPlatform: https://sepolia-blockscout.lisk.com/address/${PAYROLL_PLATFORM_ADDRESS}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

