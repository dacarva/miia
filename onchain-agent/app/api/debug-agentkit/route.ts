import { NextResponse } from "next/server";
import { createAgent } from "../agent/create-agent";

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const { phoneNumber } = await req.json();
    
    // Get AgentKit instance
    const agent = await createAgent(phoneNumber, false);
    
    // Explore the agent object
    const agentInfo = {
      type: agent.constructor.name,
      prototype: Object.getPrototypeOf(agent).constructor.name,
      methods: Object.getOwnPropertyNames(Object.getPrototypeOf(agent))
        .filter(name => typeof agent[name as keyof typeof agent] === 'function'),
      properties: Object.getOwnPropertyNames(agent),
      keys: Object.keys(agent),
      hasStream: typeof agent.stream === 'function',
      hasInvoke: typeof agent.invoke === 'function',
      hasChat: typeof agent.chat === 'function',
      hasRun: typeof agent.run === 'function',
      hasCall: typeof agent.call === 'function',
      agentObject: agent
    };
    
    return NextResponse.json({
      success: true,
      agentInfo
    });
    
  } catch (error) {
    console.error("Error debugging AgentKit:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
