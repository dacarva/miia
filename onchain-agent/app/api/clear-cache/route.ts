import { NextResponse } from "next/server";
import { clearAgentCache } from "../agent/create-agent";

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const { phoneNumber } = await req.json();
    
    if (phoneNumber) {
      clearAgentCache(phoneNumber);
      return NextResponse.json({ 
        success: true, 
        message: `Agent cache cleared for phone number: ${phoneNumber}` 
      });
    } else {
      clearAgentCache(); // Clear all cache
      return NextResponse.json({ 
        success: true, 
        message: "All agent cache cleared" 
      });
    }
  } catch (error) {
    console.error("Error clearing cache:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
