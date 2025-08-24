import { NextResponse } from "next/server";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { prepareAgentkitAndWalletProvider } from "../agent/prepare-agentkit";

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const { phoneNumber, toolName, toolArgs } = await req.json();
    
    // Get AgentKit instance
    const { agentkit, walletProvider, walletData } = await prepareAgentkitAndWalletProvider(phoneNumber, false);
    
    // Get LangChain tools
    const langchainTools = await getLangChainTools(agentkit);
    
    // Find the specific tool
    const tool = langchainTools.find(t => t.name === toolName);
    
    if (!tool) {
      return NextResponse.json({
        success: false,
        error: `Tool '${toolName}' not found`,
        availableTools: langchainTools.map(t => t.name)
      });
    }
    
    // Test different methods of calling the tool
    const results = {
      invoke: null,
      call: null,
      func: null
    };
    
    // Test invoke method
    try {
      results.invoke = await tool.invoke(toolArgs);
    } catch (error) {
      results.invoke = { error: error instanceof Error ? error.message : 'Unknown error' };
    }
    
    // Test call method
    try {
      results.call = await tool.call(toolArgs);
    } catch (error) {
      results.call = { error: error instanceof Error ? error.message : 'Unknown error' };
    }
    
    // Test func method (if available)
    try {
      if ((tool as any).func) {
        results.func = await (tool as any).func(toolArgs, walletProvider);
      } else {
        results.func = { error: 'func method not available' };
      }
    } catch (error) {
      results.func = { error: error instanceof Error ? error.message : 'Unknown error' };
    }
    
    return NextResponse.json({
      success: true,
      toolName,
      toolArgs,
      results,
      toolInfo: {
        name: tool.name,
        description: tool.description,
        hasInvoke: typeof tool.invoke === 'function',
        hasCall: typeof tool.call === 'function',
        hasFunc: typeof (tool as any).func === 'function',
        toolType: tool.constructor.name,
        toolKeys: Object.keys(tool)
      }
    });
    
  } catch (error) {
    console.error("Error testing LangChain tool:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
