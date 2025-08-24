const hre = require("hardhat");

// Helper function to wait
const wait = (seconds) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

async function main() {
  console.log("🚀 Deploying MIIA Property 3 - El Poblado Office (Simple)...\n");

  // Load existing deployment info
  const fs = require('fs');
  const fileName = `miia-simple-deployment-${hre.network.name}.json`;
  
  let deploymentInfo;
  try {
    deploymentInfo = JSON.parse(fs.readFileSync(fileName, 'utf8'));
    console.log("📁 Loaded existing deployment state");
  } catch (error) {
    console.error("❌ Error: Run previous scripts first!");
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

  // Step 1: Deploy Compliance for Property 3
  console.log("\n📋 Step 1: Deploying Compliance for Property 3...");
  const SimpleComplianceFactory = await hre.ethers.getContractFactory("SimpleCompliance");
  const compliance3 = await SimpleComplianceFactory.deploy();
  await compliance3.waitForDeployment();
  console.log("   🔄 Waiting before initializing SimpleCompliance...");
  await wait(5);
  await compliance3.init();
  console.log("   ✅ SimpleCompliance for Property 3:", await compliance3.getAddress());
  await wait(5);

  // Step 2: Deploy Property Token 3 directly
  console.log("\n🏠 Step 2: Deploying Property 3 Token - El Poblado Office...");
  
  const PropertyTokenFactory = await hre.ethers.getContractFactory("PropertyToken");
  const propertyToken3 = await PropertyTokenFactory.deploy();
  await propertyToken3.waitForDeployment();
  console.log("   ✅ PropertyToken deployed at:", await propertyToken3.getAddress());
  await wait(5);

  // Initialize the T-REX token
  console.log("   🔄 Initializing PropertyToken...");
  await propertyToken3.init(
    await identityRegistry.getAddress(),
    await compliance3.getAddress(),
    "Oficina El Poblado Medellín",
    "POB003",
    18,
    deployer.address
  );
  console.log("   ✅ PropertyToken initialized");
  await wait(5);

  // Initialize property details
  const propertyDetails = {
    propertyId: "MIIA003",
    propertyAddress: "Calle 10 #43A-34, El Poblado, Medellín",
    cadastralRegistry: "001-0009012",
    totalValue: hre.ethers.parseEther("350"), // 350 ETH = 350M COP
    totalTokens: 350000,
    isActive: true,
    documentHash: "QmT8R7VxF3L9Km2Nb5Qj6Hp8WzX4Yc1Dv9Mt6Es2Fg7Hu3"
  };

  console.log("   🔄 Initializing property details...");
  await propertyToken3.initializeProperty(propertyDetails);
  console.log("   ✅ Property details initialized");

  // Step 3: Summary (Skip investor demo for testnet)
  console.log("\n🎯 === PROPERTY 3 DEPLOYED TO TESTNET ===");
  console.log("📊 Property Summary:");
  console.log(`   Property: Oficina El Poblado Medellín (MIIA003)`);
  console.log(`   Token Address: ${await propertyToken3.getAddress()}`);
  console.log(`   Total Value: ${hre.ethers.formatEther(propertyDetails.totalValue)} ETH`);
  console.log(`   Total Tokens: ${propertyDetails.totalTokens.toLocaleString()}`);
  console.log(`   Status: Ready for demo purchases`);

  // Update deployment info
  deploymentInfo.timestamp = new Date().toISOString();
  deploymentInfo.properties.MIIA003 = {
    name: "Oficina El Poblado Medellín",
    symbol: "POB003",
    tokenAddress: await propertyToken3.getAddress(),
    complianceAddress: await compliance3.getAddress(),
    totalValue: hre.ethers.formatEther(propertyDetails.totalValue) + " ETH",
    totalTokens: Number(propertyDetails.totalTokens),
    soldTokens: 0, // No demo purchases on testnet
    availableTokens: Number(propertyDetails.totalTokens)
  };

  fs.writeFileSync(fileName, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Updated deployment state in: ${fileName}`);

  // Step 4: Complete Portfolio Summary for Testnet
  console.log("\n🎯 === COMPLETE PORTFOLIO DEPLOYED TO TESTNET ===");
  console.log("📊 All 3 Properties Summary:");
  
  let totalPortfolioValue = 0n;
  
  for (const [propertyId, propInfo] of Object.entries(deploymentInfo.properties)) {
    const propValue = hre.ethers.parseEther(propInfo.totalValue.split(' ')[0]);
    totalPortfolioValue += propValue;
    
    console.log(`\n   🏠 ${propInfo.name} (${propertyId}):`);
    console.log(`   Symbol: ${propInfo.symbol}`);
    console.log(`   Value: ${propInfo.totalValue}`);
    console.log(`   Tokens: ${propInfo.soldTokens}/${propInfo.totalTokens}`);
    console.log(`   Token Address: ${propInfo.tokenAddress}`);
    console.log(`   Compliance: ${propInfo.complianceAddress}`);
  }

  console.log(`\n💰 TOTAL PORTFOLIO VALUE: ${hre.ethers.formatEther(totalPortfolioValue)} ETH`);
  console.log(`🆔 Shared Identity Registry: ${deploymentInfo.contracts.IdentityRegistry}`);
  console.log(`🏗️  Deployer Account: ${deployer.address}`);
  
  console.log("\n🚀 ALL 3 PROPERTIES DEPLOYED AND READY FOR HACKATHON DEMO!");
  console.log("📋 Next: Use these contract addresses for your demo purchases");
  
  // Final deployment info update
  deploymentInfo.summary = {
    totalPortfolioValue: hre.ethers.formatEther(totalPortfolioValue) + " ETH",
    totalProperties: Object.keys(deploymentInfo.properties).length,
    deploymentNetwork: "base-sepolia",
    readyForDemo: true
  };
  
  fs.writeFileSync(fileName, JSON.stringify(deploymentInfo, null, 2));
  const finalFileName = `miia-final-simple-deployment-${hre.network.name}.json`;
  fs.writeFileSync(finalFileName, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Final deployment saved to: ${finalFileName}`);

  console.log("\n📋 DEPLOYMENT INSTRUCTIONS:");
  console.log("1. Run: npx hardhat run scripts/deploy-property-1-simple.js --network hardhat");
  console.log("2. Run: npx hardhat run scripts/deploy-property-2-simple.js --network hardhat");
  console.log("3. Run: npx hardhat run scripts/deploy-property-3-simple.js --network hardhat");
  console.log("\n✅ Each property has its own compliance but shares the identity registry!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });