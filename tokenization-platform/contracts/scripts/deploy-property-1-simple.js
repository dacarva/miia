const hre = require("hardhat");

// Helper function to wait
const wait = (seconds) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

async function main() {
  console.log("🚀 Deploying MIIA Property 1 (Simple Version)...\n");

  const [deployer] = await hre.ethers.getSigners();
  
  // For testnet deployment, use deployer account as all roles
  const investor1 = deployer;
  const investor2 = deployer;
  
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)));
  console.log("Note: Using deployer account for all investor roles in testnet");

  // Step 1: Deploy T-REX Infrastructure
  console.log("\n📋 Step 1: Deploying T-REX Infrastructure...");
  
  const TrustedIssuersRegistry = await hre.ethers.getContractFactory("TrustedIssuersRegistry");
  const trustedIssuersRegistry = await TrustedIssuersRegistry.deploy();
  await trustedIssuersRegistry.waitForDeployment();
  console.log("   ✅ TrustedIssuersRegistry:", await trustedIssuersRegistry.getAddress());
  await wait(5);

  const ClaimTopicsRegistry = await hre.ethers.getContractFactory("ClaimTopicsRegistry");
  const claimTopicsRegistry = await ClaimTopicsRegistry.deploy();
  await claimTopicsRegistry.waitForDeployment();
  console.log("   ✅ ClaimTopicsRegistry:", await claimTopicsRegistry.getAddress());
  await wait(5);

  const IdentityRegistryStorageFactory = await hre.ethers.getContractFactory("IdentityRegistryStorage");
  const identityStorage = await IdentityRegistryStorageFactory.deploy();
  await identityStorage.waitForDeployment();
  console.log("   🔄 Waiting before initializing IdentityRegistryStorage...");
  await wait(5);
  await identityStorage.init();
  console.log("   ✅ IdentityRegistryStorage:", await identityStorage.getAddress());
  await wait(5);

  const IdentityRegistryFactory = await hre.ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = await IdentityRegistryFactory.deploy();
  await identityRegistry.waitForDeployment();
  console.log("   🔄 Waiting before initializing IdentityRegistry...");
  await wait(5);
  await identityRegistry.init(
    await trustedIssuersRegistry.getAddress(),
    await claimTopicsRegistry.getAddress(),
    await identityStorage.getAddress()
  );
  console.log("   ✅ IdentityRegistry:", await identityRegistry.getAddress());
  await wait(5);

  // Set up permissions
  console.log("   🔄 Setting up permissions...");
  await identityRegistry.addAgent(deployer.address);
  await wait(5);
  await identityStorage.addAgent(await identityRegistry.getAddress());
  await wait(5);
  await identityStorage.addAgent(deployer.address);
  await wait(5);

  // Step 2: Deploy Compliance for Property 1
  console.log("\n📋 Step 2: Deploying Compliance for Property 1...");
  const SimpleComplianceFactory = await hre.ethers.getContractFactory("SimpleCompliance");
  const compliance1 = await SimpleComplianceFactory.deploy();
  await compliance1.waitForDeployment();
  console.log("   🔄 Waiting before initializing SimpleCompliance...");
  await wait(5);
  await compliance1.init();
  console.log("   ✅ SimpleCompliance for Property 1:", await compliance1.getAddress());
  await wait(5);

  // Step 3: Deploy Property Token 1 directly
  console.log("\n🏠 Step 3: Deploying Property 1 Token - Chapinero Apartment...");
  
  const PropertyTokenFactory = await hre.ethers.getContractFactory("PropertyToken");
  const propertyToken1 = await PropertyTokenFactory.deploy();
  await propertyToken1.waitForDeployment();
  console.log("   ✅ PropertyToken deployed at:", await propertyToken1.getAddress());
  await wait(5);

  // Initialize the T-REX token
  console.log("   🔄 Initializing PropertyToken...");
  await propertyToken1.init(
    await identityRegistry.getAddress(),
    await compliance1.getAddress(),
    "Apartamento Chapinero Premium",
    "CHAP001",
    18,
    deployer.address
  );
  console.log("   ✅ PropertyToken initialized");
  await wait(5);

  // Initialize property details
  const propertyDetails = {
    propertyId: "MIIA001",
    propertyAddress: "Calle 63 #11-45, Chapinero, Bogotá",
    cadastralRegistry: "050-0001234",
    totalValue: hre.ethers.parseEther("500"), // 500 ETH = 500M COP
    totalTokens: 500000,
    isActive: true,
    documentHash: "QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o"
  };

  console.log("   🔄 Initializing property details...");
  await propertyToken1.initializeProperty(propertyDetails);
  console.log("   ✅ Property details initialized");

  // Step 4: Summary (Skip investor demo for testnet)
  console.log("\n🎯 === PROPERTY 1 DEPLOYED TO TESTNET ===");
  console.log("📊 Property Summary:");
  console.log(`   Property: Apartamento Chapinero Premium (MIIA001)`);
  console.log(`   Token Address: ${await propertyToken1.getAddress()}`);
  console.log(`   Total Value: ${hre.ethers.formatEther(propertyDetails.totalValue)} ETH`);
  console.log(`   Total Tokens: ${propertyDetails.totalTokens.toLocaleString()}`);
  console.log(`   Status: Ready for demo purchases`);

  // Save deployment info for next scripts
  const network = await hre.ethers.provider.getNetwork();
  const deploymentInfo = {
    network: hre.network.name,
    chainId: Number(network.chainId),
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      TrustedIssuersRegistry: await trustedIssuersRegistry.getAddress(),
      ClaimTopicsRegistry: await claimTopicsRegistry.getAddress(),
      IdentityRegistryStorage: await identityStorage.getAddress(),
      IdentityRegistry: await identityRegistry.getAddress()
    },
    properties: {
      MIIA001: {
        name: "Apartamento Chapinero Premium",
        symbol: "CHAP001",
        tokenAddress: await propertyToken1.getAddress(),
        complianceAddress: await compliance1.getAddress(),
        totalValue: hre.ethers.formatEther(propertyDetails.totalValue) + " ETH",
        totalTokens: Number(propertyDetails.totalTokens),
        soldTokens: 0, // No demo purchases on testnet
        availableTokens: Number(propertyDetails.totalTokens)
      }
    }
  };

  const fs = require('fs');
  const fileName = `miia-simple-deployment-${hre.network.name}.json`;
  fs.writeFileSync(fileName, JSON.stringify(deploymentInfo, null, 2, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
  console.log(`\n💾 Deployment state saved to: ${fileName}`);

  console.log("\n🚀 Property 1 ready! Run deploy-property-2-simple.js next!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });