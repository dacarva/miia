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

  // Real property data from sampleProperties.json (18544-M5526040)
  const PROPERTY_DETAILS = {
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
    saleValue: 240000000,                     // 240M COP
    totalValue: ethers.parseEther("240"),     // 240 ETH = 240M COP
    totalTokens: 240000,                      // 240K tokens
    
    // Tokenization status
    isActive: true,
    tokenizationDate: 0  // Will be set by the contract
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
      "Apartaestudio La Julita Premium",
      "LAJU001",
      18,
      owner.address
    );

    // Initialize property details
    await propertyToken.initializeProperty(PROPERTY_DETAILS);

    // Add owner as agent for token operations
    await propertyToken.addAgent(owner.address);

    console.log("✅ T-REX infrastructure deployed successfully");
  });

  describe("Property Token Creation", function () {
    it("Should have correct property details", async function () {
      console.log("\n📄 Checking property details...");
      
      const details = await propertyToken.propertyDetails();
      expect(details.propertyId).to.equal(PROPERTY_DETAILS.propertyId);
      expect(details.title).to.equal(PROPERTY_DETAILS.title);
      expect(details.neighborhood).to.equal(PROPERTY_DETAILS.neighborhood);
      expect(details.cityName).to.equal(PROPERTY_DETAILS.cityName);
      expect(details.propertyType).to.equal(PROPERTY_DETAILS.propertyType);
      expect(details.area).to.equal(PROPERTY_DETAILS.area);
      expect(details.saleValue).to.equal(PROPERTY_DETAILS.saleValue);
      expect(details.totalValue).to.equal(PROPERTY_DETAILS.totalValue);
      expect(details.totalTokens).to.equal(PROPERTY_DETAILS.totalTokens);
      expect(details.isActive).to.be.true;
      
      console.log(`   ✅ Property ID: ${details.propertyId}`);
      console.log(`   ✅ Title: ${details.title}`);
      console.log(`   ✅ Location: ${details.neighborhood}, ${details.cityName}`);
      console.log(`   ✅ Type: ${details.propertyType}`);
      console.log(`   ✅ Area: ${details.area}m²`);
      console.log(`   ✅ Sale Value: ${(Number(details.saleValue) / 1000000).toFixed(0)}M COP`);
      console.log(`   ✅ Total Value: ${ethers.formatEther(details.totalValue)} ETH`);
      console.log(`   ✅ Total Tokens: ${details.totalTokens.toString()}`);
    });

    it("Should return property details via getPropertyDetails function", async function () {
      console.log("\n📋 Testing getPropertyDetails function...");
      
      const [
        propertyId,
        title,
        neighborhood,
        cityName,
        propertyType,
        area,
        saleValue,
        totalValue,
        totalTokens,
        isActive
      ] = await propertyToken.getPropertyDetails();
      
      expect(propertyId).to.equal(PROPERTY_DETAILS.propertyId);
      expect(title).to.equal(PROPERTY_DETAILS.title);
      expect(neighborhood).to.equal(PROPERTY_DETAILS.neighborhood);
      expect(cityName).to.equal(PROPERTY_DETAILS.cityName);
      expect(propertyType).to.equal(PROPERTY_DETAILS.propertyType);
      expect(area).to.equal(PROPERTY_DETAILS.area);
      expect(saleValue).to.equal(PROPERTY_DETAILS.saleValue);
      expect(totalValue).to.equal(PROPERTY_DETAILS.totalValue);
      expect(totalTokens).to.equal(PROPERTY_DETAILS.totalTokens);
      expect(isActive).to.be.true;
      
      console.log("   ✅ getPropertyDetails function returns correct data");
    });

    it("Should calculate correct token price", async function () {
      console.log("\n💰 Testing token price calculation...");
      
      const tokenPrice = await propertyToken.getTokenPrice();
      const expectedPrice = PROPERTY_DETAILS.totalValue / BigInt(PROPERTY_DETAILS.totalTokens);
      
      expect(tokenPrice).to.equal(expectedPrice);
      
      console.log(`   ✅ Token Price: ${ethers.formatEther(tokenPrice)} ETH per token`);
      console.log(`   ✅ Expected Price: ${ethers.formatEther(expectedPrice)} ETH per token`);
    });

    it("Should allow purchasing shares for investors (auto-compliant)", async function () {
      console.log("\n💰 Testing token purchase with auto-compliance...");
      
      // Register investor identity (KYC is auto-compliant)
      await IdentityRegistry.registerIdentity(investor1.address, investor1.address, 91);
      console.log(`   ✅ Identity registered for investor: ${investor1.address}`);
      
      const tokenAmount = 10000;
      
      // Deploy Colombian COP token for this test
      const ColombianCOPFactory = await ethers.getContractFactory("ColombianCOP");
      const colombianCOP = await ColombianCOPFactory.deploy();
      await colombianCOP.waitForDeployment();
      
      // Set Colombian COP token in property token
      await propertyToken.setColombianCOP(await colombianCOP.getAddress());
      
      // Mint COP tokens to investor
      await colombianCOP.mint(investor1.address, ethers.parseEther("10000000")); // 10M COP
      
      // Calculate required COP amount
      const requiredCOPWei = await propertyToken.getRequiredCOPAmount(tokenAmount);
      
      // Approve and purchase
      await colombianCOP.connect(investor1).approve(await propertyToken.getAddress(), requiredCOPWei);
      await propertyToken.connect(investor1).buyShares(tokenAmount, requiredCOPWei);
      
      const balance = await propertyToken.balanceOf(investor1.address);
      const ownershipPercentage = await propertyToken.getInvestorOwnershipPercentage(investor1.address);
      
      expect(balance).to.equal(tokenAmount);
      
      console.log(`   ✅ Tokens purchased: ${balance.toString()}`);
      console.log(`   ✅ Ownership percentage: ${(Number(ownershipPercentage) / 100).toFixed(4)}%`);
      
      // Calculate expected ownership percentage (in basis points)
      const expectedPercentage = Math.floor((tokenAmount * 10000) / Number(PROPERTY_DETAILS.totalTokens));
      expect(ownershipPercentage).to.equal(expectedPercentage);
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
      
      // Step 2: Purchase tokens
      console.log("2️⃣  Executing token purchases...");
      const investment1 = 15000;  // 6.25% of property
      const investment2 = 8000;   // 3.33% of property
      
      // Deploy Colombian COP token for this test
      const ColombianCOPFactory = await ethers.getContractFactory("ColombianCOP");
      const colombianCOP = await ColombianCOPFactory.deploy();
      await colombianCOP.waitForDeployment();
      
      // Set Colombian COP token in property token
      await propertyToken.setColombianCOP(await colombianCOP.getAddress());
      
      // Mint COP tokens to investors
      await colombianCOP.mint(investor1.address, ethers.parseEther("20000000")); // 20M COP
      await colombianCOP.mint(investor2.address, ethers.parseEther("15000000")); // 15M COP
      
      // Calculate required COP amounts
      const requiredCOP1 = await propertyToken.getRequiredCOPAmount(investment1);
      const requiredCOP2 = await propertyToken.getRequiredCOPAmount(investment2);
      
      // Approve and purchase
      await colombianCOP.connect(investor1).approve(await propertyToken.getAddress(), requiredCOP1);
      await colombianCOP.connect(investor2).approve(await propertyToken.getAddress(), requiredCOP2);
      
      await propertyToken.connect(investor1).buyShares(investment1, requiredCOP1);
      await propertyToken.connect(investor2).buyShares(investment2, requiredCOP2);
      
      const balance1 = await propertyToken.balanceOf(investor1.address);
      const balance2 = await propertyToken.balanceOf(investor2.address);
      const ownership1 = await propertyToken.getInvestorOwnershipPercentage(investor1.address);
      const ownership2 = await propertyToken.getInvestorOwnershipPercentage(investor2.address);
      
      console.log(`   💰 Investor1 tokens: ${balance1.toString()} (${(Number(ownership1) / 100).toFixed(4)}%)`);
      console.log(`   💰 Investor2 tokens: ${balance2.toString()} (${(Number(ownership2) / 100).toFixed(4)}%)`);
      
      // Step 3: Verify totals
      const totalSupply = await propertyToken.totalSupply();
      const availableTokens = Number(PROPERTY_DETAILS.totalTokens) - Number(totalSupply);
      
      console.log("3️⃣  Final summary:");
      console.log(`   🏭 Total supply: ${totalSupply.toString()}`);
      console.log(`   🛍️  Available: ${availableTokens.toString()}`);
      console.log(`   📊 Sold: ${((Number(totalSupply) / Number(PROPERTY_DETAILS.totalTokens)) * 100).toFixed(2)}%`);
      
      expect(totalSupply).to.equal(investment1 + investment2);
      expect(availableTokens).to.equal(Number(PROPERTY_DETAILS.totalTokens) - Number(totalSupply));
      
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

    it("Should handle property status updates", async function () {
      console.log("\n🔄 Testing property status updates...");
      
      // Initially should be active
      const initialDetails = await propertyToken.propertyDetails();
      expect(initialDetails.isActive).to.be.true;
      
      // Deactivate property
      await propertyToken.updatePropertyStatus(false);
      const deactivatedDetails = await propertyToken.propertyDetails();
      expect(deactivatedDetails.isActive).to.be.false;
      
      // Reactivate property
      await propertyToken.updatePropertyStatus(true);
      const reactivatedDetails = await propertyToken.propertyDetails();
      expect(reactivatedDetails.isActive).to.be.true;
      
      console.log("   ✅ Property status can be updated successfully");
    });

    it("Should handle property details updates", async function () {
      console.log("\n📝 Testing property details updates...");
      
      const newTitle = "Apartaestudio La Julita - Renovado";
      const newSaleValue = 280000000; // 280M COP
      
      await propertyToken.updatePropertyDetails(
        newTitle,
        newSaleValue
      );
      
      const [
        propertyId,
        title,
        neighborhood,
        cityName,
        propertyType,
        area,
        saleValue,
        totalValue,
        totalTokens,
        isActive
      ] = await propertyToken.getPropertyDetails();
      
      expect(title).to.equal(newTitle);
      expect(saleValue).to.equal(newSaleValue);
      
      // Other fields should remain unchanged
      expect(propertyId).to.equal(PROPERTY_DETAILS.propertyId);
      expect(neighborhood).to.equal(PROPERTY_DETAILS.neighborhood);
      expect(cityName).to.equal(PROPERTY_DETAILS.cityName);
      expect(propertyType).to.equal(PROPERTY_DETAILS.propertyType);
      expect(area).to.equal(PROPERTY_DETAILS.area);
      expect(totalValue).to.equal(PROPERTY_DETAILS.totalValue);
      expect(totalTokens).to.equal(PROPERTY_DETAILS.totalTokens);
      expect(isActive).to.be.true;
      
      console.log("   ✅ Property details updated successfully");
      console.log(`   ✅ New title: ${title}`);
      console.log(`   ✅ New sale value: ${(Number(saleValue) / 1000000).toFixed(0)}M COP`);
    });
  });

  describe("Colombian COP Integration", function () {
    let colombianCOP;

    beforeEach(async function () {
      // Deploy Colombian COP token
      const ColombianCOPFactory = await ethers.getContractFactory("ColombianCOP");
      colombianCOP = await ColombianCOPFactory.deploy();
      await colombianCOP.waitForDeployment();

      // Set Colombian COP token in property token
      await propertyToken.setColombianCOP(await colombianCOP.getAddress());

      // Mint some COP tokens to investors for testing
      await colombianCOP.mint(investor1.address, ethers.parseEther("1000000")); // 1M COP
      await colombianCOP.mint(investor2.address, ethers.parseEther("2000000")); // 2M COP
    });

    it("Should set Colombian COP token correctly", async function () {
      console.log("\n🇨🇴 Testing Colombian COP token setup...");
      
      const copAddress = await propertyToken.colombianCOP();
      expect(copAddress).to.equal(await colombianCOP.getAddress());
      
      console.log("   ✅ Colombian COP token set successfully");
      console.log(`   ✅ COP Token Address: ${copAddress}`);
    });

    it("Should calculate required COP amount correctly", async function () {
      console.log("\n💰 Testing COP amount calculations...");
      
      const tokenAmount = 1000; // 1000 property tokens
      const requiredCOPWei = await propertyToken.getRequiredCOPAmount(tokenAmount);
      const requiredCOPUnits = await propertyToken.getRequiredCOPAmountInCOP(tokenAmount);
      
      // Calculate expected amount: (saleValue * tokenAmount) / totalTokens
      const expectedCOPWei = (BigInt(PROPERTY_DETAILS.saleValue) * BigInt(tokenAmount)) / BigInt(PROPERTY_DETAILS.totalTokens);
      const expectedCOPUnits = Math.floor(Number(expectedCOPWei) / 1e12);
      
      expect(requiredCOPWei).to.equal(expectedCOPWei);
      expect(requiredCOPUnits).to.equal(expectedCOPUnits);
      
      console.log(`   ✅ Required COP (wei): ${requiredCOPWei.toString()}`);
      console.log(`   ✅ Required COP (units): ${requiredCOPUnits}`);
      console.log(`   ✅ Expected COP (wei): ${expectedCOPWei.toString()}`);
      console.log(`   ✅ Expected COP (units): ${expectedCOPUnits}`);
    });

    it("Should purchase shares with Colombian COP tokens", async function () {
      console.log("\n🛒 Testing COP-based share purchase...");
      
      const tokenAmount = 1000; // 1000 property tokens
      const requiredCOPWei = await propertyToken.getRequiredCOPAmount(tokenAmount);
      
      // Get initial balances
      const initialPropertyBalance = await propertyToken.balanceOf(investor1.address);
      const initialCOPBalance = await colombianCOP.balanceOf(investor1.address);
      const initialContractCOPBalance = await colombianCOP.balanceOf(await propertyToken.getAddress());
      
      console.log(`   📊 Initial balances:`);
      console.log(`      Property tokens: ${initialPropertyBalance.toString()}`);
      console.log(`      COP balance: ${ethers.formatEther(initialCOPBalance)} COP`);
      console.log(`      Contract COP: ${ethers.formatEther(initialContractCOPBalance)} COP`);
      
      // Approve COP tokens for property contract
      await colombianCOP.connect(investor1).approve(await propertyToken.getAddress(), requiredCOPWei);
      
      // Purchase shares with COP
      await propertyToken.connect(investor1).buyShares(tokenAmount, requiredCOPWei);
      
      // Get final balances
      const finalPropertyBalance = await propertyToken.balanceOf(investor1.address);
      const finalCOPBalance = await colombianCOP.balanceOf(investor1.address);
      const finalContractCOPBalance = await colombianCOP.balanceOf(await propertyToken.getAddress());
      
      console.log(`   📊 Final balances:`);
      console.log(`      Property tokens: ${finalPropertyBalance.toString()}`);
      console.log(`      COP balance: ${ethers.formatEther(finalCOPBalance)} COP`);
      console.log(`      Contract COP: ${ethers.formatEther(finalContractCOPBalance)} COP`);
      
      // Verify balances
      expect(finalPropertyBalance).to.equal(initialPropertyBalance + BigInt(tokenAmount));
      expect(finalCOPBalance).to.equal(initialCOPBalance - requiredCOPWei);
      expect(finalContractCOPBalance).to.equal(initialContractCOPBalance + requiredCOPWei);
      
      // Verify ownership percentage
      const ownershipPercentage = await propertyToken.getInvestorOwnershipPercentage(investor1.address);
      const expectedPercentage = Math.floor((Number(tokenAmount) / Number(PROPERTY_DETAILS.totalTokens)) * 10000);
      expect(ownershipPercentage).to.equal(expectedPercentage);
      
      console.log(`   ✅ Share purchase successful!`);
      console.log(`   ✅ Ownership percentage: ${Number(ownershipPercentage) / 100}%`);
    });

    it("Should reject insufficient COP payment", async function () {
      console.log("\n❌ Testing insufficient COP payment...");
      
      const tokenAmount = 1000;
      const requiredCOPWei = await propertyToken.getRequiredCOPAmount(tokenAmount);
      const insufficientCOPWei = requiredCOPWei - BigInt(1000000); // 1M COP less
      
      // Approve COP tokens
      await colombianCOP.connect(investor1).approve(await propertyToken.getAddress(), requiredCOPWei);
      
      // Try to purchase with insufficient COP
      await expect(
        propertyToken.connect(investor1).buyShares(tokenAmount, insufficientCOPWei)
      ).to.be.revertedWith("Insufficient COP payment");
      
      console.log("   ✅ Insufficient payment correctly rejected");
    });

    it("Should reject purchase when COP token not set", async function () {
      console.log("\n❌ Testing purchase without COP token...");
      
      // Deploy a new compliance for the new token
      const SimpleComplianceFactory = await ethers.getContractFactory("SimpleCompliance");
      const newCompliance = await SimpleComplianceFactory.deploy();
      await newCompliance.waitForDeployment();
      await newCompliance.init();
      
      // Deploy a new property token without setting COP token
      const PropertyTokenFactory = await ethers.getContractFactory("PropertyToken");
      const newPropertyToken = await PropertyTokenFactory.deploy();
      await newPropertyToken.waitForDeployment();
      
      // Initialize with new compliance
      await newPropertyToken.init(
        await IdentityRegistry.getAddress(),
        await newCompliance.getAddress(),
        "Test Property",
        "TEST",
        18,
        owner.address
      );
      
      await newPropertyToken.initializeProperty(PROPERTY_DETAILS);
      await newPropertyToken.addAgent(owner.address);
      
      // Try to purchase without setting COP token
      await expect(
        newPropertyToken.connect(investor1).buyShares(1000, ethers.parseEther("1000000"))
      ).to.be.revertedWith("Colombian COP token not set");
      
      console.log("   ✅ Purchase correctly rejected when COP token not set");
    });
  });
});