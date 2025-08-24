import { NextResponse } from "next/server";
import { prepareAgentkitAndWalletProvider } from "../agent/prepare-agentkit";
import { tokenActionProvider } from "../agent/token-action-provider";
import { TokenPurchaseParams, COPPurchaseParams } from "../agent/token-action-provider";

export async function GET(request: Request) {
  // Skip execution during build/deployment
  if (process.env.NODE_ENV === 'production' && process.env.SKIP_TESTS === 'true') {
    return NextResponse.json({
      success: true,
      message: "Test endpoint disabled during deployment",
      skipped: true
    });
  }
  try {
    console.log("--- Starting Full Property Purchase Flow Test ---");

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get('phoneNumber') || "+573001234567";
    const propertyId = searchParams.get('propertyId') || "MIIA001";
    const tokenAmount = parseInt(searchParams.get('tokenAmount') || "1");
    const pricePerToken = parseInt(searchParams.get('pricePerToken') || "1"); // Updated default to match actual price
    const requiredCOP = tokenAmount * pricePerToken;

    console.log(`   Parameters: ${tokenAmount} tokens of ${propertyId} at ${pricePerToken} COP each = ${requiredCOP} COP total`);

    // 1. Prepare Wallet and Action Provider
    const { walletProvider } = await prepareAgentkitAndWalletProvider(phoneNumber);
    const provider = tokenActionProvider();
    const actions = provider.getActions(walletProvider);

    const purchaseCopAction = actions.find(a => a.name === 'purchase_cop_tokens');
    const purchasePropertyAction = actions.find(a => a.name === 'purchase_property_tokens');

    if (!purchaseCopAction || !purchasePropertyAction) {
      throw new Error("Required actions not found.");
    }

    // 2. Purchase COP tokens to ensure sufficient funds
    console.log(`   Purchasing ${requiredCOP} COP tokens...`);
    const copParams: COPPurchaseParams = { phoneNumber, copAmount: requiredCOP };
    const copResult = await purchaseCopAction.func(copParams, walletProvider);
    console.log("   COP Purchase Result:", copResult.message);

    if (!copResult.success || copResult.transaction?.status !== 'confirmed') {
      throw new Error("Failed to purchase COP tokens for the test.");
    }

    // Proactively check balance until it updates
    let currentBalance = 0;
    let attempts = 0;
    const maxAttempts = 10;
    const checkBalanceAction = actions.find(a => a.name === 'check_cop_balance');
    if (!checkBalanceAction) throw new Error("check_cop_balance action not found");

    while(currentBalance < requiredCOP && attempts < maxAttempts) {
      attempts++;
      console.log(`   Attempt ${attempts}: Checking balance...`);
      const balanceResult = await checkBalanceAction.func({ phoneNumber }, walletProvider);
      currentBalance = balanceResult.balance.copBalance;
      if (currentBalance >= requiredCOP) {
        console.log(`   Success! Balance updated to ${currentBalance} COP.`);
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds between checks
    }

    if (currentBalance < requiredCOP) {
      throw new Error(`Balance did not update after ${maxAttempts} attempts.`);
    }

    // 3. Execute the property token purchase
    console.log(`   Purchasing ${tokenAmount} token(s) of ${propertyId}...`);
    const propertyParams: TokenPurchaseParams = { propertyId, tokenAmount, phoneNumber };
    const propertyResult = await purchasePropertyAction.func(propertyParams, walletProvider);
    console.log("   Property Purchase Result:", propertyResult.message);

    console.log("--- Full Flow Test Finished ---");

    return NextResponse.json({
      success: true,
      message: "Full property purchase flow test completed",
      results: {
        copPurchase: copResult,
        propertyPurchase: propertyResult,
      },
      explorer_link: propertyResult.transaction ? `https://sepolia.basescan.org/tx/${propertyResult.transaction.hash}` : "N/A",
    });

  } catch (error) {
    console.error("Error during full purchase flow test:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred.",
      },
      { status: 500 }
    );
  }
}
