#!/usr/bin/env node

// Test COP token purchase directly without LLM prompts
const { prepareAgentkitAndWalletProvider } = require('./app/api/agent/prepare-agentkit.ts');

async function testCOPPurchase() {
  console.log('🪙 Testing COP Token Purchase...\\n');

  try {
    // Step 1: Initialize wallet provider
    console.log('1. Setting up wallet provider...');
    const { agentkit, walletProvider, walletData } = await prepareAgentkitAndWalletProvider('+573001234567', false);
    
    console.log(`✅ Wallet: ${walletData.smartWalletAddress}`);
    console.log(`✅ Network: ${walletProvider.getNetwork().networkId}`);
    
    // Step 2: Get AgentKit actions
    console.log('\\n2. Getting available AgentKit actions...');
    const actions = agentkit.getActions();
    const copActions = actions.filter(action => action.name.includes('cop') || action.name.includes('COP'));
    console.log('Available COP actions:', copActions.map(a => a.name));
    
    // Find the purchase COP tokens action
    const purchaseAction = actions.find(action => action.name === 'purchase_cop_tokens');
    
    if (!purchaseAction) {
      console.log('❌ purchase_cop_tokens action not found');
      console.log('Available actions:', actions.map(a => a.name));
      return;
    }
    
    console.log('✅ Found purchase_cop_tokens action');
    
    // Step 3: Check current COP balance
    console.log('\\n3. Checking current COP balance...');
    const balanceAction = actions.find(action => action.name === 'check_cop_balance');
    
    if (balanceAction) {
      try {
        const balanceResult = await balanceAction.func({ phoneNumber: '+573001234567' });
        console.log('Current balance:', balanceResult);
      } catch (balanceError) {
        console.log('Balance check failed:', balanceError.message);
      }
    }
    
    // Step 4: Test COP token purchase
    console.log('\\n4. Testing COP token purchase...');
    const purchaseAmount = 100000; // 100,000 COP tokens
    
    try {
      console.log(`Purchasing ${purchaseAmount} COP tokens...`);
      const result = await purchaseAction.func({
        phoneNumber: '+573001234567',
        copAmount: purchaseAmount
      });
      
      console.log('\\n🎉 Purchase result:');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.transaction && result.transaction.hash) {
        console.log(`\\n🔗 Transaction hash: ${result.transaction.hash}`);
        console.log(`🌐 View on Base Sepolia explorer: https://sepolia.basescan.org/tx/${result.transaction.hash}`);
      }
      
    } catch (purchaseError) {
      console.log('❌ Purchase failed:', purchaseError.message);
      console.log('Full error:', purchaseError);
    }
    
    // Step 5: Check balance after purchase
    console.log('\\n5. Checking balance after purchase...');
    if (balanceAction) {
      try {
        const newBalanceResult = await balanceAction.func({ phoneNumber: '+573001234567' });
        console.log('New balance:', newBalanceResult);
      } catch (balanceError) {
        console.log('Balance check failed:', balanceError.message);
      }
    }
    
    console.log('\\n🎉 COP purchase test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
  }
  
  process.exit(0);
}

// Run the test
testCOPPurchase();