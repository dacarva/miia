const hre = require("hardhat");

async function main() {
  console.log("Deploying Colombian Real Estate Tokenization Platform...");

  // Deploy TrustedIssuersRegistry (from T-REX)
  console.log("Deploying TrustedIssuersRegistry...");
  const TrustedIssuersRegistry = await hre.ethers.getContractFactory("TrustedIssuersRegistry");
  const trustedIssuersRegistry = await TrustedIssuersRegistry.deploy();
  await trustedIssuersRegistry.waitForDeployment();
  console.log("TrustedIssuersRegistry deployed to:", await trustedIssuersRegistry.getAddress());

  // Deploy ClaimTopicsRegistry (from T-REX)
  console.log("Deploying ClaimTopicsRegistry...");
  const ClaimTopicsRegistry = await hre.ethers.getContractFactory("ClaimTopicsRegistry");
  const claimTopicsRegistry = await ClaimTopicsRegistry.deploy();
  await claimTopicsRegistry.waitForDeployment();
  console.log("ClaimTopicsRegistry deployed to:", await claimTopicsRegistry.getAddress());

  // Deploy PropertyTokenFactory
  console.log("Deploying PropertyTokenFactory...");
  const PropertyTokenFactory = await hre.ethers.getContractFactory("PropertyTokenFactory");
  const factory = await PropertyTokenFactory.deploy(
    await trustedIssuersRegistry.getAddress(),
    await claimTopicsRegistry.getAddress()
  );
  await factory.waitForDeployment();
  console.log("PropertyTokenFactory deployed to:", await factory.getAddress());

  // Save deployment addresses
  const deploymentInfo = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    contracts: {
      TrustedIssuersRegistry: await trustedIssuersRegistry.getAddress(),
      ClaimTopicsRegistry: await claimTopicsRegistry.getAddress(),
      PropertyTokenFactory: await factory.getAddress()
    }
  };

  console.log("\n=== Deployment Summary ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  // Save to file
  const fs = require('fs');
  fs.writeFileSync(
    `deployments-${hre.network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log(`\nDeployment info saved to deployments-${hre.network.name}.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });