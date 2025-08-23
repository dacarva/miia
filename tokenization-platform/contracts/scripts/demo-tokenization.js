const hre = require("hardhat");

async function main() {
  console.log("🏠 MIIA - Demo de Tokenización de Propiedades Colombianas");
  console.log("=".repeat(60));
  
  const [deployer, issuer, investor] = await hre.ethers.getSigners();
  
  console.log("👤 Direcciones:");
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Issuer: ${issuer.address}`);
  console.log(`   Investor: ${investor.address}`);
  console.log();

  // Step 1: Deploy Infrastructure
  console.log("📋 1. Desplegando infraestructura T-REX...");
  
  const TrustedIssuersRegistry = await hre.ethers.getContractFactory("TrustedIssuersRegistry");
  const trustedIssuersRegistry = await TrustedIssuersRegistry.deploy();
  await trustedIssuersRegistry.waitForDeployment();
  console.log(`   ✓ TrustedIssuersRegistry: ${await trustedIssuersRegistry.getAddress()}`);

  const ClaimTopicsRegistry = await hre.ethers.getContractFactory("ClaimTopicsRegistry");
  const claimTopicsRegistry = await ClaimTopicsRegistry.deploy();
  await claimTopicsRegistry.waitForDeployment();
  console.log(`   ✓ ClaimTopicsRegistry: ${await claimTopicsRegistry.getAddress()}`);

  const PropertyTokenFactory = await hre.ethers.getContractFactory("PropertyTokenFactory");
  const factory = await PropertyTokenFactory.deploy(
    await trustedIssuersRegistry.getAddress(),
    await claimTopicsRegistry.getAddress()
  );
  await factory.waitForDeployment();
  console.log(`   ✓ PropertyTokenFactory: ${await factory.getAddress()}`);

  const FractionalPurchase = await hre.ethers.getContractFactory("FractionalPurchase");
  const fractionalPurchase = await FractionalPurchase.deploy(
    await factory.getAddress(),
    deployer.address
  );
  await fractionalPurchase.waitForDeployment();
  console.log(`   ✓ FractionalPurchase: ${await fractionalPurchase.getAddress()}`);

  const PortfolioTracker = await hre.ethers.getContractFactory("PortfolioTracker");
  const portfolioTracker = await PortfolioTracker.deploy(
    await factory.getAddress()
  );
  await portfolioTracker.waitForDeployment();
  console.log(`   ✓ PortfolioTracker: ${await portfolioTracker.getAddress()}`);
  console.log();

  // Step 2: Create Property Token
  console.log("🏢 2. Tokenizando propiedad...");
  
  const propertyDetails = {
    propertyId: "BOG-CHAP-001",
    propertyAddress: "Calle 63 #11-45, Chapinero, Bogotá",
    cadastralRegistry: "050-0001234",
    totalValue: hre.ethers.parseEther("350"), // 350 ETH = ~350M COP
    totalTokens: 350000,
    isActive: true,
    documentHash: "QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o"
  };

  console.log("   📄 Detalles de la propiedad:");
  console.log(`      - ID: ${propertyDetails.propertyId}`);
  console.log(`      - Dirección: ${propertyDetails.propertyAddress}`);
  console.log(`      - Matrícula: ${propertyDetails.cadastralRegistry}`);
  console.log(`      - Valor Total: ${hre.ethers.formatEther(propertyDetails.totalValue)} ETH`);
  console.log(`      - Total Tokens: ${propertyDetails.totalTokens.toLocaleString()}`);
  console.log(`      - Precio por Token: ${hre.ethers.formatEther(propertyDetails.totalValue / BigInt(propertyDetails.totalTokens))} ETH`);

  const createTx = await factory.connect(issuer).createPropertyToken(
    propertyDetails.propertyId,
    "Apartamento Chapinero",
    "CHAP001",
    propertyDetails,
    issuer.address
  );
  
  const createReceipt = await createTx.wait();
  console.log(`   ✓ Token creado - Hash: ${createReceipt.hash}`);

  const deployment = await factory.getTokenDeployment(propertyDetails.propertyId);
  console.log(`   ✓ Dirección del Token: ${deployment.tokenAddress}`);
  console.log(`   ✓ Compliance Contract: ${deployment.compliance}`);
  console.log();

  // Step 3: Setup Compliance
  console.log("⚖️  3. Configurando cumplimiento colombiano...");
  
  const compliance = await hre.ethers.getContractAt("ColombianCompliance", deployment.compliance);
  
  // Register investor
  const cedula = "1234567890";
  await compliance.connect(issuer).registerColombianInvestor(
    investor.address,
    cedula,
    true, // Colombian resident
    false, // Not qualified investor  
    hre.ethers.parseEther("50") // 50M COP investment limit
  );
  console.log(`   ✓ Inversionista registrado: ${investor.address}`);
  console.log(`   ✓ Cédula: ${cedula}`);

  // Complete KYC
  await compliance.connect(issuer).updateKYCStatus(investor.address, true);
  console.log("   ✓ Verificación KYC completada");

  const investorDetails = await compliance.getInvestorDetails(investor.address);
  console.log(`   ✓ Es residente: ${investorDetails.isResident}`);
  console.log(`   ✓ KYC verificado: ${investorDetails.kycVerified}`);
  console.log();

  // Step 4: List Property for Sale
  console.log("🛒 4. Listando propiedad para venta fraccionaria...");
  
  const availableTokens = 175000; // 50% of total tokens
  const pricePerToken = hre.ethers.parseEther("0.001"); // 0.001 ETH per token
  
  await fractionalPurchase.connect(issuer).listPropertyForSale(
    propertyDetails.propertyId,
    availableTokens,
    pricePerToken
  );
  
  console.log(`   ✓ Tokens disponibles: ${availableTokens.toLocaleString()}`);
  console.log(`   ✓ Precio por token: ${hre.ethers.formatEther(pricePerToken)} ETH`);
  console.log(`   ✓ Inversión mínima: ${hre.ethers.formatEther(pricePerToken * BigInt(100))} ETH (100 tokens)`);
  console.log();

  // Step 5: Purchase Tokens
  console.log("💰 5. Comprando tokens...");
  
  const tokensToBuy = 10000; // Buy 10,000 tokens
  const totalPrice = pricePerToken * BigInt(tokensToBuy);
  const platformFee = totalPrice * BigInt(250) / BigInt(10000); // 2.5% fee
  const totalCost = totalPrice + platformFee;
  
  console.log(`   📊 Detalles de compra:`);
  console.log(`      - Tokens a comprar: ${tokensToBuy.toLocaleString()}`);
  console.log(`      - Precio total: ${hre.ethers.formatEther(totalPrice)} ETH`);
  console.log(`      - Fee plataforma (2.5%): ${hre.ethers.formatEther(platformFee)} ETH`);
  console.log(`      - Costo total: ${hre.ethers.formatEther(totalCost)} ETH`);
  
  const ownershipPercentage = (tokensToBuy / propertyDetails.totalTokens) * 100;
  console.log(`      - Porcentaje de propiedad: ${ownershipPercentage.toFixed(4)}%`);

  const balanceBefore = await hre.ethers.provider.getBalance(investor.address);
  
  const purchaseTx = await fractionalPurchase.connect(investor).createPurchaseOrder(
    propertyDetails.propertyId,
    tokensToBuy,
    { value: totalCost }
  );
  
  const purchaseReceipt = await purchaseTx.wait();
  console.log(`   ✓ Compra ejecutada - Hash: ${purchaseReceipt.hash}`);
  
  const balanceAfter = await hre.ethers.provider.getBalance(investor.address);
  const gasCost = purchaseReceipt.gasUsed * purchaseReceipt.gasPrice;
  const totalSpent = balanceBefore - balanceAfter;
  
  console.log(`   ✓ Gas utilizado: ${purchaseReceipt.gasUsed.toLocaleString()}`);
  console.log(`   ✓ Costo de gas: ${hre.ethers.formatEther(gasCost)} ETH`);
  console.log(`   ✓ Total gastado: ${hre.ethers.formatEther(totalSpent)} ETH`);
  console.log();

  // Step 6: Verify Holdings
  console.log("🔍 6. Verificando tenencias...");
  
  const propertyToken = await hre.ethers.getContractAt("PropertyToken", deployment.tokenAddress);
  const tokenBalance = await propertyToken.balanceOf(investor.address);
  const shares = await propertyToken.getInvestorShares(investor.address);
  const availableTokensAfter = await propertyToken.getAvailableTokens();
  
  console.log(`   ✓ Balance de tokens: ${tokenBalance.toString()}`);
  console.log(`   ✓ Participaciones: ${shares.toString()}`);
  console.log(`   ✓ Tokens restantes: ${availableTokensAfter.toString()}`);
  
  const propertyValue = await propertyToken.getPropertyValue();
  const investorPropertyValue = (propertyValue * tokenBalance) / BigInt(propertyDetails.totalTokens);
  console.log(`   ✓ Valor de la propiedad del inversionista: ${hre.ethers.formatEther(investorPropertyValue)} ETH`);
  console.log();

  // Step 7: Portfolio Tracking
  console.log("📊 7. Actualizando portafolio...");
  
  await portfolioTracker.addInvestment(
    investor.address,
    propertyDetails.propertyId,
    tokensToBuy,
    totalPrice
  );
  
  const portfolio = await portfolioTracker.getInvestorPortfolio(investor.address);
  const summary = await portfolioTracker.getPortfolioSummary(investor.address);
  
  console.log(`   ✓ Inversiones en portafolio: ${summary.totalInvestments.toString()}`);
  console.log(`   ✓ Propiedades activas: ${summary.activeProperties.toString()}`);
  console.log(`   ✓ Total tokens: ${summary.totalTokens.toString()}`);
  console.log(`   ✓ Valor total: ${hre.ethers.formatEther(summary.totalValue)} ETH`);
  console.log();

  // Step 8: Summary
  console.log("📈 8. Resumen de tokenización completada:");
  console.log("=".repeat(50));
  console.log(`🏢 Propiedad: ${propertyDetails.propertyAddress}`);
  console.log(`💰 Valor total: ${hre.ethers.formatEther(propertyDetails.totalValue)} ETH`);
  console.log(`🪙 Tokens emitidos: ${propertyDetails.totalTokens.toLocaleString()}`);
  console.log(`👤 Inversionista: ${investor.address}`);
  console.log(`🛒 Tokens comprados: ${tokensToBuy.toLocaleString()}`);
  console.log(`📊 Porcentaje de propiedad: ${ownershipPercentage.toFixed(4)}%`);
  console.log(`💸 Total invertido: ${hre.ethers.formatEther(totalPrice)} ETH`);
  console.log(`🔗 Dirección del token: ${deployment.tokenAddress}`);
  console.log(`📋 Compliance: ${deployment.compliance}`);
  console.log("=".repeat(50));
  console.log("✅ ¡TOKENIZACIÓN EXITOSA!");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    property: {
      id: propertyDetails.propertyId,
      address: propertyDetails.propertyAddress,
      totalValue: hre.ethers.formatEther(propertyDetails.totalValue) + " ETH",
      totalTokens: propertyDetails.totalTokens,
    },
    contracts: {
      PropertyTokenFactory: await factory.getAddress(),
      PropertyToken: deployment.tokenAddress,
      Compliance: deployment.compliance,
      IdentityRegistry: deployment.identityRegistry,
      FractionalPurchase: await fractionalPurchase.getAddress(),
      PortfolioTracker: await portfolioTracker.getAddress(),
    },
    transaction: {
      tokenCreation: createReceipt.hash,
      tokenPurchase: purchaseReceipt.hash,
    },
    investor: {
      address: investor.address,
      tokensPurchased: tokensToBuy,
      ownershipPercentage: ownershipPercentage,
      amountInvested: hre.ethers.formatEther(totalPrice) + " ETH"
    }
  };

  const fs = require('fs');
  const filename = `demo-tokenization-${hre.network.name}-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Información guardada en: ${filename}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });