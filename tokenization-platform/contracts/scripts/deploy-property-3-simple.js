const hre = require("hardhat");

const DEPLOYMENT_DELAY = 1;

// Helper function to wait
const wait = (seconds) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

async function main() {
  console.log("🚀 Deploying MIIA Property 3 (Real Data Version)...\n");

  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)));

  // Load previous deployment info
  const fs = require('fs');
  const fileName = `miia-simple-deployment-${hre.network.name}.json`;
  
  if (!fs.existsSync(fileName)) {
    console.error(`❌ Previous deployment file ${fileName} not found. Please run deploy-property-1-simple.js and deploy-property-2-simple.js first.`);
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(fileName, 'utf8'));
  console.log("📋 Loaded previous deployment info");

  // Step 1: Deploy Compliance for Property 3
  console.log("\n📋 Step 1: Deploying Compliance for Property 3...");
  const SimpleComplianceFactory = await hre.ethers.getContractFactory("SimpleCompliance");
  const compliance3 = await SimpleComplianceFactory.deploy();
  await compliance3.waitForDeployment();
  console.log("   🔄 Waiting before initializing SimpleCompliance...");
  await wait(DEPLOYMENT_DELAY);
  await compliance3.init();
  console.log("   ✅ SimpleCompliance for Property 3:", await compliance3.getAddress());
  await wait(DEPLOYMENT_DELAY);

  // Step 2: Deploy Property Token 3 with real data
  console.log("\n🏠 Step 2: Deploying Property 3 Token - PH Dúplex Rosales...");
  
  const PropertyTokenFactory = await hre.ethers.getContractFactory("PropertyToken");
  const propertyToken3 = await PropertyTokenFactory.deploy();
  await propertyToken3.waitForDeployment();
  console.log("   ✅ PropertyToken deployed at:", await propertyToken3.getAddress());
  await wait(DEPLOYMENT_DELAY);

  // Initialize the T-REX token
  console.log("   🔄 Initializing PropertyToken...");
  await propertyToken3.init(
    deploymentInfo.contracts.IdentityRegistry,
    await compliance3.getAddress(),
    "PH Dúplex Rosales Premium",
    "ROSA003",
    18,
    deployer.address
  );
  console.log("   ✅ PropertyToken initialized");
  await wait(DEPLOYMENT_DELAY);

  // Initialize property details with optimized data structure
  const propertyDetails = {
    // Core identification
    propertyId: "MIIA003",                    // MIIA internal ID
    title: "PH dúplex Clásico en Rosales Alto, Bogotá",
    
    // Location information
    neighborhood: "Rosales Alto",
    cityName: "Bogotá D,C,",
    
    // Property characteristics
    propertyType: "apartamento",
    
    // Physical characteristics
    area: 372,
    
    // Financial information
    saleValue: 2100000000,                    // 2.1B COP (actual purchase price)
    totalValue: hre.ethers.parseEther("2100"), // Internal accounting value (2100 ETH units)
    totalTokens: 2100000,                     // 2.1M tokens
    
    // Tokenization status
    isActive: true,
    tokenizationDate: 0  // Will be set by the contract
  };

  console.log("   🔄 Initializing property details...");
  await propertyToken3.initializeProperty(propertyDetails);
  console.log("   ✅ Property details initialized");
  await wait(DEPLOYMENT_DELAY);

  // Add agent role for property operations first
  console.log("   🔄 Setting up property token agent...");
  await propertyToken3.addAgent(deployer.address);
  console.log("   ✅ Agent role added to deployer");
  await wait(DEPLOYMENT_DELAY);

  // Step 3: Set Colombian COP token in property (reuse from previous deployment)
  console.log("\n💰 Step 3: Setting Colombian COP token in property...");
  await propertyToken3.setColombianCOP(deploymentInfo.contracts.ColombianCOP);
  console.log("   ✅ Colombian COP token set in property");
  console.log("   ✅ COP Token Address:", deploymentInfo.contracts.ColombianCOP);
  await wait(DEPLOYMENT_DELAY);

  // Step 4: Summary
  console.log("\n🎯 === PROPERTY 3 DEPLOYED TO TESTNET ===");
  console.log("📊 Property Summary:");
  console.log(`   Property: ${propertyDetails.title}`);
  console.log(`   MIIA ID: ${propertyDetails.propertyId}`);
  console.log(`   Location: ${propertyDetails.neighborhood}, ${propertyDetails.cityName}`);
  console.log(`   Type: ${propertyDetails.propertyType}`);
  console.log(`   Area: ${propertyDetails.area}m²`);
  console.log(`   Sale Value: ${(propertyDetails.saleValue / 1000000000).toFixed(1)}B COP`);
  console.log(`   Token Address: ${await propertyToken3.getAddress()}`);
  console.log(`   COP Token Address: ${deploymentInfo.contracts.ColombianCOP}`);
  console.log(`   Internal Value: ${hre.ethers.formatEther(propertyDetails.totalValue)} ETH units (accounting)`);
  console.log(`   Total Tokens: ${propertyDetails.totalTokens.toLocaleString()}`);
  console.log(`   🇨🇴 PURCHASE PRICE: ${(propertyDetails.saleValue / propertyDetails.totalTokens).toLocaleString()} COP per token`);
  console.log(`   Status: Ready for COP-based purchases only! 🇨🇴`);

  // Update deployment info
  deploymentInfo.properties.MIIA003 = {
    name: propertyDetails.title,
    symbol: "ROSA003",
    tokenAddress: await propertyToken3.getAddress(),
    complianceAddress: await compliance3.getAddress(),
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

  // Show final portfolio summary
  console.log("\n🎯 === FINAL PORTFOLIO SUMMARY ===");
  console.log("📊 All Properties Deployed Successfully:");
  
  let totalValue = 0n;
  let totalTokens = 0;
  
  for (const [propertyId, property] of Object.entries(deploymentInfo.properties)) {
    const value = hre.ethers.parseEther(property.totalValue.split(' ')[0]);
    totalValue += value;
    totalTokens += property.totalTokens;
    
    console.log(`   ${propertyId}: ${property.name}`);
    console.log(`      Location: ${property.propertyDetails.neighborhood}, ${property.propertyDetails.cityName}`);
    console.log(`      Value: ${property.totalValue}`);
    console.log(`      Tokens: ${property.totalTokens.toLocaleString()}`);
    console.log(`      Type: ${property.propertyDetails.propertyType}`);
    console.log(`      Area: ${property.propertyDetails.area}m²`);
    console.log(`      Sale Price: ${(property.propertyDetails.saleValue / 1000000).toFixed(0)}M COP`);
    console.log(`      COP per Token: ${property.propertyDetails.copPricePerToken.toLocaleString()} COP`);
    console.log(`      Token Address: ${property.tokenAddress}`);
    console.log(`      COP Token: ${property.propertyDetails.copTokenAddress}`);
    console.log("");
  }
  
  console.log(`💰 Total Portfolio Value: ${hre.ethers.formatEther(totalValue)} ETH`);
  console.log(`🎫 Total Tokens Available: ${totalTokens.toLocaleString()}`);
  console.log(`🏠 Properties: ${Object.keys(deploymentInfo.properties).length}`);
  
  console.log(`🇨🇴 Colombian COP Token: ${deploymentInfo.contracts.ColombianCOP}`);
  console.log("\n🚀 All properties deployed successfully! The MIIA tokenization platform is ready for COP-based purchases! 🇨🇴");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });