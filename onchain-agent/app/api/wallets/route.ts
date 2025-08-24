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
      // Handle URL encoding - the + gets converted to space, so we need to restore it
      let decodedPhoneNumber = phoneNumber.trim();
      
      // If the phone number starts with a space and then digits, it's likely a + that got converted
      if (decodedPhoneNumber.startsWith(' ') && /^\s\d+$/.test(decodedPhoneNumber)) {
        decodedPhoneNumber = '+' + decodedPhoneNumber.trim();
      }
      
      // If the phone number doesn't start with + but is all digits, add the +
      if (!decodedPhoneNumber.startsWith('+') && /^\d+$/.test(decodedPhoneNumber)) {
        decodedPhoneNumber = '+' + decodedPhoneNumber;
      }
      
      console.log(`Original phone number: "${phoneNumber}"`);
      console.log(`Processed phone number: "${decodedPhoneNumber}"`);
      
      // Get specific wallet
      const wallet = await getWallet(decodedPhoneNumber);
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

    // Handle URL encoding - the + gets converted to space, so we need to restore it
    let decodedPhoneNumber = phoneNumber.trim();
    
    // If the phone number starts with a space and then digits, it's likely a + that got converted
    if (decodedPhoneNumber.startsWith(' ') && /^\s\d+$/.test(decodedPhoneNumber)) {
      decodedPhoneNumber = '+' + decodedPhoneNumber.trim();
    }
    
    // If the phone number doesn't start with + but is all digits, add the +
    if (!decodedPhoneNumber.startsWith('+') && /^\d+$/.test(decodedPhoneNumber)) {
      decodedPhoneNumber = '+' + decodedPhoneNumber;
    }
    
    console.log(`DELETE - Original phone number: "${phoneNumber}"`);
    console.log(`DELETE - Processed phone number: "${decodedPhoneNumber}"`);

    const success = await deleteWallet(decodedPhoneNumber);
    
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
