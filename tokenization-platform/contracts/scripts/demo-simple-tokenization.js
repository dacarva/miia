const hre = require("hardhat");

async function main() {
  console.log("🏠 MIIA - Demo de Tokenización Simple de Propiedades Colombianas");
  console.log("=".repeat(65));
  
  const [deployer, issuer, investor1, investor2] = await hre.ethers.getSigners();
  
  console.log("👤 Direcciones:");
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Issuer: ${issuer.address}`);
  console.log(`   Investor1: ${investor1.address}`);
  console.log(`   Investor2: ${investor2.address}`);
  console.log();

  // Property Details
  const propertyDetails = {
    propertyId: "BOG-CHAP-001",
    propertyAddress: "Calle 63 #11-45, Chapinero, Bogotá",
    cadastralRegistry: "050-0001234",
    totalValue: hre.ethers.parseEther("350"), // 350 ETH = ~350M COP
    totalTokens: 350000,
    isActive: true,
    documentHash: "QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o"
  };

  console.log("🏢 1. Tokenizando propiedad...");
  console.log("   📄 Detalles de la propiedad:");
  console.log(`      - ID: ${propertyDetails.propertyId}`);
  console.log(`      - Dirección: ${propertyDetails.propertyAddress}`);
  console.log(`      - Matrícula: ${propertyDetails.cadastralRegistry}`);
  console.log(`      - Valor Total: ${hre.ethers.formatEther(propertyDetails.totalValue)} ETH`);
  console.log(`      - Total Tokens: ${propertyDetails.totalTokens.toLocaleString()}`);
  console.log(`      - Precio por Token: ${hre.ethers.formatEther(propertyDetails.totalValue / BigInt(propertyDetails.totalTokens))} ETH`);

  // Deploy SimplePropertyToken
  const SimplePropertyToken = await hre.ethers.getContractFactory("SimplePropertyToken");
  const propertyToken = await SimplePropertyToken.deploy(
    "Apartamento Chapinero",
    "CHAP001",
    propertyDetails
  );
  await propertyToken.waitForDeployment();

  console.log(`   ✓ Token desplegado en: ${await propertyToken.getAddress()}`);
  console.log(`   ✓ Nombre: ${await propertyToken.name()}`);
  console.log(`   ✓ Símbolo: ${await propertyToken.symbol()}`);
  console.log();

  console.log("👤 2. Configurando KYC para inversionistas...");
  
  // Setup KYC for investors
  await propertyToken.connect(deployer).updateKYC(investor1.address, true);
  await propertyToken.connect(deployer).updateKYC(investor2.address, true);
  
  console.log(`   ✓ KYC verificado para investor1: ${investor1.address}`);
  console.log(`   ✓ KYC verificado para investor2: ${investor2.address}`);
  console.log();

  console.log("💰 3. Ejecutando compras de tokens...");
  
  // Investment 1
  const investment1 = 15000; // 15,000 tokens
  await propertyToken.connect(deployer).purchaseShares(investor1.address, investment1);
  
  const balance1 = await propertyToken.balanceOf(investor1.address);
  const shares1 = await propertyToken.getInvestorShares(investor1.address);
  const ownershipPct1 = (Number(investment1) / Number(propertyDetails.totalTokens)) * 100;
  const investmentValue1 = (propertyDetails.totalValue * BigInt(investment1)) / BigInt(propertyDetails.totalTokens);
  
  console.log(`   👤 Inversionista 1:`);
  console.log(`      - Tokens comprados: ${balance1.toString()}`);
  console.log(`      - Participaciones: ${shares1.toString()}`);
  console.log(`      - Porcentaje de propiedad: ${ownershipPct1.toFixed(4)}%`);
  console.log(`      - Valor de inversión: ${hre.ethers.formatEther(investmentValue1)} ETH`);
  
  // Investment 2
  const investment2 = 8000; // 8,000 tokens
  await propertyToken.connect(deployer).purchaseShares(investor2.address, investment2);
  
  const balance2 = await propertyToken.balanceOf(investor2.address);
  const shares2 = await propertyToken.getInvestorShares(investor2.address);
  const ownershipPct2 = (Number(investment2) / Number(propertyDetails.totalTokens)) * 100;
  const investmentValue2 = (propertyDetails.totalValue * BigInt(investment2)) / BigInt(propertyDetails.totalTokens);
  
  console.log(`   👤 Inversionista 2:`);
  console.log(`      - Tokens comprados: ${balance2.toString()}`);
  console.log(`      - Participaciones: ${shares2.toString()}`);
  console.log(`      - Porcentaje de propiedad: ${ownershipPct2.toFixed(4)}%`);
  console.log(`      - Valor de inversión: ${hre.ethers.formatEther(investmentValue2)} ETH`);
  console.log();

  console.log("🔄 4. Probando transferencia con cumplimiento regulatorio...");
  
  // Test transfer between KYC-verified investors
  const transferAmount = 1000;
  await propertyToken.connect(investor1).transfer(investor2.address, transferAmount);
  
  const newBalance1 = await propertyToken.balanceOf(investor1.address);
  const newBalance2 = await propertyToken.balanceOf(investor2.address);
  
  console.log(`   ✓ Transferencia exitosa: ${transferAmount} tokens`);
  console.log(`   📊 Nuevo balance investor1: ${newBalance1.toString()}`);
  console.log(`   📊 Nuevo balance investor2: ${newBalance2.toString()}`);
  console.log();

  // Summary
  const totalSupply = await propertyToken.totalSupply();
  const availableTokens = await propertyToken.getAvailableTokens();
  const soldPercentage = (Number(totalSupply) / Number(propertyDetails.totalTokens)) * 100;
  
  console.log("📈 5. Resumen de tokenización:");
  console.log("=" .repeat(50));
  console.log(`🏢 Propiedad: ${propertyDetails.propertyAddress}`);
  console.log(`💰 Valor total: ${hre.ethers.formatEther(propertyDetails.totalValue)} ETH`);
  console.log(`🪙 Tokens emitidos: ${totalSupply.toString()} / ${propertyDetails.totalTokens.toLocaleString()}`);
  console.log(`🛍️  Tokens disponibles: ${availableTokens.toString()}`);
  console.log(`📊 Porcentaje vendido: ${soldPercentage.toFixed(2)}%`);
  console.log(`🔗 Dirección del contrato: ${await propertyToken.getAddress()}`);
  
  console.log("\n👥 Inversionistas:");
  console.log(`   ${investor1.address}: ${newBalance1.toString()} tokens (${((Number(newBalance1) / Number(propertyDetails.totalTokens)) * 100).toFixed(4)}%)`);
  console.log(`   ${investor2.address}: ${newBalance2.toString()} tokens (${((Number(newBalance2) / Number(propertyDetails.totalTokens)) * 100).toFixed(4)}%)`);
  
  console.log("=" .repeat(50));
  console.log("✅ ¡DEMO DE TOKENIZACIÓN COMPLETADO EXITOSAMENTE!");
  console.log();
  console.log("🎯 Funcionalidades demostradas:");
  console.log("   ✓ Tokenización de propiedad inmobiliaria");
  console.log("   ✓ Verificación KYC obligatoria");
  console.log("   ✓ Compra fraccionada de tokens");
  console.log("   ✓ Transferencias con cumplimiento regulatorio");
  console.log("   ✓ Seguimiento de participaciones de inversionistas");
  console.log("   ✓ Cálculo automático de porcentajes de propiedad");
  
  // Save demo results
  const demoResults = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    contractAddress: await propertyToken.getAddress(),
    property: {
      id: propertyDetails.propertyId,
      address: propertyDetails.propertyAddress,
      totalValue: hre.ethers.formatEther(propertyDetails.totalValue) + " ETH",
      totalTokens: propertyDetails.totalTokens,
    },
    tokenomics: {
      totalSupply: totalSupply.toString(),
      availableTokens: availableTokens.toString(),
      soldPercentage: soldPercentage.toFixed(2) + "%"
    },
    investors: [
      {
        address: investor1.address,
        tokens: newBalance1.toString(),
        ownershipPercentage: ((Number(newBalance1) / Number(propertyDetails.totalTokens)) * 100).toFixed(4) + "%"
      },
      {
        address: investor2.address,
        tokens: newBalance2.toString(),
        ownershipPercentage: ((Number(newBalance2) / Number(propertyDetails.totalTokens)) * 100).toFixed(4) + "%"
      }
    ]
  };

  const fs = require('fs');
  const filename = `demo-simple-tokenization-${hre.network.name}-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(demoResults, null, 2));
  console.log(`\n💾 Resultados guardados en: ${filename}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });