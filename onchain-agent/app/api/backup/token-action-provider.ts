import { ActionProvider, WalletProvider, CreateAction } from "@coinbase/agentkit";
import { Address, parseEther, formatEther, encodeFunctionData } from "viem";

// Deployed contract addresses from the latest deployment (README.md)
const DEPLOYED_CONTRACTS = {
  // Infrastructure
  TrustedIssuersRegistry: "0xF33838f6c85cFF9667a29B871592c74A053C89cd" as Address,
  ClaimTopicsRegistry: "0x203C4b26035fC20CAb92085B121EfFc8fbf533Ce" as Address,
  IdentityRegistryStorage: "0xE7538210aE32183Fc72753c3F793699a0d16620a" as Address,
  IdentityRegistry: "0x8A3477a1c197fA0565C279bcae784b9d5eC93B34" as Address,
  ColombianCOP: "0xc2861B9bAd9aAeB682f001fE9DcD7Cdd630e4b12" as Address,
  
  // Properties (updated with latest deployment)
  properties: {
    MIIA001: {
      name: "Apartaestudio La Julita Premium",
      symbol: "LAJU001",
      tokenAddress: "0x05C9d708CcAa1296247E04312b199Fd285de1aA0" as Address,
      saleValue: 240000000, // 240M COP
      totalTokens: 240000,
      pricePerToken: 1000, // 1,000 COP per token
      description: "Apartaestudio premium en La Julita, Pereira",
      location: "La Julita, Pereira",
      area: 45,
      propertyType: "Apartaestudio",
      rooms: 1,
      bathrooms: 1,
      parking: true,
      elevator: true
    },
    MIIA002: {
      name: "Apartamento Cerritos Premium",
      symbol: "CERR002",
      tokenAddress: "0xF8A82FE1a182C8dD4FaD980972066A4C1780194b" as Address,
      saleValue: 1600000000, // 1.6B COP
      totalTokens: 1600000,
      pricePerToken: 1000, // 1,000 COP per token
      description: "Apartamento premium en Cerritos, Pereira",
      location: "Cerritos, Pereira",
      area: 85,
      propertyType: "Apartamento",
      rooms: 2,
      bathrooms: 2,
      parking: true,
      elevator: true
    },
    MIIA003: {
      name: "PH Dúplex Rosales Premium",
      symbol: "ROSA003",
      tokenAddress: "0xD25a133AfE32B5e1519f0f174e9c2a3132c1bf9C" as Address,
      saleValue: 2100000000, // 2.1B COP
      totalTokens: 2100000,
      pricePerToken: 1000, // 1,000 COP per token
      description: "PH Dúplex premium en Rosales, Bogotá",
      location: "Rosales, Bogotá",
      area: 180,
      propertyType: "PH Dúplex",
      rooms: 3,
      bathrooms: 3,
      parking: true,
      elevator: true
    }
  }
};

export interface TokenPurchaseParams {
  propertyId: string;
  tokenAmount: number;
  phoneNumber: string;
}

export interface PropertyTokenInfo {
  propertyId: string;
  name: string;
  symbol: string;
  tokenAddress: Address;
  saleValue: number; // in COP
  totalTokens: number;
  availableTokens: number;
  pricePerToken: number; // in COP
  description: string;
  location: string;
  area: number;
  propertyType: string;
  rooms: number;
  bathrooms: number;
  parking: boolean;
  elevator: boolean;
}

export interface COPPurchaseParams {
  phoneNumber: string;
  copAmount: number; // Amount in COP to purchase
}

class TokenActionProvider extends ActionProvider<WalletProvider> {
  private walletProvider: WalletProvider;

  constructor(walletProvider: WalletProvider) {
    super();
    this.walletProvider = walletProvider;
  }

  supportsNetwork(network: any): boolean {
    // Only support base-sepolia for now
    return network === "base-sepolia" || network?.networkId === "base-sepolia";
  }

