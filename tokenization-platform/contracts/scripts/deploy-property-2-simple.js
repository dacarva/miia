const hre = require("hardhat");

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

  const [deployer, investor1, investor2] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)));

  // Get existing contracts
  console.log("\n🔗 Connecting to existing infrastructure...");
  const identityRegistry = await hre.ethers.getContractAt("IdentityRegistry", deploymentInfo.contracts.IdentityRegistry);
  console.log("   ✅ Connected to existing T-REX infrastructure");

  // Step 1: Deploy Compliance for Property 2
  console.log("\n📋 Step 1: Deploying Compliance for Property 2...");
  const SimpleComplianceFactory = await hre.ethers.getContractFactory("SimpleCompliance");
  const compliance2 = await SimpleComplianceFactory.deploy();
  await compliance2.waitForDeployment();
  await compliance2.init();
  console.log("   ✅ SimpleCompliance for Property 2:", await compliance2.getAddress());

  // Step 2: Deploy Property Token 2 directly
  console.log("\n🏠 Step 2: Deploying Property 2 Token - Zona Rosa House...");
  
  const PropertyTokenFactory = await hre.ethers.getContractFactory("PropertyToken");
  const propertyToken2 = await PropertyTokenFactory.deploy();
  await propertyToken2.waitForDeployment();
  console.log("   ✅ PropertyToken deployed at:", await propertyToken2.getAddress());

  // Initialize the T-REX token
  await propertyToken2.init(
    await identityRegistry.getAddress(),
    await compliance2.getAddress(),
    "Casa Zona Rosa Bogotá",
    "ROSA002",
    18,
    deployer.address
  );
  console.log("   ✅ PropertyToken initialized");

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

  await propertyToken2.initializeProperty(propertyDetails);
  console.log("   ✅ Property details initialized");

  // Step 3: Demo purchases for Property 2
  console.log("\n👤 Step 3: Setting Up Purchases for Property 2...");
  
  // Set up KYC for this property's compliance (each property has its own compliance)
  await compliance2.updateKYC(investor1.address, true);
  await compliance2.updateKYC(investor2.address, true);
  console.log("   ✅ KYC verified for Property 2");
  
  // Note: Identities are already registered in the shared identity registry from Property 1
  console.log("   ✅ Using existing identity registrations");
  
  // Add deployer as agent to this property token  
  await propertyToken2.addAgent(deployer.address);
  
  // Execute purchases - different amounts for variety
  const purchase1 = 16000; // 2% of 800k tokens
  const purchase2 = 24000; // 3% of 800k tokens
  
  await propertyToken2.purchaseShares(investor1.address, purchase1);
  await propertyToken2.purchaseShares(investor2.address, purchase2);
  
  console.log(`   💰 Investor 1 purchased: ${purchase1} tokens (2%)`);
  console.log(`   💰 Investor 2 purchased: ${purchase2} tokens (3%)`);

  // Step 4: Summary
  const totalSupply = await propertyToken2.totalSupply();
  const availableTokens = await propertyToken2.getAvailableTokens();
  const investor1Balance = await propertyToken2.balanceOf(investor1.address);
  const investor2Balance = await propertyToken2.balanceOf(investor2.address);
  
  console.log("\n🎯 === PROPERTY 2 DEPLOYED ===");
  console.log("📊 Property Summary:");
  console.log(`   Property: Casa Zona Rosa Bogotá (MIIA002)`);
  console.log(`   Token Address: ${await propertyToken2.getAddress()}`);
  console.log(`   Total Supply: ${totalSupply.toString()} tokens`);
  console.log(`   Available: ${availableTokens.toString()} tokens`);
  console.log(`   Sold: ${((Number(totalSupply) / Number(propertyDetails.totalTokens)) * 100).toFixed(2)}%`);
  console.log("");
  console.log("👥 Investor Balances:");
  console.log(`   Investor 1: ${investor1Balance.toString()} tokens (${((Number(investor1Balance) / Number(propertyDetails.totalTokens)) * 100).toFixed(4)}%)`);
  console.log(`   Investor 2: ${investor2Balance.toString()} tokens (${((Number(investor2Balance) / Number(propertyDetails.totalTokens)) * 100).toFixed(4)}%)`);

  // Update deployment info
  deploymentInfo.timestamp = new Date().toISOString();
  deploymentInfo.properties.MIIA002 = {
    name: "Casa Zona Rosa Bogotá",
    symbol: "ROSA002",
    tokenAddress: await propertyToken2.getAddress(),
    complianceAddress: await compliance2.getAddress(),
    totalValue: hre.ethers.formatEther(propertyDetails.totalValue) + " ETH",
    totalTokens: Number(propertyDetails.totalTokens),
    soldTokens: Number(totalSupply),
    availableTokens: Number(availableTokens)
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