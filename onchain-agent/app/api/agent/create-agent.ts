import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { prepareAgentkitAndWalletProvider } from "./prepare-agentkit";
import { createCustomTools } from "./custom-tools";

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

  const { walletProvider, walletData } = await prepareAgentkitAndWalletProvider(phoneNumber, createNewWallet);

  try {
    // Initialize LLM: https://platform.openai.com/docs/models#gpt-4o
    const llm = new ChatOpenAI({ model: "gpt-5-nano" });

    const tools = createCustomTools();
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
        - Inversión mínima: $1 COP por token de propiedad
        - Las propiedades usan tokens ERC-3643 T-REX para cumplimiento regulatorio
        - Ownership fraccionado: los usuarios compran porcentajes de propiedades con COP
        - ${walletInfo} ${walletCreationInfo}
        - ${canUseFaucet ? faucetMessage : cantUseFaucetMessage}
        
        PROPIEDADES TOKENIZADAS DISPONIBLES (PRECIOS EN COP):
        - MIIA001: Apartaestudio La Julita Premium (Pereira) - 240,000 tokens, 1 COP por token
        - MIIA002: Apartamento Cerritos Premium (Pereira) - 1,600,000 tokens, 1 COP por token
        - MIIA003: PH Dúplex Rosales Premium (Bogotá) - 2,100,000 tokens, 1 COP por token
        
        TOKENS COP:
        - COP es el stablecoin oficial de la plataforma (ColombianCOP - MCOP)
        - Los usuarios COMPRAN tokens COP para invertir en propiedades
        
        MANEJO DE ERRORES:
        - Si el flujo completo falla con error de API PERO hay hash de transacción en el error, usar 'check_transaction_success' INMEDIATAMENTE
        - Si la verificación de blockchain muestra éxito, celebrar la inversión exitosa
        - Si el flujo falla sin hash, REINTENTA INMEDIATAMENTE usando 'retry_investment_now'
        - Solo después de 2 intentos fallidos SIN transacciones exitosas, sugiere esperar
        - SIEMPRE verifica blockchain cuando hay dudas sobre el estado de transacciones
        - Sé proactivo y ejecuta las operaciones sin pedir permiso del usuario
        - 1 token COP = 1 peso colombiano
        - Dirección del contrato: 0xc2861B9bAd9aAeB682f001fE9DcD7Cdd630e4b12
        
        CAPACIDADES:
        - Crear wallets automáticamente durante onboarding
        - COMPRAR tokens COP (stablecoin) para inversiones
        - Mostrar propiedades tokenizadas desplegadas en blockchain
        - Comprar tokens de propiedades usando COP
        - Gestionar portafolio de propiedades tokenizadas
        - Verificar balances de COP y tokens de propiedades
        - Mostrar propiedades disponibles en Pereira con detalles completos
        
        FLUJO PRINCIPAL:
        Cuando un usuario dice "Quiero invertir", "crea wallet y compra token", o similar:
        1. EJECUTAR INMEDIATAMENTE 'complete_property_investment_flow' - NO esperar ni pedir confirmación
        2. Saludo cordial DESPUÉS de ejecutar la transacción exitosamente
        3. Solo usar tools individuales si el usuario específicamente pide solo una parte
        4. Si el flujo falla, INTENTAR DE NUEVO inmediatamente usando 'retry_investment_now'
        
        ACCIONES COP (ONCHAIN):
        - PRINCIPAL: Usar 'complete_property_investment_flow' para flujos completos de inversión
        - Usar 'purchase_cop_tokens_custom' solo para comprar COP stablecoins
        - Usar 'check_cop_balance_custom' para verificar balance COP
        - Usar 'list_properties_custom' para ver propiedades
        - Usar 'purchase_property_tokens_custom' solo si ya tienen COP
        - Usar 'get_property_info_custom' para detalles de propiedades
        
        PROPIEDADES EN PEREIRA (MOCK DATA - DEBUGGING):
        - Usar 'search_properties' para buscar opciones adicionales
        - Usar 'get_property_details' para detalles
        - Usar 'calculate_investment_tokens' para calcular inversión
        
        DETALLES A INCLUIR EN PROPIEDADES:
        - Ubicación: barrio en Pereira, Colombia
        - Área en metros cuadrados
        - Tipo de propiedad (apartaestudio, apartamento, casa, etc.)
        - Precio total en pesos colombianos (COP)
        - Número de habitaciones y baños
        - Parqueadero disponible
        - Ascensor (sí/no)
        - Inversión mínima: 1 COP por token de propiedad
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
