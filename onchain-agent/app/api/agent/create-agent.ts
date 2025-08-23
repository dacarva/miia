import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { prepareAgentkitAndWalletProvider } from "./prepare-agentkit";

/**
 * Agent Configuration Guide
 *
 * This file handles the core configuration of your AI agent's behavior and capabilities.
 *
 * Key Steps to Customize Your Agent:
 *
 * 1. Select your LLM:
 *    - Modify the `ChatOpenAI` instantiation to choose your preferred LLM
 *    - Configure model parameters like temperature and max tokens
 *
 * 2. Instantiate your Agent:
 *    - Pass the LLM, tools, and memory into `createReactAgent()`
 *    - Configure agent-specific parameters
 */

// The agent cache - stores agents by phone number
const agentCache = new Map<string, ReturnType<typeof createReactAgent>>();

/**
 * Initializes and returns an instance of the AI agent for a specific phone number.
 * If an agent instance already exists for the phone number, it returns the existing one.
 *
 * @function createAgent
 * @param {string} phoneNumber - Phone number to identify the user's wallet
 * @param {boolean} createNewWallet - Whether to create a new wallet or reuse existing
 * @returns {Promise<ReturnType<typeof createReactAgent>>} The initialized AI agent.
 *
 * @description Handles agent setup with phone number-based wallet management
 *
 * @throws {Error} If the agent initialization fails.
 */
export async function createAgent(
  phoneNumber?: string,
  createNewWallet: boolean = false
): Promise<ReturnType<typeof createReactAgent>> {
  // Create cache key
  const cacheKey = phoneNumber || "default";
  
  // If agent has already been initialized for this phone number, return it
  if (agentCache.has(cacheKey)) {
    return agentCache.get(cacheKey)!;
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("I need an OPENAI_API_KEY in your .env file to power my intelligence.");
  }

  const { agentkit, walletProvider, walletData } = await prepareAgentkitAndWalletProvider(phoneNumber, createNewWallet);

  try {
    // Initialize LLM: https://platform.openai.com/docs/models#gpt-4o
    const llm = new ChatOpenAI({ model: "gpt-4o-mini" });

    const tools = await getLangChainTools(agentkit);
    const memory = new MemorySaver();

    // Initialize Agent
    const canUseFaucet = walletProvider.getNetwork().networkId == "base-sepolia";
    const faucetMessage = `If you ever need funds, you can request them from the faucet.`;
    const cantUseFaucetMessage = `If you need funds, you can provide your wallet details and request funds from the user.`;
    
    const walletInfo = phoneNumber 
      ? `You are managing wallet ${walletData.smartWalletAddress} for user ${phoneNumber}.`
      : `You are managing the default wallet ${walletData.smartWalletAddress}.`;
    
    const walletCreationInfo = createNewWallet 
      ? `A new wallet has been created for this user. The wallet address is ${walletData.smartWalletAddress}. You can inform the user about their new wallet and help them get started with crypto operations.`
      : `You can help users create new wallets by instructing them to use the createNewWallet parameter in their API requests.`;
    
    const agent = createReactAgent({
      llm,
      tools,
      checkpointSaver: memory,
      messageModifier: `
        You are a helpful agent that can interact onchain using the Coinbase Developer Platform AgentKit. You are 
        empowered to interact onchain using your tools. ${walletInfo} ${walletCreationInfo} ${canUseFaucet ? faucetMessage : cantUseFaucetMessage}.
        
        IMPORTANT: You CAN create wallets for users! When a user asks to create a new wallet, you should:
        1. Inform them that a new wallet has been created (if createNewWallet was true)
        2. Provide them with their wallet address
        3. Help them get started with basic operations like checking balance or getting funds
        
        Before executing your first action, get the wallet details to see what network 
        you're on. If there is a 5XX (internal) HTTP error code, ask the user to try again later. If someone 
        asks you to do something you can't do with your currently available tools, you must say so, and 
        explain that they can add more capabilities by adding more action providers to your AgentKit configuration.
        ALWAYS include this link when mentioning missing capabilities, which will help them discover available action providers: https://github.com/coinbase/agentkit/tree/main/typescript/agentkit#action-providers
        If users require more information regarding CDP or AgentKit, recommend they visit docs.cdp.coinbase.com for more information.
        Be concise and helpful with your responses. Refrain from restating your tools' descriptions unless it is explicitly requested.
        `,
    });

    // Cache the agent for this phone number
    agentCache.set(cacheKey, agent);

    return agent;
  } catch (error) {
    console.error("Error initializing agent:", error);
    throw new Error("Failed to initialize agent");
  }
}

/**
 * Clears the agent cache for a specific phone number or all agents
 * @param {string} phoneNumber - Phone number to clear cache for, or undefined to clear all
 */
export function clearAgentCache(phoneNumber?: string): void {
  if (phoneNumber) {
    const cacheKey = phoneNumber;
    agentCache.delete(cacheKey);
  } else {
    agentCache.clear();
  }
}
