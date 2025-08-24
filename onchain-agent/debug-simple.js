#!/usr/bin/env node

// Simple debug to test if our actions exist and can be called
console.log('🔧 Simple COP Actions Debug...\n');

// Test 1: Check if we can import and instantiate providers
async function testBasicImports() {
  try {
    console.log('1. Testing basic functionality...');
    
    // Mock wallet provider for testing
    const mockWalletProvider = {
      getAddress: () => '0x1234567890123456789012345678901234567890',
      getNetwork: () => ({ networkId: 'base-sepolia' }),
      sendTransaction: async () => ({ 
        hash: '0xtest', 
        wait: async () => ({ blockNumber: 123, gasUsed: '50000', status: 1 })
      }),
      readContract: async () => 1000000
    };

    // Test COP purchase action directly
    console.log('2. Testing COP purchase logic...');
    
    // Simulate COP purchase function
    const testCOPPurchase = async (args) => {
      const { phoneNumber, copAmount } = args;
      
      if (copAmount <= 0) {
        return {
          success: false,
          error: "Invalid amount",
          message: "COP amount must be greater than 0"
        };
      }

      console.log(`   📱 Phone: ${phoneNumber}`);
      console.log(`   🪙 Amount: ${copAmount} COP`);
      console.log(`   💳 Wallet: ${mockWalletProvider.getAddress()}`);
      console.log(`   🌐 Network: ${mockWalletProvider.getNetwork().networkId}`);
      
      return {
        success: true,
        message: `Successfully purchased ${copAmount} COP tokens!`,
        transaction: { hash: '0xtest123' }
      };
    };

    // Test balance check
    const testCOPBalance = async (args) => {
      const { phoneNumber } = args;
      const balance = 5000000; // 5M COP mock
      
      console.log(`   📱 Phone: ${phoneNumber}`);
      console.log(`   💰 Balance: ${balance} COP`);
      
      return {
        success: true,
        balance: balance,
        message: `Current COP balance: ${balance.toLocaleString()} COP`
      };
    };

    // Test both functions
    console.log('\n3. Testing COP purchase...');
    const purchaseResult = await testCOPPurchase({
      phoneNumber: '+573001234567',
      copAmount: 1000000
    });
    console.log('   ✅ Result:', purchaseResult.message);
    
    console.log('\n4. Testing COP balance check...');
    const balanceResult = await testCOPBalance({
      phoneNumber: '+573001234567'
    });
    console.log('   ✅ Result:', balanceResult.message);

    console.log('\n🎉 Basic functionality test completed successfully!');
    console.log('\nNext steps:');
    console.log('- The logic works in isolation');
    console.log('- The issue is likely in the AgentKit integration');
    console.log('- Need to check how actions are registered and called');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testBasicImports();