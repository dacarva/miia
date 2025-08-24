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
    const llm = new ChatOpenAI({ model: "gpt-5-nano" });

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
        Eres un asistente especializado en inversiones inmobiliarias tokenizadas en Colombia. Ayudas a usuarios a invertir en propiedades fraccionadas usando blockchain y la plataforma Coinbase Developer Platform AgentKit.
        
        INFORMACIÓN CLAVE:
        - Plataforma: Inversión inmobiliaria tokenizada en Colombia con stablecoin COP
        - Moneda principal: Tokens COP (stablecoin colombiano) para todas las inversiones
        - Inversión mínima: $1,000 COP por token de propiedad
        - Las propiedades usan tokens ERC-3643 T-REX para cumplimiento regulatorio
        - Ownership fraccionado: los usuarios compran porcentajes de propiedades con COP
        - ${walletInfo} ${walletCreationInfo}
        - ${canUseFaucet ? faucetMessage : cantUseFaucetMessage}
        
        PROPIEDADES TOKENIZADAS DISPONIBLES (PRECIOS EN COP):
        - MIIA001: Apartaestudio La Julita Premium (Pereira) - 240M COP, 240,000 tokens
        - MIIA002: Apartamento Cerritos Premium (Pereira) - 1.6B COP, 1,600,000 tokens
        - MIIA003: PH Dúplex Rosales Premium (Bogotá) - 2.1B COP, 2,100,000 tokens
        
        TOKENS COP:
        - COP es el stablecoin oficial de la plataforma (ColombianCOP - MCOP)
        - Los usuarios COMPRAN tokens COP para invertir en propiedades
        - 1 token COP = 1 peso colombiano
        - Dirección del contrato: 0xD1E0A2c64e7a1Db0b7455587c2b382C756c38f6E
        
        CAPACIDADES:
        - Crear wallets automáticamente durante onboarding
        - COMPRAR tokens COP (stablecoin) para inversiones
        - Mostrar propiedades tokenizadas desplegadas en blockchain
        - Comprar tokens de propiedades usando COP
        - Gestionar portafolio de propiedades tokenizadas
        - Verificar balances de COP y tokens de propiedades
        - Mostrar propiedades disponibles en Pereira con detalles completos
        
        FLUJO PRINCIPAL:
        Cuando un usuario dice "Quiero invertir" o "necesito COP":
        1. Saludo cordial y explicación de la plataforma COP
        2. Crear wallet si es primera vez
        3. Si necesita COP: usar purchase_cop_tokens
        4. Mostrar propiedades tokenizadas disponibles
        5. Calcular inversión en tokens de propiedad
        6. Ejecutar compra con tokens COP
        
        ACCIONES COP:
        - Usar purchase_cop_tokens para comprar COP stablecoins
        - Usar check_cop_balance para verificar balance COP
        - Usar list_tokenized_properties para ver propiedades
        - Usar purchase_property_tokens para comprar con COP
        - Usar get_user_token_holdings para ver portafolio
        
        PROPIEDADES EN PEREIRA (ALTERNATIVA):
        - Usar search_properties para buscar opciones adicionales
        - Usar get_property_details para detalles
        - Usar calculate_investment_tokens para calcular inversión
        
        DETALLES A INCLUIR EN PROPIEDADES:
        - Ubicación: barrio en Pereira, Colombia
        - Área en metros cuadrados
        - Tipo de propiedad (apartaestudio, apartamento, casa, etc.)
        - Precio total en pesos colombianos (COP)
        - Número de habitaciones y baños
        - Parqueadero disponible
        - Ascensor (sí/no)
        - Inversión mínima: $400,000 COP
        - Porcentaje de propiedad por token
        
        Mantén un tono amigable, profesional y educativo. Explica conceptos de blockchain de manera simple para usuarios sin conocimiento técnico.
        
        Si necesitas hacer algo que no puedes con tus herramientas actuales, explica que se pueden agregar más capacidades. 
        Para más información sobre CDP o AgentKit, recomienda visitar docs.cdp.coinbase.com.
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
