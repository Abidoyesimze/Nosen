const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);

  // Deploy Nosen contract (no constructor args)
  const Nosen = await hre.ethers.deployContract("Nosen");
  await Nosen.waitForDeployment();

  console.log("✅ Nosen Contract Deployed at:", await Nosen.getAddress());
  console.log("");

  // Optional: Verify contracts on Etherscan (only if network is not localhost/hardhat)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("🔍 Verifying contract...");
    try {
      await hre.run("verify:verify", {
        address: await Nosen.getAddress(),
        constructorArguments: [], // no args
        contract: "contracts/Nosen.sol:Nosen",
      });
    } catch (err) {
      console.log("Verification failed:", err.message);
    }
  } else {
    console.log("⏩ Skipping verification on local network");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
