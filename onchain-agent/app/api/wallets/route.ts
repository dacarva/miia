import { NextResponse } from "next/server";
import { listWallets, getWallet, deleteWallet } from "../agent/prepare-agentkit";

/**
 * Handles GET requests to list all wallets or get a specific wallet
 * 
 * @function GET
 * @param {Request} req - The incoming request object
 * @returns {Promise<NextResponse>} JSON response containing wallet data
 */
export async function GET(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const phoneNumber = searchParams.get('phoneNumber');

    if (phoneNumber) {
      // Get specific wallet
      const wallet = await getWallet(phoneNumber);
      if (!wallet) {
        return NextResponse.json(
          { error: `Wallet not found for phone number: ${phoneNumber}` },
          { status: 404 }
        );
      }
      
      // Don't return the private key for security
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { privateKey, ...safeWalletData } = wallet;
      return NextResponse.json({ wallet: safeWalletData });
    } else {
      // List all wallets
      const wallets = await listWallets();
      
      // Don't return private keys for security
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const safeWallets = wallets.map(({ privateKey, ...safeWalletData }) => safeWalletData);
      
      return NextResponse.json({ wallets: safeWallets });
    }
  } catch (error) {
    console.error("Error handling wallet request:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to process wallet request"
    }, { status: 500 });
  }
}

/**
 * Handles DELETE requests to delete a specific wallet
 * 
 * @function DELETE
 * @param {Request} req - The incoming request object
 * @returns {Promise<NextResponse>} JSON response indicating success or failure
 */
export async function DELETE(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const phoneNumber = searchParams.get('phoneNumber');

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "phoneNumber parameter is required" },
        { status: 400 }
      );
    }

    const success = await deleteWallet(phoneNumber);
    
    if (success) {
      return NextResponse.json({ message: `Wallet for ${phoneNumber} deleted successfully` });
    } else {
      return NextResponse.json(
        { error: `Wallet not found for phone number: ${phoneNumber}` },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error deleting wallet:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to delete wallet"
    }, { status: 500 });
  }
}
