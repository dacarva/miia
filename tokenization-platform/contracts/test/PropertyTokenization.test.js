const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Colombian Property Tokenization Platform", function () {
  let PropertyTokenFactory;
  let factory;
  let PropertyToken;
  let ColombianCompliance;
  let TrustedIssuersRegistry;
  let ClaimTopicsRegistry;
  let FractionalPurchase;
  let PortfolioTracker;
  
  let owner;
  let issuer;
  let investor1;
  let investor2;
  let addrs;

  const PROPERTY_DETAILS = {
    propertyId: "PROP001",
    propertyAddress: "Calle 63 #11-45, Chapinero, Bogotá",
    cadastralRegistry: "050-0001234",
    totalValue: ethers.parseEther("350"), // 350 ETH representing 350M COP
    totalTokens: 350000,
    isActive: true,
    documentHash: "QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o"
  };

  beforeEach(async function () {
    [owner, issuer, investor1, investor2, ...addrs] = await ethers.getSigners();

    // Deploy T-REX infrastructure
    const TrustedIssuersRegistryFactory = await ethers.getContractFactory("TrustedIssuersRegistry");
    TrustedIssuersRegistry = await TrustedIssuersRegistryFactory.deploy();
    await TrustedIssuersRegistry.waitForDeployment();

    const ClaimTopicsRegistryFactory = await ethers.getContractFactory("ClaimTopicsRegistry");
    ClaimTopicsRegistry = await ClaimTopicsRegistryFactory.deploy();
    await ClaimTopicsRegistry.waitForDeployment();

    // Deploy PropertyTokenFactory
    PropertyTokenFactory = await ethers.getContractFactory("PropertyTokenFactory");
    factory = await PropertyTokenFactory.deploy(
      await TrustedIssuersRegistry.getAddress(),
      await ClaimTopicsRegistry.getAddress()
    );
    await factory.waitForDeployment();

    // Deploy FractionalPurchase
    const FractionalPurchaseFactory = await ethers.getContractFactory("FractionalPurchase");
    FractionalPurchase = await FractionalPurchaseFactory.deploy(
      await factory.getAddress(),
      owner.address // Fee recipient
    );
    await FractionalPurchase.waitForDeployment();

    // Deploy PortfolioTracker
    const PortfolioTrackerFactory = await ethers.getContractFactory("PortfolioTracker");
    PortfolioTracker = await PortfolioTrackerFactory.deploy(
      await factory.getAddress()
    );
    await PortfolioTracker.waitForDeployment();
  });

  describe("Property Token Creation", function () {
    it("Should create a property token successfully", async function () {
      const tx = await factory.connect(issuer).createPropertyToken(
        PROPERTY_DETAILS.propertyId,
        "Apartamento Chapinero Token",
        "CHAPI001",
        PROPERTY_DETAILS,
        issuer.address // onchainID
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed && parsed.name === 'PropertyTokenCreated';
        } catch (e) {
          return false;
        }
      });

      expect(event).to.not.be.undefined;
      
      const deployment = await factory.getTokenDeployment(PROPERTY_DETAILS.propertyId);
      expect(deployment.tokenAddress).to.not.equal(ethers.ZeroAddress);
      expect(deployment.isActive).to.be.true;
      expect(deployment.propertyId).to.equal(PROPERTY_DETAILS.propertyId);
    });

    it("Should prevent duplicate property IDs", async function () {
      // Create first token
      await factory.connect(issuer).createPropertyToken(
        PROPERTY_DETAILS.propertyId,
        "Apartamento Chapinero Token",
        "CHAPI001",
        PROPERTY_DETAILS,
        issuer.address
      );

      // Try to create duplicate
      await expect(
        factory.connect(issuer).createPropertyToken(
          PROPERTY_DETAILS.propertyId,
          "Another Token",
          "CHAPI002",
          PROPERTY_DETAILS,
          issuer.address
        )
      ).to.be.revertedWith("Token already exists for this property");
    });
  });

  describe("Colombian Compliance", function () {
    let compliance;
    let propertyToken;

    beforeEach(async function () {
      // Create property token first
      await factory.connect(issuer).createPropertyToken(
        PROPERTY_DETAILS.propertyId,
        "Apartamento Chapinero Token", 
        "CHAPI001",
        PROPERTY_DETAILS,
        issuer.address
      );

      const deployment = await factory.getTokenDeployment(PROPERTY_DETAILS.propertyId);
      propertyToken = await ethers.getContractAt("PropertyToken", deployment.tokenAddress);
      compliance = await ethers.getContractAt("ColombianCompliance", deployment.compliance);
    });

    it("Should register Colombian investor with KYC", async function () {
      const cedula = "12345678901";
      
      await compliance.connect(issuer).registerColombianInvestor(
        investor1.address,
        cedula,
        true, // isResident
        false, // isQualifiedInvestor
        ethers.parseEther("50") // maxInvestmentLimit (50M COP)
      );

      await compliance.connect(issuer).updateKYCStatus(investor1.address, true);

      const investorDetails = await compliance.getInvestorDetails(investor1.address);
      expect(investorDetails.cedula).to.equal(cedula);
      expect(investorDetails.isResident).to.be.true;
      expect(investorDetails.kycVerified).to.be.true;
    });

    it("Should prevent transfers to non-KYC investors", async function () {
      const tokenAmount = 1000;
      
      // Mint tokens to issuer first
      await propertyToken.connect(issuer).purchaseShares(issuer.address, tokenAmount);
      
      // Try to transfer to non-KYC investor - should fail
      const canTransfer = await compliance.canTransfer(issuer.address, investor1.address, tokenAmount);
      expect(canTransfer).to.be.false;
    });

    it("Should allow transfers to KYC-verified investors", async function () {
      const tokenAmount = 1000;
      
      // Register and verify investor
      await compliance.connect(issuer).registerColombianInvestor(
        investor1.address,
        "12345678901",
        true,
        false,
        ethers.parseEther("50")
      );
      await compliance.connect(issuer).updateKYCStatus(investor1.address, true);
      
      // Check if transfer is allowed
      const canTransfer = await compliance.canTransfer(issuer.address, investor1.address, tokenAmount);
      expect(canTransfer).to.be.true;
    });
  });

  describe("Fractional Purchase Flow", function () {
    let propertyToken;
    let tokenAddress;

    beforeEach(async function () {
      // Create property token
      await factory.connect(issuer).createPropertyToken(
        PROPERTY_DETAILS.propertyId,
        "Apartamento Chapinero Token",
        "CHAPI001", 
        PROPERTY_DETAILS,
        issuer.address
      );

      const deployment = await factory.getTokenDeployment(PROPERTY_DETAILS.propertyId);
      tokenAddress = deployment.tokenAddress;
      propertyToken = await ethers.getContractAt("PropertyToken", tokenAddress);

      // Setup compliance for investor
      const compliance = await ethers.getContractAt("ColombianCompliance", deployment.compliance);
      await compliance.connect(issuer).registerColombianInvestor(
        investor1.address,
        "12345678901",
        true,
        false,
        ethers.parseEther("50")
      );
      await compliance.connect(issuer).updateKYCStatus(investor1.address, true);
    });

    it("Should list property for sale", async function () {
      const availableTokens = 100000;
      const pricePerToken = ethers.parseEther("0.001"); // 0.001 ETH per token

      await FractionalPurchase.connect(issuer).listPropertyForSale(
        PROPERTY_DETAILS.propertyId,
        availableTokens,
        pricePerToken
      );

      const listing = await FractionalPurchase.propertyListings(PROPERTY_DETAILS.propertyId);
      expect(listing.availableTokens).to.equal(availableTokens);
      expect(listing.pricePerToken).to.equal(pricePerToken);
      expect(listing.isActive).to.be.true;
    });

    it("Should complete token purchase successfully", async function () {
      const availableTokens = 100000;
      const pricePerToken = ethers.parseEther("0.001");
      const tokensToBuy = 5000;

      // List property
      await FractionalPurchase.connect(issuer).listPropertyForSale(
        PROPERTY_DETAILS.propertyId,
        availableTokens,
        pricePerToken
      );

      // Calculate total cost including platform fee (2.5%)
      const totalPrice = pricePerToken * BigInt(tokensToBuy);
      const platformFee = totalPrice * BigInt(250) / BigInt(10000); // 2.5%
      const totalCost = totalPrice + platformFee;

      // Purchase tokens
      await FractionalPurchase.connect(investor1).createPurchaseOrder(
        PROPERTY_DETAILS.propertyId,
        tokensToBuy,
        { value: totalCost }
      );

      // Check token balance
      const balance = await propertyToken.balanceOf(investor1.address);
      expect(balance).to.equal(tokensToBuy);

      // Check available tokens decreased
      const listing = await FractionalPurchase.propertyListings(PROPERTY_DETAILS.propertyId);
      expect(listing.availableTokens).to.equal(availableTokens - tokensToBuy);
    });
  });

  describe("Portfolio Tracking", function () {
    let propertyToken;

    beforeEach(async function () {
      // Create property and setup investor
      await factory.connect(issuer).createPropertyToken(
        PROPERTY_DETAILS.propertyId,
        "Apartamento Chapinero Token",
        "CHAPI001",
        PROPERTY_DETAILS,
        issuer.address
      );

      const deployment = await factory.getTokenDeployment(PROPERTY_DETAILS.propertyId);
      propertyToken = await ethers.getContractAt("PropertyToken", deployment.tokenAddress);
      
      const compliance = await ethers.getContractAt("ColombianCompliance", deployment.compliance);
      await compliance.connect(issuer).registerColombianInvestor(
        investor1.address,
        "12345678901",
        true,
        false,
        ethers.parseEther("50")
      );
      await compliance.connect(issuer).updateKYCStatus(investor1.address, true);
    });

    it("Should track investment in portfolio", async function () {
      const tokenAmount = 5000;
      const purchasePrice = ethers.parseEther("5");

      // Add investment to portfolio
      await PortfolioTracker.addInvestment(
        investor1.address,
        PROPERTY_DETAILS.propertyId,
        tokenAmount,
        purchasePrice
      );

      // Get portfolio
      const portfolio = await PortfolioTracker.getInvestorPortfolio(investor1.address);
      expect(portfolio.length).to.equal(1);
      expect(portfolio[0].propertyId).to.equal(PROPERTY_DETAILS.propertyId);
      expect(portfolio[0].tokenAmount).to.equal(tokenAmount);
      expect(portfolio[0].purchasePrice).to.equal(purchasePrice);
    });

    it("Should generate portfolio summary", async function () {
      const tokenAmount = 5000;
      const purchasePrice = ethers.parseEther("5");

      await PortfolioTracker.addInvestment(
        investor1.address,
        PROPERTY_DETAILS.propertyId,
        tokenAmount,
        purchasePrice
      );

      const summary = await PortfolioTracker.getPortfolioSummary(investor1.address);
      expect(summary.totalInvestments).to.equal(1);
      expect(summary.activeProperties).to.equal(1);
      expect(summary.totalTokens).to.equal(tokenAmount);
    });
  });

  describe("End-to-End Token Emission", function () {
    it("Should complete full property tokenization workflow", async function () {
      console.log("=== STARTING COMPLETE TOKENIZATION WORKFLOW ===");
      
      // Step 1: Create Property Token
      console.log("1. Creating property token...");
      const createTx = await factory.connect(issuer).createPropertyToken(
        PROPERTY_DETAILS.propertyId,
        "Apartamento Chapinero Token",
        "CHAPI001",
        PROPERTY_DETAILS,
        issuer.address
      );
      
      await createTx.wait();
      const deployment = await factory.getTokenDeployment(PROPERTY_DETAILS.propertyId);
      console.log(`   ✓ Token created at: ${deployment.tokenAddress}`);
      console.log(`   ✓ Compliance at: ${deployment.compliance}`);
      console.log(`   ✓ Identity Registry at: ${deployment.identityRegistry}`);

      // Step 2: Setup Compliance
      console.log("2. Setting up Colombian compliance...");
      const compliance = await ethers.getContractAt("ColombianCompliance", deployment.compliance);
      
      // Register investor
      await compliance.connect(issuer).registerColombianInvestor(
        investor1.address,
        "12345678901",
        true, // Colombian resident
        false, // Not qualified investor
        ethers.parseEther("50") // 50M COP limit
      );
      console.log(`   ✓ Investor registered: ${investor1.address}`);
      
      // Complete KYC
      await compliance.connect(issuer).updateKYCStatus(investor1.address, true);
      console.log("   ✓ KYC verification completed");

      // Step 3: List Property for Sale
      console.log("3. Listing property for fractional sale...");
      const availableTokens = 100000;
      const pricePerToken = ethers.parseEther("0.001"); // 0.001 ETH per token
      
      await FractionalPurchase.connect(issuer).listPropertyForSale(
        PROPERTY_DETAILS.propertyId,
        availableTokens,
        pricePerToken
      );
      console.log(`   ✓ Listed ${availableTokens} tokens at ${ethers.formatEther(pricePerToken)} ETH each`);

      // Step 4: Purchase Tokens
      console.log("4. Executing token purchase...");
      const tokensToBuy = 5000;
      const totalPrice = pricePerToken * BigInt(tokensToBuy);
      const platformFee = totalPrice * BigInt(250) / BigInt(10000);
      const totalCost = totalPrice + platformFee;
      
      const purchaseTx = await FractionalPurchase.connect(investor1).createPurchaseOrder(
        PROPERTY_DETAILS.propertyId,
        tokensToBuy,
        { value: totalCost }
      );
      
      await purchaseTx.wait();
      console.log(`   ✓ Purchased ${tokensToBuy} tokens for ${ethers.formatEther(totalCost)} ETH`);

      // Step 5: Verify Token Holdings
      console.log("5. Verifying token holdings...");
      const propertyToken = await ethers.getContractAt("PropertyToken", deployment.tokenAddress);
      const balance = await propertyToken.balanceOf(investor1.address);
      const shares = await propertyToken.getInvestorShares(investor1.address);
      
      console.log(`   ✓ Investor token balance: ${balance}`);
      console.log(`   ✓ Investor shares: ${shares}`);
      
      expect(balance).to.equal(tokensToBuy);
      expect(shares).to.equal(tokensToBuy);

      // Step 6: Update Portfolio
      console.log("6. Updating portfolio tracking...");
      await PortfolioTracker.addInvestment(
        investor1.address,
        PROPERTY_DETAILS.propertyId,
        tokensToBuy,
        totalPrice
      );
      
      const portfolio = await PortfolioTracker.getInvestorPortfolio(investor1.address);
      const summary = await PortfolioTracker.getPortfolioSummary(investor1.address);
      
      console.log(`   ✓ Portfolio entries: ${portfolio.length}`);
      console.log(`   ✓ Total investments: ${summary.totalInvestments}`);
      console.log(`   ✓ Active properties: ${summary.activeProperties}`);
      console.log(`   ✓ Total tokens: ${summary.totalTokens}`);

      // Final Verification
      console.log("7. Final verification...");
      const ownershipPercentage = (Number(tokensToBuy) / Number(PROPERTY_DETAILS.totalTokens)) * 100;
      console.log(`   ✓ Ownership percentage: ${ownershipPercentage.toFixed(4)}%`);
      console.log(`   ✓ Property value represented: ${ethers.formatEther((PROPERTY_DETAILS.totalValue * BigInt(tokensToBuy)) / BigInt(PROPERTY_DETAILS.totalTokens))} ETH`);
      
      console.log("=== TOKENIZATION WORKFLOW COMPLETED SUCCESSFULLY ===");
    });
  });
});