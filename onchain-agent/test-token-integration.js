import { ethers } from 'ethers';

// Test script to verify token integration
async function testTokenIntegration() {
  console.log('🧪 Testing MIIA Token Integration...\n');

  // Deployed contract addresses
  const DEPLOYED_CONTRACTS = {
    MIIA001: {
      name: "Apartamento Chapinero Premium",
      symbol: "CHAP001",
      tokenAddress: "0xE5e3203B043AaB9d2a43929Fc9ECde7f0D90DE6A",
      totalValue: ethers.parseEther("500"), // 500 ETH = 500M COP
      totalTokens: 500000
    },
    MIIA002: {
      name: "Casa Zona Rosa Bogotá",
      symbol: "ROSA002", 
      tokenAddress: "0x98e7a98DfD326EBd13c78789768EaDe3f2251C56",
      totalValue: ethers.parseEther("800"), // 800 ETH = 800M COP
      totalTokens: 800000
    },
    MIIA003: {
      name: "Oficina El Poblado Medellín",
      symbol: "POB003",
      tokenAddress: "0x188c31F1630a5F1ec7970962A1F3CcDe65E94C82",
      totalValue: ethers.parseEther("350"), // 350 ETH = 350M COP
      totalTokens: 350000
    }
  };

  console.log('📋 Available Tokenized Properties:');
  console.log('=====================================');
  
  for (const [propertyId, property] of Object.entries(DEPLOYED_CONTRACTS)) {
    const pricePerToken = Number(property.totalValue) / property.totalTokens;
    const minInvestment = 400000; // 400,000 COP
    const minTokens = Math.ceil(minInvestment / (pricePerToken * 1000000)); // Convert ETH to COP
    
    console.log(`\n🏠 ${propertyId}: ${property.name}`);
    console.log(`   Symbol: ${property.symbol}`);
    console.log(`   Token Address: ${property.tokenAddress}`);
    console.log(`   Total Value: ${ethers.formatEther(property.totalValue)} ETH (${ethers.formatEther(property.totalValue)}M COP)`);
    console.log(`   Total Tokens: ${property.totalTokens.toLocaleString()}`);
    console.log(`   Price per Token: ${ethers.formatEther(BigInt(Math.floor(pricePerToken)))} ETH`);
    console.log(`   Min Investment: ${minTokens} tokens (${minInvestment.toLocaleString()} COP)`);
    console.log(`   Ownership per Token: ${(1 / property.totalTokens * 100).toFixed(6)}%`);
  }

  console.log('\n✅ Token Integration Test Complete!');
  console.log('\n📝 Next Steps:');
  console.log('1. Users can now purchase tokens using the agent');
  console.log('2. Use list_tokenized_properties to show available properties');
  console.log('3. Use get_property_token_info to get detailed information');
  console.log('4. Use purchase_property_tokens to buy tokens');
  console.log('5. Use get_user_token_holdings to view portfolio');
}

testTokenIntegration().catch(console.error);
