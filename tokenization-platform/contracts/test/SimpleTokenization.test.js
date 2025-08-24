const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Simple Property Tokenization (Hackathon)", function () {
  let PropertyToken;
  let propertyToken;
  let SimpleCompliance;
  let compliance;
  let TrustedIssuersRegistry;
  let ClaimTopicsRegistry;
  let IdentityRegistry;
  let IdentityRegistryStorage;
  
  let owner;
  let issuer;
  let investor1;
  let investor2;

  const PROPERTY_DETAILS = {
    propertyId: "HACK001",
    propertyAddress: "Calle 63 #11-45, Chapinero, Bogotá",
    cadastralRegistry: "050-0001234",
    totalValue: ethers.parseEther("350"), // 350 ETH representing 350M COP
    totalTokens: 350000,
    isActive: true,
    documentHash: "QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o"
  };

  beforeEach(async function () {
    [owner, issuer, investor1, investor2] = await ethers.getSigners();

    console.log("🏗️  Setting up T-REX infrastructure for hackathon...");

    // Deploy T-REX registries (shared infrastructure)
    const TrustedIssuersRegistryFactory = await ethers.getContractFactory("TrustedIssuersRegistry");
    TrustedIssuersRegistry = await TrustedIssuersRegistryFactory.deploy();
    await TrustedIssuersRegistry.waitForDeployment();

    const ClaimTopicsRegistryFactory = await ethers.getContractFactory("ClaimTopicsRegistry");
    ClaimTopicsRegistry = await ClaimTopicsRegistryFactory.deploy();
    await ClaimTopicsRegistry.waitForDeployment();

    // Deploy identity storage
    const IdentityRegistryStorageFactory = await ethers.getContractFactory("IdentityRegistryStorage");
    const identityStorage = await IdentityRegistryStorageFactory.deploy();
    await identityStorage.waitForDeployment();
    await identityStorage.init();

    // Deploy identity registry
    const IdentityRegistryFactory = await ethers.getContractFactory("IdentityRegistry");
    IdentityRegistry = await IdentityRegistryFactory.deploy();
    await IdentityRegistry.waitForDeployment();
    await IdentityRegistry.init(
      await TrustedIssuersRegistry.getAddress(),
      await ClaimTopicsRegistry.getAddress(),
      await identityStorage.getAddress()
    );
    
    // Set up permissions for identity management
    await IdentityRegistry.addAgent(owner.address);
    await identityStorage.addAgent(await IdentityRegistry.getAddress());
    await identityStorage.addAgent(owner.address);

    // Deploy compliance
    const SimpleComplianceFactory = await ethers.getContractFactory("SimpleCompliance");
    compliance = await SimpleComplianceFactory.deploy();
    await compliance.waitForDeployment();
    await compliance.init();

    // Deploy property token
    const PropertyTokenFactory = await ethers.getContractFactory("PropertyToken");
    propertyToken = await PropertyTokenFactory.deploy();
    await propertyToken.waitForDeployment();

    // Initialize the T-REX token
    await propertyToken.init(
      await IdentityRegistry.getAddress(),
      await compliance.getAddress(),
      "Apartamento Chapinero Premium",
      "CHAP001",
      18,
      owner.address
    );

    // Initialize property details
    await propertyToken.initializeProperty(PROPERTY_DETAILS);

    console.log("✅ T-REX infrastructure deployed successfully");
  });

  describe("Property Token Creation", function () {
    it("Should have correct property details", async function () {
      console.log("\n📄 Checking property details...");
      
      const details = await propertyToken.propertyDetails();
      expect(details.propertyId).to.equal(PROPERTY_DETAILS.propertyId);
      expect(details.totalValue).to.equal(PROPERTY_DETAILS.totalValue);
      expect(details.totalTokens).to.equal(PROPERTY_DETAILS.totalTokens);
      expect(details.isActive).to.be.true;
      
      console.log(`   ✅ Property ID: ${details.propertyId}`);
      console.log(`   ✅ Total Value: ${ethers.formatEther(details.totalValue)} ETH`);
      console.log(`   ✅ Total Tokens: ${details.totalTokens.toString()}`);
    });

    it("Should allow purchasing shares for investors (auto-compliant)", async function () {
      console.log("\n💰 Testing token purchase with auto-compliance...");
      
      // Register investor identity (KYC is auto-compliant)
      await IdentityRegistry.registerIdentity(investor1.address, investor1.address, 91);
      console.log(`   ✅ Identity registered for investor: ${investor1.address}`);
      
      const tokenAmount = 10000;
      
      // Add owner as agent to mint tokens
      await propertyToken.addAgent(owner.address);
      
      // Purchase shares
      await propertyToken.purchaseShares(investor1.address, tokenAmount);
      
      const balance = await propertyToken.balanceOf(investor1.address);
      const shares = await propertyToken.getInvestorShares(investor1.address);
      
      expect(balance).to.equal(tokenAmount);
      expect(shares).to.equal(tokenAmount);
      
      console.log(`   ✅ Tokens purchased: ${balance.toString()}`);
      console.log(`   ✅ Investor shares: ${shares.toString()}`);
      
      // Calculate ownership
      const ownershipPercentage = (Number(tokenAmount) / Number(PROPERTY_DETAILS.totalTokens)) * 100;
      console.log(`   📊 Ownership percentage: ${ownershipPercentage.toFixed(4)}%`);
    });
  });

  describe("Hackathon Demo - Multiple Investors", function () {
    it("Should complete full tokenization workflow with auto-compliance", async function () {
      console.log("\n🚀 === HACKATHON TOKENIZATION DEMO ===");
      
      // Step 1: Setup identities (auto-compliant KYC)
      console.log("1️⃣  Setting up investor identities...");
      await IdentityRegistry.registerIdentity(investor1.address, investor1.address, 91);
      await IdentityRegistry.registerIdentity(investor2.address, investor2.address, 91);
      console.log("   ✅ Identities registered for both investors (auto-compliant)");
      
      // Step 2: Add agent permissions
      await propertyToken.addAgent(owner.address);
      
      // Step 3: Purchase tokens
      console.log("2️⃣  Executing token purchases...");
      const investment1 = 15000;  // 4.29% of property
      const investment2 = 8000;   // 2.29% of property
      
      await propertyToken.purchaseShares(investor1.address, investment1);
      await propertyToken.purchaseShares(investor2.address, investment2);
      
      const balance1 = await propertyToken.balanceOf(investor1.address);
      const balance2 = await propertyToken.balanceOf(investor2.address);
      
      console.log(`   💰 Investor1 tokens: ${balance1.toString()}`);
      console.log(`   💰 Investor2 tokens: ${balance2.toString()}`);
      
      // Step 4: Verify totals
      const totalSupply = await propertyToken.totalSupply();
      const availableTokens = await propertyToken.getAvailableTokens();
      
      console.log("3️⃣  Final summary:");
      console.log(`   🏭 Total supply: ${totalSupply.toString()}`);
      console.log(`   🛍️  Available: ${availableTokens.toString()}`);
      console.log(`   📊 Sold: ${((Number(totalSupply) / Number(PROPERTY_DETAILS.totalTokens)) * 100).toFixed(2)}%`);
      
      expect(totalSupply).to.equal(investment1 + investment2);
      expect(availableTokens).to.equal(PROPERTY_DETAILS.totalTokens - Number(totalSupply));
      
      console.log("🎉 HACKATHON DEMO COMPLETED SUCCESSFULLY!");
    });

    it("Should verify KYC compliance is automatic", async function () {
      console.log("\n✅ Testing automatic KYC compliance...");
      
      // Test that any address is automatically compliant
      const isCompliant1 = await compliance.isKYCVerified(investor1.address);
      const isCompliant2 = await compliance.isKYCVerified(investor2.address);
      const isCompliantRandom = await compliance.isKYCVerified(ethers.Wallet.createRandom().address);
      
      expect(isCompliant1).to.be.true;
      expect(isCompliant2).to.be.true;
      expect(isCompliantRandom).to.be.true;
      
      console.log("   ✅ All addresses are automatically KYC compliant");
      console.log("   ✅ Perfect for hackathon demo - no manual KYC setup needed!");
    });
  });
});