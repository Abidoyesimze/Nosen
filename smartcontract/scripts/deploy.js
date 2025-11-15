const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

    // USDC contract address on Lisk Sepolia
    const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

    // Step 1: Deploy MultiSigFactory
    console.log("\n1. Deploying MultiSigFactory...");
    const MultiSigFactory = await ethers.getContractFactory("MultiSigFactory");
    const factory = await MultiSigFactory.deploy(USDC_ADDRESS);
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    console.log("MultiSigFactory deployed to:", factoryAddress);

    // Step 2: Deploy PayrollPlatform
    console.log("\n2. Deploying PayrollPlatform...");
    const PayrollPlatform = await ethers.getContractFactory("PayrollPlatform");
    const platform = await PayrollPlatform.deploy(factoryAddress);
    await platform.waitForDeployment();
    const platformAddress = await platform.getAddress();
    console.log("PayrollPlatform deployed to:", platformAddress);

    console.log("\n=== Deployment Summary ===");
    console.log("MultiSigFactory:", factoryAddress);
    console.log("PayrollPlatform:", platformAddress);
    console.log("USDC Token:", USDC_ADDRESS);
    console.log("\nSave these addresses for your frontend configuration!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

