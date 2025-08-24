const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ColombianCOP Mock Token", function () {
  let ColombianCOP;
  let colombianCOP;
  let owner;
  let user1;
  let user2;

  const INITIAL_SUPPLY = ethers.parseEther("100000000000000"); // 100 trillion tokens

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    console.log("🚀 Deploying Colombian COP Mock Token...");

    // Deploy Colombian COP Token
    const ColombianCOPFactory = await ethers.getContractFactory("ColombianCOP");
    colombianCOP = await ColombianCOPFactory.deploy();
    await colombianCOP.waitForDeployment();

    console.log("✅ Colombian COP Mock Token deployed successfully");
  });

  describe("Token Deployment", function () {
    it("Should have correct token information", async function () {
      console.log("\n📄 Checking token information...");
      
      const [name, symbol, decimals, totalSupply] = await colombianCOP.getTokenInfo();
      
      expect(name).to.equal("Colombian COP Mock");
      expect(symbol).to.equal("MCOP");
      expect(decimals).to.equal(18);
      expect(totalSupply).to.equal(INITIAL_SUPPLY);
      
      console.log(`   ✅ Name: ${name}`);
      console.log(`   ✅ Symbol: ${symbol}`);
      console.log(`   ✅ Decimals: ${decimals}`);
      console.log(`   ✅ Total Supply: ${ethers.formatEther(totalSupply)} MCOP`);
    });

    it("Should give initial supply to deployer", async function () {
      console.log("\n💰 Checking initial balances...");
      
      const ownerBalance = await colombianCOP.balanceOf(owner.address);
      const totalSupply = await colombianCOP.totalSupply();
      
      expect(ownerBalance).to.equal(INITIAL_SUPPLY);
      expect(ownerBalance).to.equal(totalSupply);
      
      console.log(`   ✅ Owner balance: ${ethers.formatEther(ownerBalance)} MCOP`);
      console.log(`   ✅ Total supply: ${ethers.formatEther(totalSupply)} MCOP`);
    });
  });

  describe("Minting Functions", function () {
    it("Should allow anyone to mint tokens", async function () {
      console.log("\n🪙 Testing mint function...");
      
      const mintAmount = ethers.parseEther("1000"); // 1000 MCOP
      const initialBalance = await colombianCOP.balanceOf(user1.address);
      
      await colombianCOP.connect(user1).mint(user1.address, mintAmount);
      
      const finalBalance = await colombianCOP.balanceOf(user1.address);
      expect(finalBalance).to.equal(initialBalance + mintAmount);
      
      console.log(`   ✅ Minted ${ethers.formatEther(mintAmount)} MCOP to user1`);
      console.log(`   ✅ User1 balance: ${ethers.formatEther(finalBalance)} MCOP`);
    });

    it("Should allow minting to self", async function () {
      console.log("\n🪙 Testing mintToSelf function...");
      
      const mintAmount = ethers.parseEther("500"); // 500 MCOP
      const initialBalance = await colombianCOP.balanceOf(user2.address);
      
      await colombianCOP.connect(user2).mintToSelf(mintAmount);
      
      const finalBalance = await colombianCOP.balanceOf(user2.address);
      expect(finalBalance).to.equal(initialBalance + mintAmount);
      
      console.log(`   ✅ User2 minted ${ethers.formatEther(mintAmount)} MCOP to themselves`);
      console.log(`   ✅ User2 balance: ${ethers.formatEther(finalBalance)} MCOP`);
    });

    it("Should allow minting COP amounts", async function () {
      console.log("\n💱 Testing COP minting functions...");
      
      const copAmount = 1000000; // 1 million COP
      const expectedWeiAmount = BigInt(copAmount) * BigInt(1e12); // Convert to wei
      
      // Test mintCOP
      await colombianCOP.connect(user1).mintCOP(user1.address, copAmount);
      const user1Balance = await colombianCOP.balanceOf(user1.address);
      const user1BalanceCOP = await colombianCOP.balanceOfCOP(user1.address);
      
      expect(user1Balance).to.equal(expectedWeiAmount);
      expect(user1BalanceCOP).to.equal(copAmount);
      
      console.log(`   ✅ Minted ${copAmount.toLocaleString()} COP to user1`);
      console.log(`   ✅ User1 balance: ${user1BalanceCOP.toLocaleString()} COP`);
      
      // Test mintCOPToSelf
      await colombianCOP.connect(user2).mintCOPToSelf(copAmount);
      const user2BalanceCOP = await colombianCOP.balanceOfCOP(user2.address);
      
      expect(user2BalanceCOP).to.equal(copAmount);
      
      console.log(`   ✅ User2 minted ${copAmount.toLocaleString()} COP to themselves`);
      console.log(`   ✅ User2 balance: ${user2BalanceCOP.toLocaleString()} COP`);
    });

    it("Should reject minting to zero address", async function () {
      console.log("\n❌ Testing mint to zero address...");
      
      const mintAmount = ethers.parseEther("100");
      
      await expect(
        colombianCOP.mint(ethers.ZeroAddress, mintAmount)
      ).to.be.revertedWith("MCOP: cannot mint to zero address");
      
      console.log("   ✅ Correctly rejected minting to zero address");
    });

    it("Should reject minting zero amount", async function () {
      console.log("\n❌ Testing mint zero amount...");
      
      await expect(
        colombianCOP.mint(user1.address, 0)
      ).to.be.revertedWith("MCOP: amount must be greater than zero");
      
      await expect(
        colombianCOP.mintToSelf(0)
      ).to.be.revertedWith("MCOP: amount must be greater than zero");
      
      console.log("   ✅ Correctly rejected minting zero amounts");
    });
  });

  describe("Burning Functions", function () {
    beforeEach(async function () {
      // Give users some tokens to burn
      await colombianCOP.mint(user1.address, ethers.parseEther("1000"));
      await colombianCOP.mint(user2.address, ethers.parseEther("1000"));
    });

    it("Should allow burning own tokens", async function () {
      console.log("\n🔥 Testing burn function...");
      
      const burnAmount = ethers.parseEther("500");
      const initialBalance = await colombianCOP.balanceOf(user1.address);
      
      await colombianCOP.connect(user1).burn(burnAmount);
      
      const finalBalance = await colombianCOP.balanceOf(user1.address);
      expect(finalBalance).to.equal(initialBalance - burnAmount);
      
      console.log(`   ✅ User1 burned ${ethers.formatEther(burnAmount)} MCOP`);
      console.log(`   ✅ User1 balance: ${ethers.formatEther(finalBalance)} MCOP`);
    });

    it("Should allow burning from another address with allowance", async function () {
      console.log("\n🔥 Testing burnFrom function...");
      
      const burnAmount = ethers.parseEther("300");
      
      // First approve user2 to spend user1's tokens
      await colombianCOP.connect(user1).approve(user2.address, burnAmount);
      
      const initialBalance = await colombianCOP.balanceOf(user1.address);
      
      // User2 burns user1's tokens
      await colombianCOP.connect(user2).burnFrom(user1.address, burnAmount);
      
      const finalBalance = await colombianCOP.balanceOf(user1.address);
      expect(finalBalance).to.equal(initialBalance - burnAmount);
      
      console.log(`   ✅ User2 burned ${ethers.formatEther(burnAmount)} MCOP from user1`);
      console.log(`   ✅ User1 balance: ${ethers.formatEther(finalBalance)} MCOP`);
    });

    it("Should reject burning more than balance", async function () {
      console.log("\n❌ Testing burn exceeds balance...");
      
      const userBalance = await colombianCOP.balanceOf(user1.address);
      const excessiveAmount = userBalance + ethers.parseEther("1");
      
      await expect(
        colombianCOP.connect(user1).burn(excessiveAmount)
      ).to.be.revertedWith("MCOP: burn amount exceeds balance");
      
      console.log("   ✅ Correctly rejected burning more than balance");
    });
  });

  describe("COP Conversion Functions", function () {
    it("Should correctly convert between wei and COP", async function () {
      console.log("\n💱 Testing COP conversion...");
      
      // Mint some COP amounts
      const copAmounts = [1000000, 5000000, 10000000]; // 1M, 5M, 10M COP
      
      for (const copAmount of copAmounts) {
        await colombianCOP.mintCOP(user1.address, copAmount);
      }
      
      const totalCOPBalance = await colombianCOP.balanceOfCOP(user1.address);
      const totalWeiBalance = await colombianCOP.balanceOf(user1.address);
      const expectedCOPSum = copAmounts.reduce((sum, amount) => sum + amount, 0);
      
      expect(totalCOPBalance).to.equal(expectedCOPSum);
      expect(totalWeiBalance).to.equal(BigInt(expectedCOPSum) * BigInt(1e12));
      
      console.log(`   ✅ Total COP balance: ${totalCOPBalance.toLocaleString()} COP`);
      console.log(`   ✅ Total wei balance: ${ethers.formatEther(totalWeiBalance)} MCOP`);
      
      // Test total supply COP conversion
      const totalSupplyCOP = await colombianCOP.totalSupplyCOP();
      const totalSupply = await colombianCOP.totalSupply();
      
      expect(totalSupplyCOP).to.equal(totalSupply / BigInt(1e12));
      
      console.log(`   ✅ Total supply: ${totalSupplyCOP.toLocaleString()} COP`);
    });
  });

  describe("Demo Usage", function () {
    it("Should demonstrate typical usage patterns", async function () {
      console.log("\n🎯 === DEMO USAGE PATTERNS ===");
      
      // Demo 1: Property investor getting COP for investment
      console.log("1️⃣  Property investor gets COP for investment...");
      const investmentAmount = 500000000; // 500M COP
      await colombianCOP.connect(user1).mintCOPToSelf(investmentAmount);
      
      const user1COPBalance = await colombianCOP.balanceOfCOP(user1.address);
      console.log(`   💰 Investor balance: ${user1COPBalance.toLocaleString()} COP`);
      
      // Demo 2: Platform getting tokens for operations
      console.log("2️⃣  Platform getting operational tokens...");
      const operationalTokens = ethers.parseEther("1000000"); // 1M MCOP
      await colombianCOP.connect(owner).mintToSelf(operationalTokens);
      
      const ownerBalance = await colombianCOP.balanceOf(owner.address);
      console.log(`   🏢 Platform balance: ${ethers.formatEther(ownerBalance)} MCOP`);
      
      // Demo 3: Transfer between users
      console.log("3️⃣  Transfer between users...");
      const transferAmount = 50000000; // 50M COP in wei
      const transferAmountWei = BigInt(transferAmount) * BigInt(1e12);
      
      await colombianCOP.connect(user1).transfer(user2.address, transferAmountWei);
      
      const user2COPBalance = await colombianCOP.balanceOfCOP(user2.address);
      console.log(`   💸 Transfer completed: ${transferAmount.toLocaleString()} COP`);
      console.log(`   💰 User2 balance: ${user2COPBalance.toLocaleString()} COP`);
      
      console.log("🎉 Demo completed successfully!");
    });
  });
});
