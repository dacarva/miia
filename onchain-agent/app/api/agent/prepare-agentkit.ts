import {
  AgentKit,
  cdpApiActionProvider,
  erc20ActionProvider,
  pythActionProvider,
  CdpSmartWalletProvider,
  walletActionProvider,
  WalletProvider,
  wethActionProvider,
} from "@coinbase/agentkit";
import { propertyActionProvider } from "./property-action-provider";
import * as fs from "fs";
import { Address, Hex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

/**
 * AgentKit Integration Route
 *
 * This file is your gateway to integrating AgentKit with your product.
 * It defines the core capabilities of your agent through WalletProvider
 * and ActionProvider configuration.
 *
 * Key Components:
 * 1. WalletProvider Setup:
 *    - Configures the blockchain wallet integration
 *    - Learn more: https://github.com/coinbase/agentkit/tree/main/typescript/agentkit#evm-wallet-providers
 *
 * 2. ActionProviders Setup:
 *    - Defines the specific actions your agent can perform
 *    - Choose from built-in providers or create custom ones:
 *      - Built-in: https://github.com/coinbase/agentkit/tree/main/typescript/agentkit#action-providers
 *      - Custom: https://github.com/coinbase/agentkit/tree/main/typescript/agentkit#creating-an-action-provider
 *
 * # Next Steps:
 * - Explore the AgentKit README: https://github.com/coinbase/agentkit
 * - Experiment with different LLM configurations
 * - Fine-tune agent parameters for your use case
 *
 * ## Want to contribute?
 * Join us in shaping AgentKit! Check out the contribution guide:
 * - https://github.com/coinbase/agentkit/blob/main/CONTRIBUTING.md
 * - https://discord.gg/CDP
 */

// Configure a directory to persist multiple wallet data
const WALLET_DATA_DIR = "wallet_data";

type WalletData = {
  privateKey: Hex;
  smartWalletAddress: Address;
  phoneNumber: string;
  createdAt: string;
  lastUsed: string;
};

/**
 * Validates phone number format
 * @param phoneNumber - Phone number to validate
 * @returns boolean indicating if valid
 */
function isValidPhoneNumber(phoneNumber: string): boolean {
  // Must start with + and contain 7-15 digits
  const phoneRegex = /^\+[1-9]\d{6,14}$/;
  return phoneRegex.test(phoneNumber);
}

/**
 * Sanitizes phone number for file naming
 * @param phoneNumber - Phone number to sanitize
 * @returns sanitized string safe for file names
 */
function sanitizePhoneNumber(phoneNumber: string): string {
  return phoneNumber.replace(/[^a-zA-Z0-9]/g, '_');
}

/**
 * Prepares the AgentKit and WalletProvider.
 *
 * @function prepareAgentkitAndWalletProvider
 * @param {string} phoneNumber - Phone number to identify the wallet
 * @param {boolean} createNewWallet - Whether to create a new wallet or reuse existing
 * @returns {Promise<{ agentkit: AgentKit, walletProvider: WalletProvider, walletData: WalletData }>} The initialized AI agent.
 *
 * @description Handles agent setup with support for multiple wallets based on phone numbers
 *
 * @throws {Error} If the agent initialization fails.
 */
export async function prepareAgentkitAndWalletProvider(
  phoneNumber?: string,
  createNewWallet: boolean = false
): Promise<{
  agentkit: AgentKit;
  walletProvider: WalletProvider;
  walletData: WalletData;
}> {
  if (!process.env.CDP_API_KEY_ID || !process.env.CDP_API_KEY_SECRET) {
    throw new Error(
      "I need both CDP_API_KEY_ID and CDP_API_KEY_SECRET in your .env file to connect to the Coinbase Developer Platform.",
    );
  }

  // Validate phone number if provided
  if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
    throw new Error(
      `Invalid phone number format: ${phoneNumber}. Please use international format (e.g., +1234567890)`
    );
  }

  // Ensure wallet data directory exists
  if (!fs.existsSync(WALLET_DATA_DIR)) {
    fs.mkdirSync(WALLET_DATA_DIR, { recursive: true });
  }

  let walletData: WalletData | null = null;
  let privateKey: Hex | null = null;

  // Determine wallet file path
  const walletFileName = phoneNumber 
    ? `wallet_${sanitizePhoneNumber(phoneNumber)}.json` 
    : "default_wallet.json";
  const walletFilePath = `${WALLET_DATA_DIR}/${walletFileName}`;

  // Read existing wallet data if available and not creating new wallet
  if (!createNewWallet && fs.existsSync(walletFilePath)) {
    try {
      walletData = JSON.parse(fs.readFileSync(walletFilePath, "utf8")) as WalletData;
      privateKey = walletData.privateKey;
    } catch (error) {
      console.error("Error reading wallet data:", error);
    }
  }

  // Generate new private key if needed
  if (!privateKey) {
    if (walletData?.smartWalletAddress && !createNewWallet) {
      throw new Error(
        `I found your smart wallet but can't access your private key. Please either provide the private key in your .env, or delete ${walletFilePath} to create a new wallet.`,
      );
    }
    privateKey = (process.env.PRIVATE_KEY || generatePrivateKey()) as Hex;
  }

  try {
    const owner = privateKeyToAccount(privateKey);

    // Initialize WalletProvider: https://docs.cdp.coinbase.com/agentkit/docs/wallet-management
    const walletProvider = await CdpSmartWalletProvider.configureWithWallet({
      apiKeyId: process.env.CDP_API_KEY_ID,
      apiKeySecret: process.env.CDP_API_KEY_SECRET,
      walletSecret: process.env.CDP_WALLET_SECRET,
      networkId: process.env.NETWORK_ID || "base-sepolia",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      owner: owner as any,
      address: walletData?.smartWalletAddress,
    });

    // Initialize AgentKit: https://docs.cdp.coinbase.com/agentkit/docs/agent-actions
    const agentkit = await AgentKit.from({
      walletProvider,
      actionProviders: [
        wethActionProvider(),
        pythActionProvider(),
        walletActionProvider(),
        erc20ActionProvider(),
        cdpApiActionProvider(),
        propertyActionProvider(),
      ],
    });

    // Save wallet data
    const smartWalletAddress = walletProvider.getAddress();
    const newWalletData: WalletData = {
      privateKey,
      smartWalletAddress: smartWalletAddress as Address,
      phoneNumber: phoneNumber || "default",
      createdAt: walletData?.createdAt || new Date().toISOString(),
      lastUsed: new Date().toISOString(),
    };

    fs.writeFileSync(walletFilePath, JSON.stringify(newWalletData, null, 2));

    return { agentkit, walletProvider, walletData: newWalletData };
  } catch (error) {
    console.error("Error initializing agent:", error);
    throw new Error("Failed to initialize agent");
  }
}

/**
 * Lists all available wallets
 * @returns {Promise<WalletData[]>} Array of wallet data
 */
export async function listWallets(): Promise<WalletData[]> {
  if (!fs.existsSync(WALLET_DATA_DIR)) {
    return [];
  }

  const wallets: WalletData[] = [];
  const files = fs.readdirSync(WALLET_DATA_DIR);
  
  for (const file of files) {
    if (file.endsWith('.json')) {
      try {
        const walletData = JSON.parse(fs.readFileSync(`${WALLET_DATA_DIR}/${file}`, "utf8")) as WalletData;
        wallets.push(walletData);
      } catch (error) {
        console.error(`Error reading wallet file ${file}:`, error);
      }
    }
  }

  return wallets.sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime());
}

/**
 * Gets wallet data for a specific phone number
 * @param {string} phoneNumber - Phone number to get wallet for
 * @returns {Promise<WalletData | null>} Wallet data or null if not found
 */
export async function getWallet(phoneNumber: string): Promise<WalletData | null> {
  if (!isValidPhoneNumber(phoneNumber)) {
    throw new Error(`Invalid phone number format: ${phoneNumber}`);
  }

  const walletFileName = `wallet_${sanitizePhoneNumber(phoneNumber)}.json`;
  const walletFilePath = `${WALLET_DATA_DIR}/${walletFileName}`;
  
  if (fs.existsSync(walletFilePath)) {
    try {
      const walletData = JSON.parse(fs.readFileSync(walletFilePath, "utf8")) as WalletData;
      return walletData;
    } catch (error) {
      console.error(`Error reading wallet for ${phoneNumber}:`, error);
      return null;
    }
  }
  
  return null;
}

/**
 * Deletes a specific wallet
 * @param {string} phoneNumber - Phone number of the wallet to delete
 * @returns {Promise<boolean>} Success status
 */
export async function deleteWallet(phoneNumber: string): Promise<boolean> {
  if (!isValidPhoneNumber(phoneNumber)) {
    throw new Error(`Invalid phone number format: ${phoneNumber}`);
  }

  const walletFileName = `wallet_${sanitizePhoneNumber(phoneNumber)}.json`;
  const walletFilePath = `${WALLET_DATA_DIR}/${walletFileName}`;
  
  if (fs.existsSync(walletFilePath)) {
    try {
      fs.unlinkSync(walletFilePath);
      return true;
    } catch (error) {
      console.error(`Error deleting wallet for ${phoneNumber}:`, error);
      return false;
    }
  }
  
  return false;
}

/**
 * Updates the last used timestamp for a wallet
 * @param {string} phoneNumber - Phone number of the wallet to update
 * @returns {Promise<boolean>} Success status
 */
export async function updateWalletLastUsed(phoneNumber: string): Promise<boolean> {
  if (!isValidPhoneNumber(phoneNumber)) {
    throw new Error(`Invalid phone number format: ${phoneNumber}`);
  }

  const walletFileName = `wallet_${sanitizePhoneNumber(phoneNumber)}.json`;
  const walletFilePath = `${WALLET_DATA_DIR}/${walletFileName}`;
  
  if (fs.existsSync(walletFilePath)) {
    try {
      const walletData = JSON.parse(fs.readFileSync(walletFilePath, "utf8")) as WalletData;
      walletData.lastUsed = new Date().toISOString();
      fs.writeFileSync(walletFilePath, JSON.stringify(walletData, null, 2));
      return true;
    } catch (error) {
      console.error(`Error updating wallet for ${phoneNumber}:`, error);
      return false;
    }
  }
  
  return false;
}
