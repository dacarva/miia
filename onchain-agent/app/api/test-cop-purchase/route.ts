import { NextResponse } from "next/server";
import { prepareAgentkitAndWalletProvider } from "../agent/prepare-agentkit";

export async function GET() {
  try {
    console.log('🪙 Testing COP Token Purchase...');
    
    // Step 1: Initialize AgentKit and wallet provider
    console.log('1. Setting up AgentKit and wallet provider...');
    const { agentkit, walletProvider, walletData } = await prepareAgentkitAndWalletProvider('+573001234567', false);
    
    const results = {
      step1_setup: {
        wallet_address: walletData.smartWalletAddress,
        network: walletProvider.getNetwork(),
        status: "✅ Success"
      },
      step2_actions: {},
      step3_balance_before: {},
      step4_purchase: {},
      step5_balance_after: {}
    };
    
    console.log(`✅ Wallet: ${walletData.smartWalletAddress}`);
    console.log(`✅ Network: ${walletProvider.getNetwork().networkId}`);
    
    // Step 2: Get available AgentKit actions
    console.log('2. Getting available AgentKit actions...');
    const actions = agentkit.getActions();
    const copActions = actions.filter(action => action.name.includes('cop') || action.name.includes('COP'));
    
    results.step2_actions = {
      total_actions: actions.length,
      cop_actions: copActions.map(a => a.name),
      all_actions: actions.map(a => a.name),
      status: "✅ Success"
    };
    
    console.log(`✅ Found ${actions.length} actions, ${copActions.length} COP-related`);
    
    // Find the actions we need
    const purchaseAction = actions.find(action => action.name === 'purchase_cop_tokens');
    const balanceAction = actions.find(action => action.name === 'check_cop_balance');
    
    if (!purchaseAction) {
      results.step2_actions.error = "purchase_cop_tokens action not found";
      results.step2_actions.status = "❌ Failed";
    }
    
    // Step 3: Check current COP balance
    console.log('3. Checking current COP balance...');
    if (balanceAction) {
      try {
        const balanceResult = await balanceAction.func({ phoneNumber: '+573001234567' });
        results.step3_balance_before = {
          result: balanceResult,
          status: "✅ Success"
        };
        console.log('✅ Current balance checked');
      } catch (balanceError) {
        results.step3_balance_before = {
          error: balanceError.message,
          status: "❌ Failed"
        };
        console.log('❌ Balance check failed:', balanceError.message);
      }
    } else {
      results.step3_balance_before = {
        error: "check_cop_balance action not found",
        status: "❌ Failed"
      };
    }
    
    // Step 4: Test COP token purchase
    console.log('4. Testing COP token purchase...');
    if (purchaseAction) {
      const purchaseAmount = 100000; // 100,000 COP tokens
      
      try {
        console.log(`   Purchasing ${purchaseAmount} COP tokens...`);
        const purchaseResult = await purchaseAction.func({
          phoneNumber: '+573001234567',
          copAmount: purchaseAmount
        });
        
        results.step4_purchase = {
          amount: purchaseAmount,
          result: purchaseResult,
          transaction_hash: purchaseResult?.transaction?.hash || "No hash available",
          status: purchaseResult?.success ? "✅ Success" : "❌ Failed"
        };
        
        console.log('✅ Purchase completed:', purchaseResult?.success ? "Success" : "Failed");
        
        if (purchaseResult?.transaction?.hash) {
          console.log(`🔗 Transaction hash: ${purchaseResult.transaction.hash}`);
        }
        
      } catch (purchaseError) {
        results.step4_purchase = {
          amount: purchaseAmount,
          error: purchaseError.message,
          status: "❌ Failed"
        };
        console.log('❌ Purchase failed:', purchaseError.message);
      }
    } else {
      results.step4_purchase = {
        error: "purchase_cop_tokens action not available",
        status: "❌ Failed"
      };
    }
    
    // Step 5: Check balance after purchase
    console.log('5. Checking balance after purchase...');
    if (balanceAction) {
      try {
        const newBalanceResult = await balanceAction.func({ phoneNumber: '+573001234567' });
        results.step5_balance_after = {
          result: newBalanceResult,
          status: "✅ Success"
        };
        console.log('✅ New balance checked');
      } catch (balanceError) {
        results.step5_balance_after = {
          error: balanceError.message,
          status: "❌ Failed"
        };
        console.log('❌ New balance check failed:', balanceError.message);
      }
    } else {
      results.step5_balance_after = {
        error: "check_cop_balance action not found",
        status: "❌ Failed"
      };
    }
    
    console.log('🎉 COP purchase test completed!');
    
    // Add explorer link if we have a transaction hash
    if (results.step4_purchase.transaction_hash && results.step4_purchase.transaction_hash !== "No hash available") {
      results.explorer_link = `https://sepolia.basescan.org/tx/${results.step4_purchase.transaction_hash}`;
    }
    
    return NextResponse.json({
      success: true,
      message: "COP purchase test completed",
      results
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}