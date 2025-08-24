import { NextResponse } from "next/server";
import { prepareAgentkitAndWalletProvider } from "../agent/prepare-agentkit";
import { tokenActionProvider } from "../agent/token-action-provider";
import { TokenPurchaseParams } from "../agent/token-action-provider";
import { Address } from "viem";

export async function GET() {
  try {
    console.log("--- Starting Property Purchase Test ---");

    // 1. Prepare Wallet and Action Provider
    const phoneNumber = "+573001234567"; // Using a consistent test user
    const { walletProvider } = await prepareAgentkitAndWalletProvider(phoneNumber);
    const provider = tokenActionProvider();

    // 2. Check COP balance first
    console.log("2. Checking COP balance before property purchase...");
    const actions = provider.getActions();
    const balanceAction = actions.find(a => a.name === 'check_cop_balance');
    
    let balanceResult = null;
    if (balanceAction) {
      try {
        balanceResult = await balanceAction.func({ phoneNumber }, walletProvider);
        console.log("COP Balance check result:", balanceResult);
      } catch (balanceError) {
        console.error("Balance check failed:", balanceError);
      }
    }

    // 2.5. Check property info
    console.log("2.5. Checking property info...");
    const propertyInfoAction = actions.find(a => a.name === 'get_property_token_info');
    
    let propertyInfoResult = null;
    if (propertyInfoAction) {
      try {
        propertyInfoResult = await propertyInfoAction.func({ propertyId: "MIIA001" });
        console.log("Property info result:", propertyInfoResult);
      } catch (propertyError) {
        console.error("Property info check failed:", propertyError);
      }
    }

    // 2.6. Check if property token contract has COP token address set
    console.log("2.6. Checking property token contract COP address...");
    let copAddressResult = null;
    try {
      const result = await (walletProvider as any).readContract({
        address: "0x05C9d708CcAa1296247E04312b199Fd285de1aA0" as Address, // MIIA001 property token address (updated)
        abi: [{"inputs":[],"name":"colombianCOP","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}],
        functionName: "colombianCOP",
        args: []
      });
      
      copAddressResult = {
        contract_address: "0x05C9d708CcAa1296247E04312b199Fd285de1aA0",
        cop_token_address: result,
        is_set: result !== "0x0000000000000000000000000000000000000000"
      };
      console.log("COP address check result:", copAddressResult);
    } catch (copError: unknown) {
      const errorMessage = copError instanceof Error ? copError.message : String(copError);
      console.error("COP address check failed:", errorMessage);
      copAddressResult = { error: errorMessage };
    }

    // 3. Define Test Parameters
    const testParams: TokenPurchaseParams = {
      propertyId: "MIIA001",
      tokenAmount: 1, // Purchase a single token for the test
      phoneNumber: phoneNumber,
    };

    console.log(`   Wallet Address: ${walletProvider.getAddress()}`);
    console.log(`   Attempting to purchase ${testParams.tokenAmount} token(s) of ${testParams.propertyId}`);

    // 4. Get the specific action from the provider
    const purchaseAction = actions.find(a => a.name === 'purchase_property_tokens');

    if (!purchaseAction) {
      throw new Error("'purchase_property_tokens' action not found.");
    }

    console.log(`   Executing '${purchaseAction.name}' action...`);

    // 5. Execute the action's function with walletProvider
    console.log("   About to execute property purchase...");
    console.log("   Test params:", testParams);
    console.log("   Wallet address:", walletProvider.getAddress());
    
    const result = await purchaseAction.func(testParams, walletProvider);
    
    console.log("   Property purchase result:", result);

    console.log("--- Test Finished ---");

    return NextResponse.json({
      success: true,
      message: "Property purchase test completed",
      balance_check: balanceResult,
      property_info: propertyInfoResult,
      results: result,
      explorer_link: result.transaction ? `https://sepolia.basescan.org/tx/${result.transaction.hash}` : "N/A",
      cop_address_check: copAddressResult,
    });

  } catch (error) {
    console.error("Error during property purchase test:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred.",
      },
      { status: 500 }
    );
  }
}
