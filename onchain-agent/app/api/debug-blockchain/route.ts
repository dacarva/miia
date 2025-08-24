import { NextResponse } from "next/server";
import { prepareAgentkitAndWalletProvider } from "../agent/prepare-agentkit";
import { encodeFunctionData, Address } from "viem";

export async function GET() {
  // Skip execution during build/deployment
  if (process.env.NODE_ENV === 'production' && process.env.SKIP_TESTS === 'true') {
    return NextResponse.json({
      success: true,
      message: "Debug endpoint disabled during deployment",
      skipped: true
    });
  }
  try {
    console.log('🔗 Starting blockchain debug...');
    
    // Step 1: Initialize wallet provider
    console.log('1. Setting up wallet provider...');
    const { agentkit, walletProvider, walletData } = await prepareAgentkitAndWalletProvider('+573001234567', false);
    
    const results = {
      step1_wallet_setup: {
        wallet_address: walletData.smartWalletAddress,
        network: walletProvider.getNetwork(),
        status: "✅ Success"
      },
      step2_wallet_methods: {
        available_methods: Object.getOwnPropertyNames(Object.getPrototypeOf(walletProvider)),
        address: walletProvider.getAddress(),
        status: "✅ Success"
      },
      step3_blockchain_reads: {},
      step4_transaction_prep: {}
    };
    
    console.log(`✅ Wallet: ${walletData.smartWalletAddress}`);
    console.log(`✅ Network: ${walletProvider.getNetwork().networkId}`);
    
    // Step 2: Test blockchain reads
    console.log('2. Testing blockchain read operations...');
    const COP_CONTRACT = '0xD1E0A2c64e7a1Db0b7455587c2b382C756c38f6E';
    
    try {
      // Test simple contract read - token name
      console.log('   Reading token name...');
      const nameResult = await walletProvider.readContract({
        address: COP_CONTRACT as Address,
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
      
      results.step3_blockchain_reads.token_name = nameResult;
      console.log(`✅ Token name: ${nameResult}`);
      
      // Test balance read
      console.log('   Reading user balance...');
      const balanceResult = await walletProvider.readContract({
        address: COP_CONTRACT as Address,
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
        args: [walletData.smartWalletAddress as Address]
      });
      
      results.step3_blockchain_reads.user_balance = balanceResult.toString();
      results.step3_blockchain_reads.status = "✅ Success";
      console.log(`✅ User balance: ${balanceResult.toString()}`);
      
    } catch (readError) {
      console.log('❌ Blockchain read failed:', readError.message);
      results.step3_blockchain_reads.error = readError.message;
      results.step3_blockchain_reads.status = "❌ Failed";
    }
    
    // Step 3: Test transaction preparation
    console.log('3. Testing transaction preparation...');
    try {
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
      
      results.step4_transaction_prep.call_data = mintCallData;
      results.step4_transaction_prep.function_signature = mintCallData.substring(0, 10);
      results.step4_transaction_prep.status = "✅ Success";
      console.log(`✅ Transaction prepared: ${mintCallData.substring(0, 20)}...`);
      
    } catch (encodeError) {
      console.log('❌ Transaction encoding failed:', encodeError.message);
      results.step4_transaction_prep.error = encodeError.message;
      results.step4_transaction_prep.status = "❌ Failed";
    }
    
    // Step 4: Try a simple transaction (very small amount)
    console.log('4. Testing simple transaction execution...');
    try {
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
        args: [BigInt(100)] // Very small amount for testing
      });
      
      console.log('   Executing test mint transaction...');
      const transaction = await walletProvider.sendTransaction({
        to: COP_CONTRACT as Address,
        data: mintCallData,
        value: 0
      });
      
      console.log(`   Transaction sent: ${transaction.hash}`);
      console.log('   Available transaction methods:', Object.getOwnPropertyNames(transaction));
      
      // Try different ways to get receipt
      let receipt = null;
      try {
        if (transaction.wait) {
          console.log('   Using transaction.wait()...');
          receipt = await transaction.wait();
        } else if (walletProvider.waitForTransactionReceipt) {
          console.log('   Using walletProvider.waitForTransactionReceipt()...');
          receipt = await walletProvider.waitForTransactionReceipt(transaction.hash);
        } else {
          console.log('   No wait method available, using transaction object directly...');
        }
      } catch (waitError) {
        console.log(`   Wait method failed: ${waitError.message}`);
      }
      
      results.test_transaction = {
        hash: transaction.hash,
        transaction_methods: Object.getOwnPropertyNames(transaction),
        block_number: receipt?.blockNumber || "pending",
        gas_used: receipt?.gasUsed?.toString() || "unknown",
        status: receipt?.status === 1 ? "✅ Success" : transaction.hash ? "✅ Sent (pending)" : "❌ Failed"
      };
      
      console.log(`✅ Transaction successful: ${transaction.hash}`);
      
    } catch (txError) {
      console.log('❌ Transaction failed:', txError.message);
      results.test_transaction = {
        error: txError.message,
        status: "❌ Failed"
      };
    }
    
    console.log('🎉 Blockchain debug completed!');
    
    return NextResponse.json({
      success: true,
      message: "Blockchain debug completed",
      results
    });
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}