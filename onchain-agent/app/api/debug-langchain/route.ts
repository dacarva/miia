import { NextResponse } from "next/server";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { prepareAgentkitAndWalletProvider } from "../agent/prepare-agentkit";

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const { phoneNumber } = await req.json();
    
    // Get AgentKit instance
    const { agentkit, walletProvider, walletData } = await prepareAgentkitAndWalletProvider(phoneNumber, false);
    
    // Test AgentKit actions directly
    const agentkitActions = agentkit.getActions();
    console.log("AgentKit Actions:", agentkitActions.map(a => a.name));
    
    // Test LangChain tools conversion
    const langchainTools = await getLangChainTools(agentkit);
    console.log("LangChain Tools:", langchainTools.map(t => t.name));
    
    // Test a specific tool
    const copBalanceTool = langchainTools.find(t => t.name === "check_cop_balance");
    const purchaseCopTool = langchainTools.find(t => t.name === "purchase_cop_tokens");
    
    let toolTestResults = {
      copBalanceTool: {
        found: !!copBalanceTool,
        hasInvoke: copBalanceTool ? typeof copBalanceTool.invoke === 'function' : false,
        hasCall: copBalanceTool ? typeof copBalanceTool.call === 'function' : false,
        hasFunc: copBalanceTool ? typeof (copBalanceTool as any).func === 'function' : false,
      },
      purchaseCopTool: {
        found: !!purchaseCopTool,
        hasInvoke: purchaseCopTool ? typeof purchaseCopTool.invoke === 'function' : false,
        hasCall: purchaseCopTool ? typeof purchaseCopTool.call === 'function' : false,
        hasFunc: purchaseCopTool ? typeof (purchaseCopTool as any).func === 'function' : false,
      }
    };
    
    // Test AgentKit action directly
    let agentkitTestResult = null;
    try {
      const balanceAction = agentkitActions.find(a => a.name === "check_cop_balance");
      if (balanceAction) {
        agentkitTestResult = await balanceAction.func({ phoneNumber }, walletProvider);
      }
    } catch (error) {
      agentkitTestResult = { error: error instanceof Error ? error.message : 'Unknown error' };
    }
    
    return NextResponse.json({
      success: true,
      debug: {
        walletAddress: walletData.smartWalletAddress,
        phoneNumber: phoneNumber,
        agentkitActionsCount: agentkitActions.length,
        langchainToolsCount: langchainTools.length,
        agentkitActionNames: agentkitActions.map(a => a.name),
        langchainToolNames: langchainTools.map(t => t.name),
        toolTestResults,
        agentkitTestResult,
        langchainToolDetails: langchainTools.map(t => ({
          name: t.name,
          description: t.description,
          hasInvoke: typeof t.invoke === 'function',
          hasCall: typeof t.call === 'function',
          hasFunc: typeof (t as any).func === 'function',
          schema: t.schema
        }))
      }
    });
    
  } catch (error) {
    console.error("Error debugging LangChain integration:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
