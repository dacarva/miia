const hre = require("hardhat");

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

  const [deployer, investor1, investor2] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)));

  // Get existing contracts
  console.log("\n🔗 Connecting to existing infrastructure...");
  const identityRegistry = await hre.ethers.getContractAt("IdentityRegistry", deploymentInfo.contracts.IdentityRegistry);
  console.log("   ✅ Connected to existing T-REX infrastructure");

  // Step 1: Deploy Compliance for Property 3
  console.log("\n📋 Step 1: Deploying Compliance for Property 3...");
  const SimpleComplianceFactory = await hre.ethers.getContractFactory("SimpleCompliance");
  const compliance3 = await SimpleComplianceFactory.deploy();
  await compliance3.waitForDeployment();
  await compliance3.init();
  console.log("   ✅ SimpleCompliance for Property 3:", await compliance3.getAddress());

  // Step 2: Deploy Property Token 3 directly
  console.log("\n🏠 Step 2: Deploying Property 3 Token - El Poblado Office...");
  
  const PropertyTokenFactory = await hre.ethers.getContractFactory("PropertyToken");
  const propertyToken3 = await PropertyTokenFactory.deploy();
  await propertyToken3.waitForDeployment();
  console.log("   ✅ PropertyToken deployed at:", await propertyToken3.getAddress());

  // Initialize the T-REX token
  await propertyToken3.init(
    await identityRegistry.getAddress(),
    await compliance3.getAddress(),
    "Oficina El Poblado Medellín",
    "POB003",
    18,
    deployer.address
  );
  console.log("   ✅ PropertyToken initialized");

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

  await propertyToken3.initializeProperty(propertyDetails);
  console.log("   ✅ Property details initialized");

  // Step 3: Demo purchases for Property 3
  console.log("\n👤 Step 3: Setting Up Purchases for Property 3...");
  
  // Set up KYC for this property's compliance
  await compliance3.updateKYC(investor1.address, true);
  await compliance3.updateKYC(investor2.address, true);
  console.log("   ✅ KYC verified for Property 3");
  
  // Add deployer as agent to this property token  
  await propertyToken3.addAgent(deployer.address);
  
  // Execute purchases - different amounts for variety
  const purchase1 = 7000; // 2% of 350k tokens
  const purchase2 = 10500; // 3% of 350k tokens
  
  await propertyToken3.purchaseShares(investor1.address, purchase1);
  await propertyToken3.purchaseShares(investor2.address, purchase2);
  
  console.log(`   💰 Investor 1 purchased: ${purchase1} tokens (2%)`);
  console.log(`   💰 Investor 2 purchased: ${purchase2} tokens (3%)`);

  // Step 4: Summary for Property 3
  const totalSupply = await propertyToken3.totalSupply();
  const availableTokens = await propertyToken3.getAvailableTokens();
  const investor1Balance = await propertyToken3.balanceOf(investor1.address);
  const investor2Balance = await propertyToken3.balanceOf(investor2.address);
  
  console.log("\n🎯 === PROPERTY 3 DEPLOYED ===");
  console.log("📊 Property Summary:");
  console.log(`   Property: Oficina El Poblado Medellín (MIIA003)`);
  console.log(`   Token Address: ${await propertyToken3.getAddress()}`);
  console.log(`   Total Supply: ${totalSupply.toString()} tokens`);
  console.log(`   Available: ${availableTokens.toString()} tokens`);
  console.log(`   Sold: ${((Number(totalSupply) / Number(propertyDetails.totalTokens)) * 100).toFixed(2)}%`);
  console.log("");
  console.log("👥 Investor Balances:");
  console.log(`   Investor 1: ${investor1Balance.toString()} tokens (${((Number(investor1Balance) / Number(propertyDetails.totalTokens)) * 100).toFixed(4)}%)`);
  console.log(`   Investor 2: ${investor2Balance.toString()} tokens (${((Number(investor2Balance) / Number(propertyDetails.totalTokens)) * 100).toFixed(4)}%)`);

  // Update deployment info
  deploymentInfo.timestamp = new Date().toISOString();
  deploymentInfo.properties.MIIA003 = {
    name: "Oficina El Poblado Medellín",
    symbol: "POB003",
    tokenAddress: await propertyToken3.getAddress(),
    complianceAddress: await compliance3.getAddress(),
    totalValue: hre.ethers.formatEther(propertyDetails.totalValue) + " ETH",
    totalTokens: Number(propertyDetails.totalTokens),
    soldTokens: Number(totalSupply),
    availableTokens: Number(availableTokens)
  };

  fs.writeFileSync(fileName, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Updated deployment state in: ${fileName}`);

  // Step 5: Complete Portfolio Summary
  console.log("\n🎯 === COMPLETE PORTFOLIO DEPLOYED ===");
  console.log("📊 All 3 Properties Summary:");
  
  let totalPortfolioValue = 0n;
  let totalInvestor1Tokens = 0;
  let totalInvestor2Tokens = 0;
  let totalAllTokens = 0;
  
  for (const [propertyId, propInfo] of Object.entries(deploymentInfo.properties)) {
    const propToken = await hre.ethers.getContractAt("PropertyToken", propInfo.tokenAddress);
    const inv1Bal = await propToken.balanceOf(investor1.address);
    const inv2Bal = await propToken.balanceOf(investor2.address);
    
    totalInvestor1Tokens += Number(inv1Bal);
    totalInvestor2Tokens += Number(inv2Bal);
    totalAllTokens += propInfo.totalTokens;
    
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
  
  console.log("\n👥 Investor Portfolio Summary:");
  console.log(`   Investor 1 (${deploymentInfo.investors.investor1}):`);
  console.log(`   - Total tokens across all properties: ${totalInvestor1Tokens}`);
  console.log(`   - Portfolio ownership: ${((totalInvestor1Tokens / totalAllTokens) * 100).toFixed(4)}%`);
  
  console.log(`   Investor 2 (${deploymentInfo.investors.investor2}):`);
  console.log(`   - Total tokens across all properties: ${totalInvestor2Tokens}`);
  console.log(`   - Portfolio ownership: ${((totalInvestor2Tokens / totalAllTokens) * 100).toFixed(4)}%`);

  console.log("\n🚀 ALL 3 PROPERTIES DEPLOYED AND READY FOR HACKATHON DEMO!");
  
  // Final deployment info update
  deploymentInfo.summary = {
    totalPortfolioValue: hre.ethers.formatEther(totalPortfolioValue) + " ETH",
    totalProperties: Object.keys(deploymentInfo.properties).length,
    totalInvestorTokens: {
      investor1: totalInvestor1Tokens,
      investor2: totalInvestor2Tokens
    }
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