  getActions(): CreateAction[] {
    return [
      {
        name: "purchase_cop_tokens",
        description: "Compra tokens COP colombianos (stablecoin) para usar en inversiones inmobiliarias",
        argsSchema: {
          type: "object",
          properties: {
            phoneNumber: {
              type: "string",
              description: "Número de teléfono del usuario"
            },
            copAmount: {
              type: "number",
              description: "Cantidad de tokens COP a comprar (ejemplo: 1000000 para 1M COP)"
            }
          },
          required: ["phoneNumber", "copAmount"]
        },
        func: this.purchaseCOPTokens.bind(this)
      },
      {
        name: "list_tokenized_properties",
        description: "Lista todas las propiedades tokenizadas disponibles para inversión en la plataforma MIIA",
        argsSchema: {
          type: "object",
          properties: {},
          required: []
        },
        func: this.listTokenizedProperties.bind(this)
      },
      {
        name: "get_property_token_info",
        description: "Obtiene información detallada de una propiedad tokenizada específica",
        argsSchema: {
          type: "object",
          properties: {
            propertyId: {
              type: "string",
              description: "ID de la propiedad (MIIA001, MIIA002, MIIA003)"
            }
          },
          required: ["propertyId"]
        },
        func: this.getPropertyTokenInfo.bind(this)
      },
      {
        name: "purchase_property_tokens",
        description: "Compra tokens de una propiedad tokenizada usando tokens COP del usuario",
        argsSchema: {
          type: "object",
          properties: {
            propertyId: {
              type: "string",
              description: "ID de la propiedad (MIIA001, MIIA002, MIIA003)"
            },
            tokenAmount: {
              type: "number",
              description: "Cantidad de tokens a comprar"
            },
            phoneNumber: {
              type: "string",
              description: "Número de teléfono del usuario para identificar su wallet"
            }
          },
          required: ["propertyId", "tokenAmount", "phoneNumber"]
        },
        func: this.purchasePropertyTokens.bind(this)
      },
      {
        name: "get_user_token_holdings",
        description: "Obtiene el portafolio de tokens de propiedades del usuario",
        argsSchema: {
          type: "object",
          properties: {
            phoneNumber: {
              type: "string",
              description: "Número de teléfono del usuario"
            }
          },
          required: ["phoneNumber"]
        },
        func: this.getUserTokenHoldings.bind(this)
      },
      {
        name: "check_cop_balance",
        description: "Verifica el saldo de tokens COP del usuario",
        argsSchema: {
          type: "object",
          properties: {
            phoneNumber: {
              type: "string",
              description: "Número de teléfono del usuario"
            }
          },
          required: ["phoneNumber"]
        },
        func: this.checkCOPBalance.bind(this)
      }
    ];
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  private async waitForTransactionConfirmation(
    transactionHash: string, 
    timeoutMs: number = 240000 // 4 minutes default
  ): Promise<string> {
    const startTime = Date.now();
    const pollInterval = 5000; // Check every 5 seconds for faster confirmation detection
    
    console.log(`   Starting confirmation wait for transaction: ${transactionHash}`);
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        // Method 1: Try Base Sepolia API without API key (public endpoint)
        let confirmed = false;
        let failed = false;
        
        try {
          const publicUrl = `https://api-sepolia.basescan.org/api?module=transaction&action=gettxreceiptstatus&txhash=${transactionHash}`;
          const response = await fetch(publicUrl);
          const data = await response.json();
          
          if (data && data.result) {
            if (data.result.status === '1') {
              console.log(`   ✅ Transaction confirmed via API: ${transactionHash}`);
              return "confirmed";
            } else if (data.result.status === '0') {
              console.log(`   ❌ Transaction failed via API: ${transactionHash}`);
              return "failed";
            }
          } else if (data && data.message && data.message.includes('NOTOK')) {
            console.log(`   ⏳ API says transaction not found yet (normal for new transactions)`);
          }
        } catch (apiError) {
          console.log(`   ⚠️ API check failed: ${apiError.message}`);
        }
        
        // Method 2: Try to parse the webpage directly as fallback
        try {
          const webUrl = `https://sepolia.basescan.org/tx/${transactionHash}`;
          const webResponse = await fetch(webUrl);
          const html = await webResponse.text();
          
          if (html.includes('Success') && (html.includes('Status') || html.includes('badge bg-success'))) {
            console.log(`   ✅ Transaction confirmed via webpage: ${transactionHash}`);
            return "confirmed";
          } else if (html.includes('Failed') && html.includes('Status')) {
            console.log(`   ❌ Transaction failed via webpage: ${transactionHash}`);
            return "failed";
          }
        } catch (webError) {
          console.log(`   ⚠️ Webpage check failed: ${webError.message}`);
        }
        
        // If no confirmation yet, wait and try again
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        console.log(`   ⏳ Transaction pending... (${elapsed}s elapsed)`);
        
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
      } catch (error) {
        console.log(`   ⚠️ Error in confirmation check: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }
    
    console.log(`   ⏰ Timeout reached after ${Math.round(timeoutMs/1000)}s, transaction may still be pending`);
    return "timeout";
  }

  private async purchaseCOPTokens(args: COPPurchaseParams, walletProvider: WalletProvider): Promise<{
    success: boolean;
    transaction?: any;
    balance?: any;
    error?: string;
    message: string;
  }> {
    try {
      const { phoneNumber, copAmount } = args;
      
      if (copAmount <= 0) {
        return {
          success: false,
          error: "Cantidad inválida",
          message: "La cantidad de tokens COP debe ser mayor a 0."
        };
      }

      // Get the user's smart wallet address
      const userAddress = walletProvider.getAddress();
      
      // For demo purposes: "purchase" COP tokens by minting them to the user's wallet
      // In production, this would involve a DEX swap or fiat-to-crypto onramp
      const mintCallData = encodeFunctionData({
        abi: [
          {
            "inputs": [{"internalType": "uint256", "name": "copAmount", "type": "uint256"}],
            "name": "mintCOPToSelf", 
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ],
        functionName: "mintCOPToSelf",
        args: [BigInt(copAmount)]
      });

      // Execute the transaction using the smart wallet (gas subsidized on Base Sepolia)
      console.log('   Executing COP token purchase transaction...');
      const transaction = await walletProvider.sendTransaction({
        to: DEPLOYED_CONTRACTS.ColombianCOP,
        data: mintCallData,
        value: 0
      });

      // Debug transaction object structure
      console.log('   Transaction sent:', transaction?.hash || 'No hash');
      console.log('   Available transaction methods:', Object.getOwnPropertyNames(transaction || {}));
      
      // For AgentKit User Operations, check if hash is at specific indices
      if (transaction && Array.isArray(transaction)) {
        console.log('   Transaction is array-like, checking indices...');
        console.log('   transaction[0]:', transaction[0]);
        console.log('   transaction[1]:', transaction[1]);
        console.log('   transaction[2]:', transaction[2]);
      } else if (transaction) {
        console.log('   Transaction keys:', Object.keys(transaction));
        console.log('   Transaction values sample:', JSON.stringify(transaction).substring(0, 200));
      }

      // Handle AgentKit User Operations response
      let receipt = null;
      let transactionHash = "";
      
      if (transaction && transaction.hash) {
        transactionHash = transaction.hash;
        console.log(`   Transaction hash: ${transactionHash}`);
        
        try {
          if (transaction.wait) {
            console.log('   Using transaction.wait()...');
            receipt = await transaction.wait();
          } else if (walletProvider.waitForTransactionReceipt) {
            console.log('   Using walletProvider.waitForTransactionReceipt()...');
            receipt = await walletProvider.waitForTransactionReceipt(transactionHash);
          }
        } catch (waitError) {
          console.log(`   Wait method failed: ${waitError.message}`);
        }
      } else if (transaction) {
        // For AgentKit User Operations, try to extract hash from transaction object
        try {
          const txString = JSON.stringify(transaction);
          const hashMatch = txString.match(/"(0x[a-fA-F0-9]{64})"/);
          if (hashMatch) {
            transactionHash = hashMatch[1];
            console.log(`   Extracted transaction hash: ${transactionHash}`);
          } else {
            console.log("   Could not extract transaction hash from:", txString.substring(0, 100));
            transactionHash = "Transaction submitted - hash extraction failed";
          }
        } catch (extractError) {
          console.log("   Hash extraction failed:", extractError.message);
          transactionHash = "Transaction submitted - check wallet activity";
        }
      } else {
        console.log("   No transaction object returned");
        transactionHash = "Transaction submission failed";
      }

      // Wait for transaction confirmation if we have a hash
      let transactionStatus = "pending";
      if (transactionHash && transactionHash.startsWith("0x")) {
        console.log(`   Waiting for transaction confirmation (up to 4 minutes)...`);
        transactionStatus = await this.waitForTransactionConfirmation(transactionHash, 240000); // 4 minutes
      }

      return {
        success: true,
        transaction: {
          hash: transactionHash,
          blockNumber: receipt?.blockNumber || "pending",
          gasUsed: receipt?.gasUsed?.toString() || "subsidized",
          status: transactionStatus
        },
        balance: {
          userAddress,
          phoneNumber,
          copAmount: copAmount,
          formattedBalance: this.formatCurrency(copAmount),
          copTokenAddress: DEPLOYED_CONTRACTS.ColombianCOP
        },
        message: transactionStatus === "confirmed" 
          ? `¡Compra de tokens COP confirmada! Se han agregado ${this.formatCurrency(copAmount)} COP a tu smart wallet ${userAddress}. Transacción confirmada en blockchain: ${transactionHash}. Ahora puedes usar estos COP para comprar tokens de propiedades.`
          : transactionStatus === "pending"
          ? `Compra de tokens COP enviada. Se están procesando ${this.formatCurrency(copAmount)} COP para tu smart wallet ${userAddress}. Transacción: ${transactionHash}. La confirmación puede tomar hasta 4 minutos. Una vez confirmada, podrás usar estos COP para comprar tokens de propiedades.`
          : `Compra de tokens COP procesada. Transacción ${transactionHash} enviada para ${this.formatCurrency(copAmount)} COP. Estado: ${transactionStatus}. Verifica el estado en Base Sepolia explorer.`
      };

    } catch (error) {
      console.error("Error purchasing COP tokens:", error);
      return {
        success: false,
        error: "Error comprando tokens COP onchain",
        message: `No pude completar la compra de tokens COP onchain. Error: ${error instanceof Error ? error.message : 'Error desconocido'}. Verifica que tienes una conexión activa a Base Sepolia.`
      };
    }
  }

  private async checkCOPBalance(args: { phoneNumber: string }, walletProvider: WalletProvider): Promise<{
    success: boolean;
    balance?: any;
    error?: string;
    message: string;
  }> {
    try {
      const { phoneNumber } = args;
      
      // Get the user's smart wallet address
      const userAddress = walletProvider.getAddress();
      
      // Query the ColombianCOP contract for the balance
      const balanceCallData = encodeFunctionData({
        abi: [
          {
            "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
            "name": "balanceOfCOP",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
          }
        ],
        functionName: "balanceOfCOP",
        args: [userAddress as Address]
      });

      // Make a read-only call to the contract
      const result = await walletProvider.readContract({
        address: DEPLOYED_CONTRACTS.ColombianCOP,
        abi: [
          {
            "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
            "name": "balanceOfCOP",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
          }
        ],
        functionName: "balanceOfCOP",
        args: [userAddress as Address]
      });

      const copBalance = Number(result);

      return {
        success: true,
        balance: {
          userAddress,
          phoneNumber,
          copBalance,
          formattedBalance: this.formatCurrency(copBalance),
          copTokenAddress: DEPLOYED_CONTRACTS.ColombianCOP
        },
        message: `Tu saldo actual de tokens COP es: ${this.formatCurrency(copBalance)} (consultado onchain desde ${userAddress})`
      };

    } catch (error) {
      console.error("Error checking COP balance:", error);
      return {
        success: false,
        error: "Error verificando saldo onchain",
        message: `No pude verificar tu saldo de tokens COP onchain. Error: ${error instanceof Error ? error.message : 'Error desconocido'}. Verifica la conexión a Base Sepolia.`
      };
    }
  }

  private async listTokenizedProperties(): Promise<{
    success: boolean;
    properties?: any[];
    error?: string;
    message: string;
  }> {
    try {
      const properties: PropertyTokenInfo[] = [];
      
      for (const [propertyId, property] of Object.entries(DEPLOYED_CONTRACTS.properties)) {
        properties.push({
          propertyId,
          name: property.name,
          symbol: property.symbol,
          tokenAddress: property.tokenAddress,
          saleValue: property.saleValue,
          totalTokens: property.totalTokens,
          availableTokens: property.totalTokens, // For demo, assume all tokens available
          pricePerToken: property.pricePerToken,
          description: property.description,
          location: property.location,
          area: property.area,
          propertyType: property.propertyType,
          rooms: property.rooms,
          bathrooms: property.bathrooms,
          parking: property.parking,
          elevator: property.elevator
        });
      }

      return {
        success: true,
        properties: properties.map(p => ({
          ...p,
          formatted_total_value: this.formatCurrency(p.saleValue),
          formatted_price_per_token: this.formatCurrency(p.pricePerToken),
          sold_percentage: "0.00%", // For demo, assume no tokens sold yet
          min_investment: this.formatCurrency(p.pricePerToken), // 1 token minimum
          investment_per_token_percentage: (1 / p.totalTokens * 100).toFixed(6) + "%"
        })),
        message: `Encontré ${properties.length} propiedades tokenizadas disponibles para inversión con tokens COP.`
      };

    } catch (error) {
      console.error("Error listing tokenized properties:", error);
      return {
        success: false,
        error: "Error obteniendo propiedades tokenizadas",
        message: "No pude obtener la lista de propiedades tokenizadas. Intenta nuevamente."
      };
    }
  }

  private async getPropertyTokenInfo(args: { propertyId: string }): Promise<{
    success: boolean;
    property?: any;
    error?: string;
    message: string;
  }> {
    try {
      const property = DEPLOYED_CONTRACTS.properties[args.propertyId as keyof typeof DEPLOYED_CONTRACTS.properties];
      
      if (!property) {
        return {
          success: false,
          error: "Propiedad no encontrada",
          message: `No encontré una propiedad con ID ${args.propertyId}. Las propiedades disponibles son: MIIA001, MIIA002, MIIA003.`
        };
      }

      return {
        success: true,
        property: {
          propertyId: args.propertyId,
          name: property.name,
          symbol: property.symbol,
          tokenAddress: property.tokenAddress,
          saleValue: property.saleValue,
          totalTokens: property.totalTokens,
          availableTokens: property.totalTokens,
          totalSupply: 0, // For demo, assume no tokens sold yet
          pricePerToken: property.pricePerToken,
          soldPercentage: "0.00%",
          description: property.description,
          location: property.location,
          area: property.area,
          propertyType: property.propertyType,
          rooms: property.rooms,
          bathrooms: property.bathrooms,
          parking: property.parking,
          elevator: property.elevator,
          formatted_total_value: this.formatCurrency(property.saleValue),
          formatted_price_per_token: this.formatCurrency(property.pricePerToken),
          min_investment: this.formatCurrency(property.pricePerToken), // 1 token minimum
          investment_per_token_percentage: (1 / property.totalTokens * 100).toFixed(6) + "%",
          purchase_currency: "COP",
          cop_token_address: DEPLOYED_CONTRACTS.ColombianCOP
        },
        message: `Información completa de ${property.name}. Precio: ${this.formatCurrency(property.pricePerToken)} COP por token.`
      };

    } catch (error) {
      console.error("Error getting property token info:", error);
      return {
        success: false,
        error: "Error obteniendo información de la propiedad",
        message: "No pude obtener la información de esa propiedad. Verifica el ID e intenta nuevamente."
      };
    }
  }

  private async purchasePropertyTokens(args: TokenPurchaseParams, walletProvider: WalletProvider): Promise<{
    success: boolean;
    transaction?: any;
    purchase?: any;
    error?: string;
    message: string;
  }> {
    try {
      const { propertyId, tokenAmount, phoneNumber } = args;
      
      const property = DEPLOYED_CONTRACTS.properties[propertyId as keyof typeof DEPLOYED_CONTRACTS.properties];
      
      if (!property) {
        return {
          success: false,
          error: "Propiedad no encontrada",
          message: `No encontré una propiedad con ID ${propertyId}. Las propiedades disponibles son: MIIA001, MIIA002, MIIA003.`
        };
      }

      if (tokenAmount <= 0) {
        return {
          success: false,
          error: "Cantidad inválida",
          message: "La cantidad de tokens debe ser mayor a 0."
        };
      }

      const totalCostCOP = tokenAmount * property.pricePerToken;
      const userAddress = walletProvider.getAddress();

      const balanceResult = await this.checkCOPBalance({ phoneNumber }, walletProvider);
      if (!balanceResult.success || balanceResult.balance.copBalance < totalCostCOP) {
        return {
          success: false,
          error: "Fondos insuficientes",
          message: `Necesitas ${this.formatCurrency(totalCostCOP)} COP, pero tu saldo es ${balanceResult.balance.formattedBalance}. Usa 'purchase_cop_tokens' para obtener más.`
        };
      }

      const approveCallData = encodeFunctionData({
        abi: [{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}],
        functionName: "approve",
        args: [property.tokenAddress, BigInt(totalCostCOP * 1e12)]
      });

      const buySharesCallData = encodeFunctionData({
        abi: [{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"copAmount","type":"uint256"}],"name":"buyShares","outputs":[],"stateMutability":"nonpayable","type":"function"}],
        functionName: "buyShares",
        args: [BigInt(tokenAmount), BigInt(totalCostCOP * 1e12)]
      });

      // Send transactions sequentially
      console.log("   Sending 'approve' transaction...");
      const approveTx = await walletProvider.sendTransaction({
        to: DEPLOYED_CONTRACTS.ColombianCOP,
        data: approveCallData,
        value: 0
      });
      
      let approveTxHash = approveTx.hash;
      if (!approveTxHash) {
        const txString = JSON.stringify(approveTx);
        const hashMatch = txString.match(/"(0x[a-fA-F0-9]{64})"/);
        if (hashMatch) approveTxHash = hashMatch[1];
      }
      console.log(`   'approve' transaction hash: ${approveTxHash}`);
      
      console.log("   Waiting for 'approve' transaction confirmation...");
      const approveStatus = await this.waitForTransactionConfirmation(approveTxHash);

      if (approveStatus !== 'confirmed') {
        throw new Error(`'approve' transaction failed with status: ${approveStatus}`);
      }
      console.log("   'approve' transaction confirmed.");

      console.log("   Sending 'buyShares' transaction...");
      const buySharesTx = await walletProvider.sendTransaction({
        to: property.tokenAddress,
        data: buySharesCallData,
        value: 0
      });

      let buySharesTxHash = buySharesTx.hash;
      if (!buySharesTxHash) {
        const txString = JSON.stringify(buySharesTx);
        const hashMatch = txString.match(/"(0x[a-fA-F0-9]{64})"/);
        if (hashMatch) buySharesTxHash = hashMatch[1];
      }
      console.log(`   'buyShares' transaction hash: ${buySharesTxHash}`);
      
      const buySharesStatus = await this.waitForTransactionConfirmation(buySharesTxHash);

      if (buySharesStatus !== 'confirmed') {
        throw new Error(`'buyShares' transaction failed with status: ${buySharesStatus}`);
      }

      const transactionHash = buySharesTxHash;
      const transactionStatus = buySharesStatus;

      const ownershipPercentage = (tokenAmount / property.totalTokens * 100).toFixed(4);

      return {
        success: true,
        transaction: {
          hash: transactionHash,
          status: transactionStatus
        },
        purchase: {
          propertyId,
          propertyName: property.name,
          tokensPurchased: tokenAmount,
          totalCostCOP: totalCostCOP,
          formattedTotalCost: this.formatCurrency(totalCostCOP),
          ownershipPercentage: `${ownershipPercentage}%`,
        },
        message: transactionStatus === "confirmed"
          ? `¡Compra confirmada! Has adquirido ${tokenAmount} tokens de ${property.name} por ${this.formatCurrency(totalCostCOP)} COP. Transacción: ${transactionHash}`
          : `Compra enviada. La transacción ${transactionHash} está siendo procesada. Estado: ${transactionStatus}.`
      };

    } catch (error) {
      console.error("Error purchasing property tokens:", error);
      return {
        success: false,
        error: "Error en la compra de tokens",
        message: `No pude procesar la compra de tokens. Error: ${error instanceof Error ? error.message : 'Error desconocido'}.`
      };
    }
  }

  private async getUserTokenHoldings(args: { phoneNumber: string }): Promise<{
    success: boolean;
    portfolio?: any;
    error?: string;
    message: string;
  }> {
    try {
      const { phoneNumber } = args;
      
      // Simulate wallet address from phone number
      const userAddress = "0x" + Buffer.from(phoneNumber).toString('hex').padEnd(40, '0').substring(0, 40);

      // For demo purposes, return empty portfolio initially
      // In a real implementation, this would query each property token contract
      return {
        success: true,
        portfolio: {
          userAddress,
          phoneNumber,
          totalHoldings: 0,
          totalTokens: 0,
          totalValueCOP: 0,
          formattedTotalValue: this.formatCurrency(0),
          copBalance: 5000000, // Demo COP balance
          formattedCOPBalance: this.formatCurrency(5000000),
          copTokenAddress: DEPLOYED_CONTRACTS.ColombianCOP,
          holdings: []
        },
        message: "No tienes tokens de propiedades en tu portafolio actualmente. Usa purchase_property_tokens para invertir en propiedades."
      };

    } catch (error) {
      console.error("Error getting user token holdings:", error);
      return {
        success: false,
        error: "Error obteniendo portafolio",
        message: "No pude obtener tu portafolio de tokens. Intenta nuevamente."
      };
    }
  }
}

export function tokenActionProvider(walletProvider: WalletProvider): TokenActionProvider {
  return new TokenActionProvider(walletProvider);
}
