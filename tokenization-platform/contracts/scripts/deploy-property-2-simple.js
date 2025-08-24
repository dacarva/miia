const hre = require("hardhat");

const DEPLOYMENT_DELAY = 4;

// Helper function to wait
const wait = (seconds) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

async function main() {
  console.log("🚀 Deploying MIIA Property 2 (Real Data Version)...\n");

  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)));

  // Load previous deployment info
  const fs = require('fs');
  const fileName = `miia-simple-deployment-${hre.network.name}.json`;
  
  if (!fs.existsSync(fileName)) {
    console.error(`❌ Previous deployment file ${fileName} not found. Please run deploy-property-1-simple.js first.`);
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(fileName, 'utf8'));
  console.log("📋 Loaded previous deployment info");

  // Step 1: Deploy Compliance for Property 2
  console.log("\n📋 Step 1: Deploying Compliance for Property 2...");
  const SimpleComplianceFactory = await hre.ethers.getContractFactory("SimpleCompliance");
  const compliance2 = await SimpleComplianceFactory.deploy();
  await compliance2.waitForDeployment();
  console.log("   🔄 Waiting before initializing SimpleCompliance...");
  await wait(DEPLOYMENT_DELAY);
  await compliance2.init();
  console.log("   ✅ SimpleCompliance for Property 2:", await compliance2.getAddress());
  await wait(DEPLOYMENT_DELAY);

  // Step 2: Deploy Property Token 2 with real data
  console.log("\n🏠 Step 2: Deploying Property 2 Token - Apartamento Cerritos...");
  
  const PropertyTokenFactory = await hre.ethers.getContractFactory("PropertyToken");
  const propertyToken2 = await PropertyTokenFactory.deploy();
  await propertyToken2.waitForDeployment();
  console.log("   ✅ PropertyToken deployed at:", await propertyToken2.getAddress());
  await wait(DEPLOYMENT_DELAY);

  // Initialize the T-REX token
  console.log("   🔄 Initializing PropertyToken...");
  await propertyToken2.init(
    deploymentInfo.contracts.IdentityRegistry,
    await compliance2.getAddress(),
    "Apartamento Cerritos Premium",
    "CERR002",
    0, // Decimals set to 0 for whole shares
    deployer.address
  );
  console.log("   ✅ PropertyToken initialized");
  await wait(DEPLOYMENT_DELAY);

  // Initialize property details with optimized data structure
  const propertyDetails = {
    // Core identification
    propertyId: "MIIA002",                    // MIIA internal ID
    title: "Apartamento en Venta y Arriendo, CERRITOS, Pereira",
    
    // Location information
    neighborhood: "CERRITOS",
    cityName: "Pereira",
    
    // Property characteristics
    propertyType: "apartamento",
    
    // Physical characteristics
    area: 310,
    
    // Financial information
    saleValue: 1600000000,                    // 1.6B COP (actual purchase price)
    totalValue: hre.ethers.parseEther("1600"), // Internal accounting value (1600 ETH units)
    totalTokens: 1600000,                     // 1.6M tokens
    
    // Tokenization status
    isActive: true,
    tokenizationDate: 0  // Will be set by the contract
  };

  console.log("   🔄 Initializing property details...");
  await propertyToken2.initializeProperty(propertyDetails);
  console.log("   ✅ Property details initialized");
  await wait(DEPLOYMENT_DELAY);

  // Add agent role for property operations first
  console.log("   🔄 Setting up property token agent...");
  await propertyToken2.addAgent(deployer.address);
  console.log("   ✅ Agent role added to deployer");
  await wait(DEPLOYMENT_DELAY);

  // Step 3: Set Colombian COP token in property (reuse from previous deployment)
  console.log("\n💰 Step 3: Setting Colombian COP token in property...");
  await propertyToken2.setColombianCOP(deploymentInfo.contracts.ColombianCOP);
  console.log("   ✅ Colombian COP token set in property");
  console.log("   ✅ COP Token Address:", deploymentInfo.contracts.ColombianCOP);
  await wait(DEPLOYMENT_DELAY);

  // Step 4: Summary
  console.log("\n🎯 === PROPERTY 2 DEPLOYED TO TESTNET ===");
  console.log("📊 Property Summary:");
  console.log(`   Property: ${propertyDetails.title}`);
  console.log(`   MIIA ID: ${propertyDetails.propertyId}`);
  console.log(`   Location: ${propertyDetails.neighborhood}, ${propertyDetails.cityName}`);
  console.log(`   Type: ${propertyDetails.propertyType}`);
  console.log(`   Area: ${propertyDetails.area}m²`);
  console.log(`   Sale Value: ${(propertyDetails.saleValue / 1000000000).toFixed(1)}B COP`);
  console.log(`   Token Address: ${await propertyToken2.getAddress()}`);
  console.log(`   COP Token Address: ${deploymentInfo.contracts.ColombianCOP}`);
  console.log(`   Internal Value: ${hre.ethers.formatEther(propertyDetails.totalValue)} ETH units (accounting)`);
  console.log(`   Total Tokens: ${propertyDetails.totalTokens.toLocaleString()}`);
  console.log(`   🇨🇴 PURCHASE PRICE: ${(propertyDetails.saleValue / propertyDetails.totalTokens).toLocaleString()} COP per token`);
  console.log(`   Status: Ready for COP-based purchases only! 🇨🇴`);

  // Update deployment info
  deploymentInfo.properties.MIIA002 = {
    name: propertyDetails.title,
    symbol: "CERR002",
    tokenAddress: await propertyToken2.getAddress(),
    complianceAddress: await compliance2.getAddress(),
    totalValue: hre.ethers.formatEther(propertyDetails.totalValue) + " ETH",
    totalTokens: Number(propertyDetails.totalTokens),
    soldTokens: 0, // No demo purchases on testnet
    availableTokens: Number(propertyDetails.totalTokens),
    propertyDetails: {
      propertyId: propertyDetails.propertyId,
      title: propertyDetails.title,
      neighborhood: propertyDetails.neighborhood,
      cityName: propertyDetails.cityName,
      propertyType: propertyDetails.propertyType,
      area: propertyDetails.area,
      saleValue: propertyDetails.saleValue,
      totalValue: propertyDetails.totalValue.toString(),
      totalTokens: propertyDetails.totalTokens,
      isActive: propertyDetails.isActive,
      copTokenAddress: deploymentInfo.contracts.ColombianCOP,
      copPricePerToken: propertyDetails.saleValue / propertyDetails.totalTokens
    }
  };

  // Save updated deployment info
  fs.writeFileSync(fileName, JSON.stringify(deploymentInfo, null, 2, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
  console.log(`\n💾 Updated deployment state saved to: ${fileName}`);

  console.log("\n🚀 Property 2 ready! Run deploy-property-3-simple.js next!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });