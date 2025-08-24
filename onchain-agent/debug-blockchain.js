#!/usr/bin/env node

// Debug blockchain interactions directly without LLM prompts
const { prepareAgentkitAndWalletProvider } = require('./app/api/agent/prepare-agentkit.ts');

async function debugBlockchainInteractions() {
  console.log('🔗 Debugging Blockchain Interactions...\n');

  try {
    // Step 1: Initialize wallet provider
    console.log('1. Setting up wallet provider...');
    const { agentkit, walletProvider, walletData } = await prepareAgentkitAndWalletProvider('+573001234567', false);
    
    console.log(`✅ Wallet: ${walletData.smartWalletAddress}`);
    console.log(`✅ Network: ${walletProvider.getNetwork().networkId}`);
    
    // Step 2: Test wallet provider methods
    console.log('\n2. Testing wallet provider methods...');
    console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(walletProvider)));
    
    // Get address
    const address = walletProvider.getAddress();
    console.log(`✅ Address: ${address}`);
    
    // Get network
    const network = walletProvider.getNetwork();
    console.log(`✅ Network:`, network);
    
    // Step 3: Test simple blockchain read - COP token info
    console.log('\n3. Testing blockchain read operations...');
    const COP_CONTRACT = '0xD1E0A2c64e7a1Db0b7455587c2b382C756c38f6E';
    
    try {
      console.log(`📖 Reading COP token info from ${COP_CONTRACT}...`);
      
      // Test 1: Read token name
      const nameResult = await walletProvider.readContract({
        address: COP_CONTRACT,
        abi: [
          {
            "inputs": [],
            "name": "name",
            "outputs": [{"internalType": "string", "name": "", "type": "string"}],
            "stateMutability": "view",
            "type": "function"
          }
        ],
        functionName: "name"
      });
      
      console.log(`✅ Token name: ${nameResult}`);
      
      // Test 2: Read token symbol
      const symbolResult = await walletProvider.readContract({
        address: COP_CONTRACT,
        abi: [
          {
            "inputs": [],
            "name": "symbol", 
            "outputs": [{"internalType": "string", "name": "", "type": "string"}],
            "stateMutability": "view",
            "type": "function"
          }
        ],
        functionName: "symbol"
      });
      
      console.log(`✅ Token symbol: ${symbolResult}`);
      
      // Test 3: Read total supply
      const totalSupplyResult = await walletProvider.readContract({
        address: COP_CONTRACT,
        abi: [
          {
            "inputs": [],
            "name": "totalSupply",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
          }
        ],
        functionName: "totalSupply"
      });
      
      console.log(`✅ Total supply: ${totalSupplyResult.toString()}`);
      
      // Test 4: Read user balance
      const balanceResult = await walletProvider.readContract({
        address: COP_CONTRACT,
        abi: [
          {
            "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
            "name": "balanceOfCOP",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
          }
        ],
        functionName: "balanceOfCOP",
        args: [address]
      });
      
      console.log(`✅ User COP balance: ${balanceResult.toString()}`);
      
    } catch (readError) {
      console.log('❌ Blockchain read failed:', readError.message);
      console.log('   Full error:', readError);
    }
    
    // Step 4: Test transaction preparation (don't send yet)
    console.log('\n4. Testing transaction preparation...');
    
    try {
      const { encodeFunctionData } = require('viem');
      
      const mintCallData = encodeFunctionData({
        abi: [
          {
            "inputs": [{"internalType": "uint256", "name": "copAmount", "type": "uint256"}],
            "name": "mintCOPToSelf",
            "outputs": [],
            "stateMutability": "nonpayable", 
            "type": "function"
          }
        ],
        functionName: "mintCOPToSelf",
        args: [BigInt(1000000)]
      });
      
      console.log(`✅ Transaction data prepared: ${mintCallData.substring(0, 20)}...`);
      console.log(`✅ Function signature: ${mintCallData.substring(0, 10)}`);
      
    } catch (encodeError) {
      console.log('❌ Transaction encoding failed:', encodeError.message);
    }
    
    console.log('\n🎉 Blockchain debug completed!');
    console.log('\nSummary:');
    console.log('- Wallet provider initialization: ✅');
    console.log('- Network connectivity: Check read operations above');
    console.log('- Contract interaction: Check read results above');
    console.log('- Transaction preparation: Check encoding above');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    console.error('Stack:', error.stack);
  }
  
  process.exit(0);
}

// Run the debug
debugBlockchainInteractions();