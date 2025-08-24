const hre = require("hardhat");

// Helper function to wait
const wait = (seconds) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

async function main() {
  console.log("🚀 Deploying MIIA Property 2 - Zona Rosa House (Simple)...\n");

  // Load existing deployment info
  const fs = require('fs');
  const fileName = `miia-simple-deployment-${hre.network.name}.json`;
  
  let deploymentInfo;
  try {
    deploymentInfo = JSON.parse(fs.readFileSync(fileName, 'utf8'));
    console.log("📁 Loaded existing deployment state");
  } catch (error) {
    console.error("❌ Error: Run deploy-property-1-simple.js first!");
    process.exit(1);
  }

  const [deployer] = await hre.ethers.getSigners();
  
  // For testnet deployment, use deployer account as all roles
  const investor1 = deployer;
  const investor2 = deployer;
  
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)));
  console.log("Note: Using deployer account for all investor roles in testnet");

  // Get existing contracts
  console.log("\n🔗 Connecting to existing infrastructure...");
  const identityRegistry = await hre.ethers.getContractAt("IdentityRegistry", deploymentInfo.contracts.IdentityRegistry);
  console.log("   ✅ Connected to existing T-REX infrastructure");

  // Step 1: Deploy Compliance for Property 2
  console.log("\n📋 Step 1: Deploying Compliance for Property 2...");
  const SimpleComplianceFactory = await hre.ethers.getContractFactory("SimpleCompliance");
  const compliance2 = await SimpleComplianceFactory.deploy();
  await compliance2.waitForDeployment();
  console.log("   🔄 Waiting before initializing SimpleCompliance...");
  await wait(5);
  await compliance2.init();
  console.log("   ✅ SimpleCompliance for Property 2:", await compliance2.getAddress());
  await wait(5);

  // Step 2: Deploy Property Token 2 directly
  console.log("\n🏠 Step 2: Deploying Property 2 Token - Zona Rosa House...");
  
  const PropertyTokenFactory = await hre.ethers.getContractFactory("PropertyToken");
  const propertyToken2 = await PropertyTokenFactory.deploy();
  await propertyToken2.waitForDeployment();
  console.log("   ✅ PropertyToken deployed at:", await propertyToken2.getAddress());
  await wait(5);

  // Initialize the T-REX token
  console.log("   🔄 Initializing PropertyToken...");
  await propertyToken2.init(
    await identityRegistry.getAddress(),
    await compliance2.getAddress(),
    "Casa Zona Rosa Bogotá",
    "ROSA002",
    18,
    deployer.address
  );
  console.log("   ✅ PropertyToken initialized");
  await wait(5);

  // Initialize property details
  const propertyDetails = {
    propertyId: "MIIA002",
    propertyAddress: "Carrera 11 #93-07, Zona Rosa, Bogotá",
    cadastralRegistry: "050-0005678",
    totalValue: hre.ethers.parseEther("800"), // 800 ETH = 800M COP
    totalTokens: 800000,
    isActive: true,
    documentHash: "QmPK2s5KvE8H6YMxb6u7Ju8LvHq9KJng7RqD3F2mWxC1pZ"
  };

  console.log("   🔄 Initializing property details...");
  await propertyToken2.initializeProperty(propertyDetails);
  console.log("   ✅ Property details initialized");

  // Step 3: Summary (Skip investor demo for testnet)
  console.log("\n🎯 === PROPERTY 2 DEPLOYED TO TESTNET ===");
  console.log("📊 Property Summary:");
  console.log(`   Property: Casa Zona Rosa Bogotá (MIIA002)`);
  console.log(`   Token Address: ${await propertyToken2.getAddress()}`);
  console.log(`   Total Value: ${hre.ethers.formatEther(propertyDetails.totalValue)} ETH`);
  console.log(`   Total Tokens: ${propertyDetails.totalTokens.toLocaleString()}`);
  console.log(`   Status: Ready for demo purchases`);

  // Update deployment info
  deploymentInfo.timestamp = new Date().toISOString();
  deploymentInfo.properties.MIIA002 = {
    name: "Casa Zona Rosa Bogotá",
    symbol: "ROSA002",
    tokenAddress: await propertyToken2.getAddress(),
    complianceAddress: await compliance2.getAddress(),
    totalValue: hre.ethers.formatEther(propertyDetails.totalValue) + " ETH",
    totalTokens: Number(propertyDetails.totalTokens),
    soldTokens: 0, // No demo purchases on testnet
    availableTokens: Number(propertyDetails.totalTokens)
  };

  fs.writeFileSync(fileName, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Updated deployment state in: ${fileName}`);

  console.log("\n🚀 Property 2 ready! Run deploy-property-3-simple.js next!");
  
  // Show portfolio summary
  const prop1Value = hre.ethers.parseEther("500");
  const prop2Value = hre.ethers.parseEther("800");
  const totalPortfolio = prop1Value + prop2Value;
  console.log(`\n📊 Portfolio so far: ${hre.ethers.formatEther(totalPortfolio)} ETH (2 properties)`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });