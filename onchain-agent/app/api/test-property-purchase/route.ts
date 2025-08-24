import { NextResponse } from "next/server";
import { prepareAgentkitAndWalletProvider } from "../agent/prepare-agentkit";
import { tokenActionProvider } from "../agent/token-action-provider";
import { TokenPurchaseParams } from "../agent/token-action-provider";

export async function GET() {
  try {
    console.log("--- Starting Property Purchase Test ---");

    // 1. Prepare Wallet and Action Provider
    const phoneNumber = "+573001234567"; // Using a consistent test user
    const { walletProvider } = await prepareAgentkitAndWalletProvider(phoneNumber);
    const provider = tokenActionProvider();

    // 2. Define Test Parameters
    const testParams: TokenPurchaseParams = {
      propertyId: "MIIA001",
      tokenAmount: 1, // Purchase a single token for the test
      phoneNumber: phoneNumber,
    };

    console.log(`   Wallet Address: ${walletProvider.getAddress()}`);
    console.log(`   Attempting to purchase ${testParams.tokenAmount} token(s) of ${testParams.propertyId}`);

    // 3. Get the specific action from the provider
    const actions = provider.getActions(walletProvider);
    const purchaseAction = actions.find(a => a.name === 'purchase_property_tokens');

    if (!purchaseAction) {
      throw new Error("'purchase_property_tokens' action not found.");
    }

    console.log(`   Executing '${purchaseAction.name}' action...`);

    // 4. Execute the action's function
    const result = await purchaseAction.func(testParams);

    console.log("--- Test Finished ---");

    return NextResponse.json({
      success: true,
      message: "Property purchase test completed",
      results: result,
      explorer_link: result.transaction ? `https://sepolia.basescan.org/tx/${result.transaction.hash}` : "N/A",
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
