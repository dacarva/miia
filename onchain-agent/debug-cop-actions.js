#!/usr/bin/env node

// Debug script to test COP actions directly without LLM prompts
const { prepareAgentkitAndWalletProvider } = require('./app/api/agent/prepare-agentkit.ts');

async function debugCOPActions() {
  try {
    console.log('🔧 Debugging COP Actions...\n');

    // Initialize wallet provider like the agent does
    console.log('1. Setting up wallet provider...');
    const { agentkit, walletProvider, walletData } = await prepareAgentkitAndWalletProvider('+573001234567', false);
    
    console.log(`✅ Wallet created: ${walletData.smartWalletAddress}`);
    console.log(`✅ Network: ${walletProvider.getNetwork().networkId}`);
    console.log('');

    // Test importing our token action provider
    console.log('2. Testing tokenActionProvider import...');
    const { tokenActionProvider } = require('./app/api/agent/token-action-provider.ts');
    const tokenProvider = tokenActionProvider(walletProvider);
    console.log('✅ Token provider created');
    console.log('');

    // Test getting actions
    console.log('3. Testing getActions()...');
    const actions = tokenProvider.getActions();
    console.log(`✅ Found ${actions.length} actions:`);
    actions.forEach(action => {
      console.log(`   - ${action.name}: ${action.description}`);
    });
    console.log('');

    // Test purchase_cop_tokens action
    console.log('4. Testing purchase_cop_tokens action...');
    const purchaseAction = actions.find(a => a.name === 'purchase_cop_tokens');
    if (purchaseAction) {
      console.log('✅ purchase_cop_tokens action found');
      
      try {
        console.log('   Executing purchase_cop_tokens with 1000000 COP...');
        const result = await purchaseAction.func({
          phoneNumber: '+573001234567',
          copAmount: 1000000
        });
        
        console.log('✅ Action executed successfully!');
        console.log('   Result:', JSON.stringify(result, null, 2));
        
      } catch (error) {
        console.log('❌ Action execution failed:');
        console.log('   Error:', error.message);
        console.log('   Stack:', error.stack);
      }
    } else {
      console.log('❌ purchase_cop_tokens action not found');
    }
    console.log('');

    // Test check_cop_balance action
    console.log('5. Testing check_cop_balance action...');
    const balanceAction = actions.find(a => a.name === 'check_cop_balance');
    if (balanceAction) {
      console.log('✅ check_cop_balance action found');
      
      try {
        console.log('   Executing check_cop_balance...');
        const result = await balanceAction.func({
          phoneNumber: '+573001234567'
        });
        
        console.log('✅ Action executed successfully!');
        console.log('   Result:', JSON.stringify(result, null, 2));
        
      } catch (error) {
        console.log('❌ Action execution failed:');
        console.log('   Error:', error.message);
        console.log('   Stack:', error.stack);
      }
    } else {
      console.log('❌ check_cop_balance action not found');
    }

  } catch (error) {
    console.error('❌ Debug script failed:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the debug
debugCOPActions();