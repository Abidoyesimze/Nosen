const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("🚀 Deploying contracts with account:", deployer.address);

  // 1. Get contract factory
  const NosenFactory = await hre.ethers.getContractFactory("Nosen");

  // 2. Deploy contract
  const nosen = await NosenFactory.deploy();

  // 3. Wait for deployment
  await nosen.waitForDeployment();

  console.log("✅ Nosen Contract Deployed at:", await nosen.getAddress());
  console.log("");

  // Optional: Verify contract
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("🔍 Verifying contract...");
    try {
      await hre.run("verify:verify", {
        address: await nosen.getAddress(),
        contract: "contracts/Nosen.sol:Nosen",
      });
    } catch (err) {
      console.log("❌ Verification failed:", err.message);
    }
  } else {
    console.log("⏩ Skipping verification on local network");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
