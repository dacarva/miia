const hre = require("hardhat");

const DEPLOYMENT_DELAY = 4;

// Helper function to wait
const wait = (seconds) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

async function main() {
  console.log("🚀 Deploying MIIA Property 1 (Real Data Version)...\n");

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
  await wait(DEPLOYMENT_DELAY);

  const ClaimTopicsRegistry = await hre.ethers.getContractFactory("ClaimTopicsRegistry");
  const claimTopicsRegistry = await ClaimTopicsRegistry.deploy();
  await claimTopicsRegistry.waitForDeployment();
  console.log("   ✅ ClaimTopicsRegistry:", await claimTopicsRegistry.getAddress());
  await wait(DEPLOYMENT_DELAY);

  const IdentityRegistryStorageFactory = await hre.ethers.getContractFactory("IdentityRegistryStorage");
  const identityStorage = await IdentityRegistryStorageFactory.deploy();
  await identityStorage.waitForDeployment();
  console.log("   🔄 Waiting before initializing IdentityRegistryStorage...");
  await wait(DEPLOYMENT_DELAY);
  await identityStorage.init();
  console.log("   ✅ IdentityRegistryStorage:", await identityStorage.getAddress());
  await wait(DEPLOYMENT_DELAY);

  const IdentityRegistryFactory = await hre.ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = await IdentityRegistryFactory.deploy();
  await identityRegistry.waitForDeployment();
  console.log("   🔄 Waiting before initializing IdentityRegistry...");
  await wait(DEPLOYMENT_DELAY);
  await identityRegistry.init(
    await trustedIssuersRegistry.getAddress(),
    await claimTopicsRegistry.getAddress(),
    await identityStorage.getAddress()
  );
  console.log("   ✅ IdentityRegistry:", await identityRegistry.getAddress());
  await wait(DEPLOYMENT_DELAY);

  // Set up permissions
  console.log("   🔄 Setting up permissions...");
  await identityRegistry.addAgent(deployer.address);
  await wait(DEPLOYMENT_DELAY);
  await identityStorage.addAgent(await identityRegistry.getAddress());
  await wait(DEPLOYMENT_DELAY);
  await identityStorage.addAgent(deployer.address);
  await wait(DEPLOYMENT_DELAY);

  // Step 2: Deploy Compliance for Property 1
  console.log("\n📋 Step 2: Deploying Compliance for Property 1...");
  const SimpleComplianceFactory = await hre.ethers.getContractFactory("SimpleCompliance");
  const compliance1 = await SimpleComplianceFactory.deploy();
  await compliance1.waitForDeployment();
  console.log("   🔄 Waiting before initializing SimpleCompliance...");
  await wait(DEPLOYMENT_DELAY);
  await compliance1.init();
  console.log("   ✅ SimpleCompliance for Property 1:", await compliance1.getAddress());
  await wait(DEPLOYMENT_DELAY);

  // Step 3: Deploy Property Token 1 with real data
  console.log("\n🏠 Step 3: Deploying Property 1 Token - Apartaestudio La Julita...");
  
  const PropertyTokenFactory = await hre.ethers.getContractFactory("PropertyToken");
  const propertyToken1 = await PropertyTokenFactory.deploy();
  await propertyToken1.waitForDeployment();
  console.log("   ✅ PropertyToken deployed at:", await propertyToken1.getAddress());
  await wait(DEPLOYMENT_DELAY);

  // Initialize the T-REX token
  console.log("   🔄 Initializing PropertyToken...");
  await propertyToken1.init(
    await identityRegistry.getAddress(),
    await compliance1.getAddress(),
    "Apartaestudio La Julita Premium",
    "LAJU001",
    0, // Decimals set to 0 for whole shares
    deployer.address
  );
  console.log("   ✅ PropertyToken initialized");
  await wait(DEPLOYMENT_DELAY);

  // Initialize property details with optimized data structure
  const propertyDetails = {
    // Core identification
    propertyId: "MIIA001",                    // MIIA internal ID
    title: "Apartaestudio en Venta, La Julita, Pereira",
    
    // Location information
    neighborhood: "La Julita",
    cityName: "Pereira",
    
    // Property characteristics
    propertyType: "apartaestudio",
    
    // Physical characteristics
    area: 32,
    
    // Financial information
    saleValue: 240000000,                     // 240M COP (actual purchase price)
    totalValue: hre.ethers.parseEther("240"), // Internal accounting value (240 ETH units)
    totalTokens: 240000,                      // 240K tokens
    
    // Tokenization status
    isActive: true,
    tokenizationDate: 0  // Will be set by the contract
  };

  console.log("   🔄 Initializing property details...");
  await propertyToken1.initializeProperty(propertyDetails);
  console.log("   ✅ Property details initialized");
  await wait(DEPLOYMENT_DELAY);

  // Step 4: Deploy Colombian COP Token and set it
  console.log("\n💰 Step 4: Deploying Colombian COP Token...");
  const ColombianCOPFactory = await hre.ethers.getContractFactory("ColombianCOP");
  const colombianCOP = await ColombianCOPFactory.deploy();
  await colombianCOP.waitForDeployment();
  console.log("   ✅ ColombianCOP deployed at:", await colombianCOP.getAddress());
  await wait(DEPLOYMENT_DELAY);

  // Add agent role for property operations first
  console.log("   🔄 Setting up property token agent...");
  await propertyToken1.addAgent(deployer.address);
  console.log("   ✅ Agent role added to deployer");
  await wait(DEPLOYMENT_DELAY);

  // Set Colombian COP token in property token
  console.log("   🔄 Setting Colombian COP token in property...");
  await propertyToken1.setColombianCOP(await colombianCOP.getAddress());
  console.log("   ✅ Colombian COP token set in property");
  await wait(DEPLOYMENT_DELAY);

  // Step 5: Summary
  console.log("\n🎯 === PROPERTY 1 DEPLOYED TO TESTNET ===");
  console.log("📊 Property Summary:");
  console.log(`   Property: ${propertyDetails.title}`);
  console.log(`   MIIA ID: ${propertyDetails.propertyId}`);
  console.log(`   Location: ${propertyDetails.neighborhood}, ${propertyDetails.cityName}`);
  console.log(`   Type: ${propertyDetails.propertyType}`);
  console.log(`   Area: ${propertyDetails.area}m²`);
  console.log(`   Sale Value: ${(propertyDetails.saleValue / 1000000).toFixed(0)}M COP`);
  console.log(`   Token Address: ${await propertyToken1.getAddress()}`);
  console.log(`   COP Token Address: ${await colombianCOP.getAddress()}`);
  console.log(`   Internal Value: ${hre.ethers.formatEther(propertyDetails.totalValue)} ETH units (accounting)`);
  console.log(`   Total Tokens: ${propertyDetails.totalTokens.toLocaleString()}`);
  console.log(`   🇨🇴 PURCHASE PRICE: ${(propertyDetails.saleValue / propertyDetails.totalTokens).toLocaleString()} COP per token`);
  console.log(`   Status: Ready for COP-based purchases only! 🇨🇴`);

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
      IdentityRegistry: await identityRegistry.getAddress(),
      ColombianCOP: await colombianCOP.getAddress()
    },
    properties: {
      MIIA001: {
        name: propertyDetails.title,
        symbol: "LAJU001",
        tokenAddress: await propertyToken1.getAddress(),
        complianceAddress: await compliance1.getAddress(),
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
          copTokenAddress: await colombianCOP.getAddress(),
          copPricePerToken: propertyDetails.saleValue / propertyDetails.totalTokens
        }
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