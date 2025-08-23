const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Simple Property Tokenization Demo", function () {
  let PropertyToken;
  let propertyToken;
  let owner;
  let investor1;
  let investor2;

  const PROPERTY_DETAILS = {
    propertyId: "CHAP-001",
    propertyAddress: "Calle 63 #11-45, Chapinero, Bogotá",
    cadastralRegistry: "050-0001234",
    totalValue: ethers.parseEther("350"), // 350 ETH representing 350M COP
    totalTokens: 350000,
    isActive: true,
    documentHash: "QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o"
  };

  beforeEach(async function () {
    [owner, investor1, investor2] = await ethers.getSigners();
    
    // Deploy a simple ERC20-based property token for demo purposes
    PropertyToken = await ethers.getContractFactory("SimplePropertyToken");
    propertyToken = await PropertyToken.deploy(
      "Apartamento Chapinero",
      "CHAP001",
      PROPERTY_DETAILS
    );
    await propertyToken.waitForDeployment();
  });

  it("Should tokenize a Colombian property successfully", async function () {
    console.log("\n🏠 === DEMO: TOKENIZACIÓN DE PROPIEDAD COLOMBIANA ===");
    console.log(`📍 Propiedad: ${PROPERTY_DETAILS.propertyAddress}`);
    console.log(`🏷️  Token Symbol: CHAP001`);
    console.log(`💰 Valor Total: ${ethers.formatEther(PROPERTY_DETAILS.totalValue)} ETH`);
    console.log(`🪙 Total Tokens: ${PROPERTY_DETAILS.totalTokens.toLocaleString()}`);
    console.log(`💵 Precio por Token: ${ethers.formatEther(PROPERTY_DETAILS.totalValue / BigInt(PROPERTY_DETAILS.totalTokens))} ETH`);
    
    const propertyDetails = await propertyToken.propertyDetails();
    expect(propertyDetails.propertyId).to.equal(PROPERTY_DETAILS.propertyId);
    expect(propertyDetails.totalValue).to.equal(PROPERTY_DETAILS.totalValue);
    expect(propertyDetails.totalTokens).to.equal(PROPERTY_DETAILS.totalTokens);
    
    console.log("✅ Propiedad tokenizada exitosamente");
  });

  it("Should handle KYC verification and token purchases", async function () {
    console.log("\n👤 === DEMO: PROCESO KYC Y COMPRA DE TOKENS ===");
    
    // Step 1: KYC Verification
    console.log("1. Verificando KYC del inversionista...");
    await propertyToken.updateKYC(investor1.address, true);
    
    const isKycVerified = await propertyToken.kycVerified(investor1.address);
    expect(isKycVerified).to.be.true;
    console.log(`   ✅ KYC verificado para: ${investor1.address}`);
    
    // Step 2: Purchase tokens
    console.log("2. Comprando tokens de propiedad...");
    const tokensToBuy = 10000; // 10,000 tokens
    
    await propertyToken.purchaseShares(investor1.address, tokensToBuy);
    
    const balance = await propertyToken.balanceOf(investor1.address);
    const shares = await propertyToken.getInvestorShares(investor1.address);
    
    expect(balance).to.equal(tokensToBuy);
    expect(shares).to.equal(tokensToBuy);
    
    console.log(`   🪙 Tokens comprados: ${balance.toString()}`);
    console.log(`   📊 Participaciones: ${shares.toString()}`);
    
    // Calculate ownership percentage
    const ownershipPercentage = (Number(tokensToBuy) / Number(PROPERTY_DETAILS.totalTokens)) * 100;
    console.log(`   📈 Porcentaje de propiedad: ${ownershipPercentage.toFixed(4)}%`);
    
    // Calculate investment value
    const investmentValue = (PROPERTY_DETAILS.totalValue * BigInt(tokensToBuy)) / BigInt(PROPERTY_DETAILS.totalTokens);
    console.log(`   💰 Valor de la inversión: ${ethers.formatEther(investmentValue)} ETH`);
    
    console.log("✅ Compra de tokens completada exitosamente");
  });

  it("Should enforce KYC requirements for transfers", async function () {
    console.log("\n🔒 === DEMO: CUMPLIMIENTO REGULATORIO ===");
    
    // Setup: KYC investor1 and mint tokens
    await propertyToken.updateKYC(investor1.address, true);
    await propertyToken.purchaseShares(investor1.address, 5000);
    
    console.log("1. Intentando transferir a inversionista no verificado...");
    
    // Try to transfer to non-KYC investor2 - should fail
    await expect(
      propertyToken.connect(investor1).transfer(investor2.address, 1000)
    ).to.be.revertedWith("Recipient not KYC verified");
    
    console.log("   ❌ Transferencia bloqueada - Destinatario sin KYC");
    
    // Now KYC investor2 and try again
    console.log("2. Verificando KYC del destinatario...");
    await propertyToken.updateKYC(investor2.address, true);
    
    console.log("3. Intentando transferencia nuevamente...");
    await propertyToken.connect(investor1).transfer(investor2.address, 1000);
    
    const investor2Balance = await propertyToken.balanceOf(investor2.address);
    expect(investor2Balance).to.equal(1000);
    
    console.log(`   ✅ Transferencia exitosa: ${investor2Balance.toString()} tokens`);
    console.log("✅ Cumplimiento regulatorio verificado");
  });

  it("Should demonstrate complete tokenization workflow", async function () {
    console.log("\n🚀 === DEMO: FLUJO COMPLETO DE TOKENIZACIÓN ===");
    
    console.log("📋 RESUMEN DE LA PROPIEDAD:");
    console.log(`   🏠 Dirección: ${PROPERTY_DETAILS.propertyAddress}`);
    console.log(`   📋 Matrícula: ${PROPERTY_DETAILS.cadastralRegistry}`);
    console.log(`   💰 Valor: ${ethers.formatEther(PROPERTY_DETAILS.totalValue)} ETH`);
    console.log(`   🪙 Tokens: ${PROPERTY_DETAILS.totalTokens.toLocaleString()}`);
    
    // Multiple investors
    const investors = [investor1, investor2];
    const investments = [15000, 8000]; // tokens each
    
    console.log("\n👥 INVERSIONISTAS:");
    
    for (let i = 0; i < investors.length; i++) {
      const investor = investors[i];
      const tokens = investments[i];
      
      console.log(`\n   Inversionista ${i + 1}: ${investor.address}`);
      
      // KYC verification
      await propertyToken.updateKYC(investor.address, true);
      console.log("   ✅ KYC verificado");
      
      // Purchase tokens
      await propertyToken.purchaseShares(investor.address, tokens);
      
      const balance = await propertyToken.balanceOf(investor.address);
      const ownershipPct = (Number(tokens) / Number(PROPERTY_DETAILS.totalTokens)) * 100;
      const investmentValue = (PROPERTY_DETAILS.totalValue * BigInt(tokens)) / BigInt(PROPERTY_DETAILS.totalTokens);
      
      console.log(`   🪙 Tokens: ${balance.toString()}`);
      console.log(`   📊 Propiedad: ${ownershipPct.toFixed(4)}%`);
      console.log(`   💰 Valor: ${ethers.formatEther(investmentValue)} ETH`);
    }
    
    // Summary
    const totalSupply = await propertyToken.totalSupply();
    const availableTokens = await propertyToken.getAvailableTokens();
    
    console.log("\n📈 RESUMEN FINAL:");
    console.log(`   🏭 Tokens emitidos: ${totalSupply.toString()}`);
    console.log(`   🛍️  Tokens disponibles: ${availableTokens.toString()}`);
    console.log(`   📊 Porcentaje vendido: ${((Number(totalSupply) / Number(PROPERTY_DETAILS.totalTokens)) * 100).toFixed(2)}%`);
    
    const soldPercentage = (Number(totalSupply) / Number(PROPERTY_DETAILS.totalTokens)) * 100;
    console.log(`\n🎉 TOKENIZACIÓN ${soldPercentage > 0 ? 'EXITOSA' : 'INICIADA'}`);
    console.log("=" .repeat(60));
    
    expect(totalSupply).to.equal(investments.reduce((a, b) => a + b, 0));
    expect(availableTokens).to.equal(PROPERTY_DETAILS.totalTokens - Number(totalSupply));
  });
});

// Simple ERC20-based property token for demo
// This would be deployed as part of the test, simulating the T-REX Token
contract SimplePropertyToken {
    // ... contract code would be defined here in a separate file
    // For this test, we're assuming it's already compiled
}