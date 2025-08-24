const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying MIIA Property 1 (Simple Version)...\n");

  const [deployer, investor1, investor2] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)));

  // Step 1: Deploy T-REX Infrastructure
  console.log("\n📋 Step 1: Deploying T-REX Infrastructure...");
  
  const TrustedIssuersRegistry = await hre.ethers.getContractFactory("TrustedIssuersRegistry");
  const trustedIssuersRegistry = await TrustedIssuersRegistry.deploy();
  await trustedIssuersRegistry.waitForDeployment();
  console.log("   ✅ TrustedIssuersRegistry:", await trustedIssuersRegistry.getAddress());

  const ClaimTopicsRegistry = await hre.ethers.getContractFactory("ClaimTopicsRegistry");
  const claimTopicsRegistry = await ClaimTopicsRegistry.deploy();
  await claimTopicsRegistry.waitForDeployment();
  console.log("   ✅ ClaimTopicsRegistry:", await claimTopicsRegistry.getAddress());

  const IdentityRegistryStorageFactory = await hre.ethers.getContractFactory("IdentityRegistryStorage");
  const identityStorage = await IdentityRegistryStorageFactory.deploy();
  await identityStorage.waitForDeployment();
  await identityStorage.init();
  console.log("   ✅ IdentityRegistryStorage:", await identityStorage.getAddress());

  const IdentityRegistryFactory = await hre.ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = await IdentityRegistryFactory.deploy();
  await identityRegistry.waitForDeployment();
  await identityRegistry.init(
    await trustedIssuersRegistry.getAddress(),
    await claimTopicsRegistry.getAddress(),
    await identityStorage.getAddress()
  );
  console.log("   ✅ IdentityRegistry:", await identityRegistry.getAddress());

  // Set up permissions
  await identityRegistry.addAgent(deployer.address);
  await identityStorage.addAgent(await identityRegistry.getAddress());
  await identityStorage.addAgent(deployer.address);

  // Step 2: Deploy Compliance for Property 1
  console.log("\n📋 Step 2: Deploying Compliance for Property 1...");
  const SimpleComplianceFactory = await hre.ethers.getContractFactory("SimpleCompliance");
  const compliance1 = await SimpleComplianceFactory.deploy();
  await compliance1.waitForDeployment();
  await compliance1.init();
  console.log("   ✅ SimpleCompliance for Property 1:", await compliance1.getAddress());

  // Step 3: Deploy Property Token 1 directly
  console.log("\n🏠 Step 3: Deploying Property 1 Token - Chapinero Apartment...");
  
  const PropertyTokenFactory = await hre.ethers.getContractFactory("PropertyToken");
  const propertyToken1 = await PropertyTokenFactory.deploy();
  await propertyToken1.waitForDeployment();
  console.log("   ✅ PropertyToken deployed at:", await propertyToken1.getAddress());

  // Initialize the T-REX token
  await propertyToken1.init(
    await identityRegistry.getAddress(),
    await compliance1.getAddress(),
    "Apartamento Chapinero Premium",
    "CHAP001",
    18,
    deployer.address
  );
  console.log("   ✅ PropertyToken initialized");

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

  await propertyToken1.initializeProperty(propertyDetails);
  console.log("   ✅ Property details initialized");

  // Step 4: Demo the Agent Flow
  console.log("\n👤 Step 4: Setting Up Investors and Demo Purchases...");
  
  // Set up KYC for investors
  await compliance1.updateKYC(investor1.address, true);
  await compliance1.updateKYC(investor2.address, true);
  console.log("   ✅ KYC verified for both investors");
  
  // Register identities
  await identityRegistry.registerIdentity(investor1.address, investor1.address, 91);
  await identityRegistry.registerIdentity(investor2.address, investor2.address, 91);
  console.log("   ✅ Identities registered");
  
  // Add deployer as agent to property token  
  await propertyToken1.addAgent(deployer.address);
  
  // Execute purchases as agent
  const purchase1 = 10000; // 2% of tokens
  const purchase2 = 15000; // 3% of tokens
  
  await propertyToken1.purchaseShares(investor1.address, purchase1);
  await propertyToken1.purchaseShares(investor2.address, purchase2);
  
  console.log(`   💰 Investor 1 purchased: ${purchase1} tokens (2%)`);
  console.log(`   💰 Investor 2 purchased: ${purchase2} tokens (3%)`);

  // Step 5: Summary
  const totalSupply = await propertyToken1.totalSupply();
  const availableTokens = await propertyToken1.getAvailableTokens();
  const investor1Balance = await propertyToken1.balanceOf(investor1.address);
  const investor2Balance = await propertyToken1.balanceOf(investor2.address);
  
  console.log("\n🎯 === PROPERTY 1 DEPLOYED ===");
  console.log("📊 Property Summary:");
  console.log(`   Property: Apartamento Chapinero Premium (MIIA001)`);
  console.log(`   Token Address: ${await propertyToken1.getAddress()}`);
  console.log(`   Total Supply: ${totalSupply.toString()} tokens`);
  console.log(`   Available: ${availableTokens.toString()} tokens`);
  console.log(`   Sold: ${((Number(totalSupply) / Number(propertyDetails.totalTokens)) * 100).toFixed(2)}%`);
  console.log("");
  console.log("👥 Investor Balances:");
  console.log(`   Investor 1: ${investor1Balance.toString()} tokens (${((Number(investor1Balance) / Number(propertyDetails.totalTokens)) * 100).toFixed(4)}%)`);
  console.log(`   Investor 2: ${investor2Balance.toString()} tokens (${((Number(investor2Balance) / Number(propertyDetails.totalTokens)) * 100).toFixed(4)}%)`);

  // Save deployment info for next scripts
  const network = await hre.ethers.provider.getNetwork();
  const deploymentInfo = {
    network: hre.network.name,
    chainId: Number(network.chainId),
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    investors: {
      investor1: investor1.address,
      investor2: investor2.address
    },
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
        soldTokens: Number(totalSupply),
        availableTokens: Number(availableTokens)
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