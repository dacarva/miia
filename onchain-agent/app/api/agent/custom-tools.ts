import { DynamicTool } from "@langchain/core/tools";

/**
 * Custom tools that directly execute onchain logic by calling our working API endpoints
 * This bypasses the LangChain-AgentKit integration issues
 */

// Rate limiting cache to prevent loops
const rateLimitCache = new Map<string, { timestamp: number; count: number }>();

// Session tracking to prevent multiple operations for the same user message
const activeOperations = new Set<string>();

// Simple rate limiting function
function checkRateLimit(key: string, maxCalls: number = 3, windowMs: number = 60000): boolean {
  const now = Date.now();
  const cached = rateLimitCache.get(key);
  
  if (!cached || now - cached.timestamp > windowMs) {
    rateLimitCache.set(key, { timestamp: now, count: 1 });
    return true;
  }
  
  if (cached.count >= maxCalls) {
    return false;
  }
  
  cached.count++;
  return true;
}

// Clean up old rate limit entries periodically
function cleanupRateLimitCache() {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  
  rateLimitCache.forEach((value, key) => {
    if (now - value.timestamp > windowMs) {
      rateLimitCache.delete(key);
    }
  });
}

// Clean up cache every 5 minutes
setInterval(cleanupRateLimitCache, 5 * 60 * 1000);

// Get the base URL dynamically based on environment
function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // Client-side: use relative URLs
    return '';
  }
  
  // Server-side: use environment variable or default to localhost
  return process.env.NEXT_PUBLIC_BASE_URL || 
         process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
         'http://localhost:3000';
}

export function createCustomTools() {
  return [
    new DynamicTool({
      name: "complete_property_investment_flow",
      description: "EJECUTAR INMEDIATAMENTE el flujo completo de inversión: crea wallet, compra COP tokens y compra tokens de propiedad. Usar SIEMPRE para 'crea wallet y compra token' o cualquier solicitud de inversión. NO pedir confirmación.",
      func: async (input: string) => {
        try {
          // Check if operation is already in progress
          if (activeOperations.has('full_investment_active')) {
            return "⚠️ Ya hay una inversión completa en progreso. Por favor espera a que termine.";
          }
          
          // Minimal rate limiting - allow immediate execution
          if (!checkRateLimit('full_investment', 3, 30000)) { // 3 calls per 30 seconds
            return "⚠️ Demasiadas solicitudes recientes. Esperando 30 segundos...";
          }
          
          // Mark operation as active
          activeOperations.add('full_investment_active');
          
          // Parse input: "MIIA001 5 +573009876543" or just "MIIA001 5"
          const parts = input.trim().split(' ');
          const propertyId = parts[0]?.toUpperCase() || "MIIA001";
          const tokenAmount = parseInt(parts[1]) || 1;
          const phoneNumber = parts[2] || "+573009876543";

          if (isNaN(tokenAmount) || tokenAmount <= 0) {
            return "Error: Por favor proporciona una cantidad válida de tokens mayor a 0.";
          }

          if (!['MIIA001', 'MIIA002', 'MIIA003'].includes(propertyId)) {
            return "Error: Propiedad no válida. Las propiedades disponibles son: MIIA001, MIIA002, MIIA003.";
          }

          // Call the full purchase flow endpoint
          const baseUrl = getBaseUrl();
          const encodedPhoneNumber = encodeURIComponent(phoneNumber);
          const response = await fetch(`${baseUrl}/api/test-full-purchase-flow?tokenAmount=${tokenAmount}&propertyId=${propertyId}&phoneNumber=${encodedPhoneNumber}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
          });

          if (!response.ok) {
            // Check if the error response contains transaction details indicating partial success
            try {
              const errorText = await response.text();
              console.log(`Response error text: ${errorText}`);
              
              // Look for success patterns in error text
              if (errorText.includes('¡Compra exitosa') || errorText.includes('Transacción confirmada') || errorText.includes('0x')) {
                const hashMatch = errorText.match(/0x[a-fA-F0-9]{64}/);
                const successMatch = errorText.match(/¡Compra exitosa[^!]+!/);
                
                if (hashMatch && successMatch) {
                  return `🎉 ¡Inversión completada exitosamente!
                  
La transacción se ejecutó correctamente a pesar del error de API:
${successMatch[0]}

🔗 Transacción en blockchain: https://sepolia.basescan.org/tx/${hashMatch[0]}

¡Ya eres propietario de tokens de ${propertyId}!`;
                }
                
                if (hashMatch) {
                  return `⚠️ La transacción podría haber sido exitosa. Hash encontrado: ${hashMatch[0]}
                  
Verifica tu inversión en: https://sepolia.basescan.org/tx/${hashMatch[0]}`;
                }
              }
            } catch (e) {
              console.log(`Error parsing response: ${e}`);
            }
            return `❌ Error del servidor (${response.status}). La transacción podría haberse ejecutado. Verifica tu wallet o intenta de nuevo.`;
          }

          const result = await response.json();
          
          // Check if endpoint is disabled during deployment
          if (result.skipped) {
            return "⚠️ Servicio temporalmente no disponible durante el despliegue. Por favor, intenta de nuevo en unos minutos.";
          }
          
          if (result.success && result.results?.propertyPurchase?.success) {
            const copPurchase = result.results.copPurchase;
            const propertyPurchase = result.results.propertyPurchase;
            const purchase = propertyPurchase.purchase;
            
            return `🎉 ¡Inversión completa exitosa!

📝 **Resumen de la transacción:**
• Wallet creada/usada para: ${phoneNumber}
• COP tokens comprados: ${copPurchase.balance.formattedBalance}
• Propiedad: ${purchase.propertyName}
• Tokens adquiridos: ${purchase.tokensPurchased}
• Costo total: ${purchase.formattedTotalCost}
• Porcentaje de propiedad: ${purchase.ownershipPercentage}

🔗 **Transacciones en blockchain:**
• Compra COP: ${copPurchase.transaction.hash}
• Compra Propiedad: ${propertyPurchase.transaction.hash}
• Explorer: ${result.explorer_link}

¡Ya eres propietario de una fracción de esta propiedad!`;
          } else {
            const errorMsg = result.results?.propertyPurchase?.message || result.error || 'Error desconocido';
            
            // Auto-retry immediately on failure
            console.log("Auto-retrying investment flow...");
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            
            // Clear rate limits for immediate retry
            rateLimitCache.delete('full_investment');
            
            // Try again immediately
            const retryResponse = await fetch(`${baseUrl}/api/test-full-purchase-flow?tokenAmount=${tokenAmount}&propertyId=${propertyId}&phoneNumber=${encodedPhoneNumber}`, {
              method: "GET",
              headers: { "Content-Type": "application/json" }
            });
            
            if (retryResponse.ok) {
              const retryResult = await retryResponse.json();
              if (retryResult.success && retryResult.results?.propertyPurchase?.success) {
                const copPurchase = retryResult.results.copPurchase;
                const propertyPurchase = retryResult.results.propertyPurchase;
                const purchase = propertyPurchase.purchase;
                
                return `🎉 ¡Inversión exitosa después de reintento!

📝 **Resumen de la transacción:**
• Wallet creada/usada para: ${phoneNumber}
• COP tokens comprados: ${copPurchase.balance.formattedBalance}
• Propiedad: ${purchase.propertyName}
• Tokens adquiridos: ${purchase.tokensPurchased}
• Costo total: ${purchase.formattedTotalCost}
• Porcentaje de propiedad: ${purchase.ownershipPercentage}

🔗 **Transacciones en blockchain:**
• Compra COP: ${copPurchase.transaction.hash}
• Compra Propiedad: ${propertyPurchase.transaction.hash}
• Explorer: ${retryResult.explorer_link}

¡Ya eres propietario de una fracción de esta propiedad!`;
              }
            }
            
            return `❌ Error en el flujo de inversión (después de reintento): ${errorMsg}. Por favor intenta de nuevo en unos minutos.`;
          }
        } catch (error) {
          return `Error ejecutando el flujo completo de inversión: ${error instanceof Error ? error.message : 'Error desconocido'}`;
        } finally {
          // Always clear the active operation
          activeOperations.delete('full_investment_active');
        }
      }
    }),

    new DynamicTool({
      name: "retry_investment_now",
      description: "Reintenta la inversión completa inmediatamente. Usar cuando el usuario dice 'reintentar ahora' o 'intentar de nuevo'.",
      func: async (input: string) => {
        try {
          // Clear any existing rate limits for retry
          rateLimitCache.delete('full_investment');
          activeOperations.delete('full_investment_active');
          
          // Parse input: "MIIA001 1" or use defaults
          const parts = input.trim().split(' ');
          const propertyId = parts[0]?.toUpperCase() || "MIIA001";
          const tokenAmount = parseInt(parts[1]) || 1;
          const phoneNumber = parts[2] || "+573009876543";

          // Call the full purchase flow endpoint directly
          const baseUrl = getBaseUrl();
          const encodedPhoneNumber = encodeURIComponent(phoneNumber);
          const response = await fetch(`${baseUrl}/api/test-full-purchase-flow?tokenAmount=${tokenAmount}&propertyId=${propertyId}&phoneNumber=${encodedPhoneNumber}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
          });

          if (!response.ok) {
            return `Error: No se pudo completar el reintento. Status: ${response.status}`;
          }

          const result = await response.json();
          
          if (result.success && result.results?.propertyPurchase?.success) {
            const copPurchase = result.results.copPurchase;
            const propertyPurchase = result.results.propertyPurchase;
            const purchase = propertyPurchase.purchase;
            
            return `🎉 ¡Reintento exitoso! Inversión completa.

📝 **Resumen:**
• Propiedad: ${purchase.propertyName}
• Tokens: ${purchase.tokensPurchased}
• Costo: ${purchase.formattedTotalCost}
• Propiedad: ${purchase.ownershipPercentage}

🔗 Transacción: ${result.explorer_link}`;
          } else {
            return `❌ El reintento falló: ${result.error || 'Error desconocido'}`;
          }
          
        } catch (error) {
          return `Error en el reintento: ${error instanceof Error ? error.message : 'Error desconocido'}`;
        }
      }
    }),

    new DynamicTool({
      name: "check_transaction_success",
      description: "Verifica directamente en blockchain si las transacciones fueron exitosas cuando hay errores de API. Usar cuando sospechas que la transacción se ejecutó a pesar de errores.",
      func: async (input: string) => {
        try {
          // Extract transaction hash from input or use the most recent pattern
          const hashMatch = input.match(/0x[a-fA-F0-9]{64}/) || 
                           input.match(/Hash encontrado: (0x[a-fA-F0-9]{64})/) ||
                           input.match(/transaction: (0x[a-fA-F0-9]{64})/);
          
          if (!hashMatch) {
            return "No se encontró hash de transacción para verificar. Proporciona un hash válido.";
          }
          
          const txHash = hashMatch[0] || hashMatch[1];
          
          // Check transaction status using public Base Sepolia API
          try {
            const response = await fetch(`https://api-sepolia.basescan.org/api?module=transaction&action=gettxreceiptstatus&txhash=${txHash}`);
            const data = await response.json();
            
            if (data && data.result) {
              if (data.result.status === '1') {
                return `✅ ¡Transacción CONFIRMADA en blockchain!

Hash: ${txHash}
Estado: Exitosa
Explorer: https://sepolia.basescan.org/tx/${txHash}

¡Tu inversión se completó correctamente! A pesar del error de API, la transacción en blockchain fue exitosa.`;
              } else if (data.result.status === '0') {
                return `❌ Transacción FALLÓ en blockchain.

Hash: ${txHash}
Estado: Fallida
Explorer: https://sepolia.basescan.org/tx/${txHash}

La transacción no se completó exitosamente.`;
              }
            }
          } catch (apiError) {
            // Fallback to web scraping approach
            try {
              const webResponse = await fetch(`https://sepolia.basescan.org/tx/${txHash}`);
              const html = await webResponse.text();
              
              if (html.includes('Success') && (html.includes('Status') || html.includes('badge bg-success'))) {
                return `✅ ¡Transacción CONFIRMADA en blockchain!

Hash: ${txHash}
Estado: Exitosa (verificado via web)
Explorer: https://sepolia.basescan.org/tx/${txHash}

¡Tu inversión se completó correctamente!`;
              } else if (html.includes('Failed') && html.includes('Status')) {
                return `❌ Transacción FALLÓ en blockchain.

Hash: ${txHash}
Estado: Fallida (verificado via web)
Explorer: https://sepolia.basescan.org/tx/${txHash}`;
              }
            } catch (webError) {
              return `⚠️ No se pudo verificar el estado de la transacción.

Hash: ${txHash}
Verifica manualmente en: https://sepolia.basescan.org/tx/${txHash}`;
            }
          }
          
          return `⚠️ Estado de transacción incierto.

Hash: ${txHash}
Verifica manualmente en: https://sepolia.basescan.org/tx/${txHash}`;
          
        } catch (error) {
          return `Error verificando transacción: ${error instanceof Error ? error.message : 'Error desconocido'}`;
        }
      }
    }),

    new DynamicTool({
      name: "purchase_cop_tokens_custom",
      description: "Compra únicamente tokens COP colombianos (stablecoin). Usar solo si el usuario específicamente quiere solo COP tokens.",
      func: async (input: string) => {
        try {
          // Check if operation is already in progress
          if (activeOperations.has('cop_purchase_active')) {
            return "⚠️ Ya hay una compra de COP en progreso. Por favor espera a que termine.";
          }
          
          // Rate limiting to prevent loops
          if (!checkRateLimit('cop_purchase', 2, 60000)) {
            return "⚠️ Demasiadas solicitudes. Por favor, espera un momento antes de intentar de nuevo.";
          }
          
          // Mark operation as active
          activeOperations.add('cop_purchase_active');
          
          // Parse the input to get the amount
          const amount = parseInt(input.trim());
          if (isNaN(amount) || amount <= 0) {
            return "Error: Por favor proporciona un monto válido mayor a 0 para comprar tokens COP.";
          }

          // Call our working API endpoint
          const baseUrl = getBaseUrl();
          const response = await fetch(`${baseUrl}/api/test-cop-purchase`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
          });

          if (!response.ok) {
            return `Error: No se pudo completar la compra de COP. Status: ${response.status}`;
          }

          const result = await response.json();
          
          // Check if endpoint is disabled during deployment
          if (result.skipped) {
            return "⚠️ Servicio temporalmente no disponible durante el despliegue. Por favor, intenta de nuevo en unos minutos.";
          }
          
          if (result.success && result.results?.step4_purchase?.result?.success) {
            const purchase = result.results.step4_purchase.result;
            return `¡Compra exitosa! Se han comprado ${purchase.balance.copAmount} COP tokens. Transacción: ${purchase.transaction.hash}. Balance actual: ${purchase.balance.formattedBalance}`;
          } else {
            return `Error en la compra: ${result.results?.step4_purchase?.result?.message || 'Error desconocido'}`;
          }
        } catch (error) {
          return `Error ejecutando la compra de COP: ${error instanceof Error ? error.message : 'Error desconocido'}`;
        } finally {
          // Always clear the active operation
          activeOperations.delete('cop_purchase_active');
        }
      }
    }),

    new DynamicTool({
      name: "check_cop_balance_custom",
      description: "Verifica el saldo de tokens COP del usuario. Usa este tool para verificar el balance actual de COP tokens.",
      func: async (_input: string) => {
        try {
          // Rate limiting to prevent loops
          if (!checkRateLimit('cop_balance', 10, 60000)) {
            return "⚠️ Demasiadas solicitudes. Por favor, espera un momento antes de intentar de nuevo.";
          }
          
          // Call our working API endpoint
          const baseUrl = getBaseUrl();
          const response = await fetch(`${baseUrl}/api/test-cop-purchase`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
          });

          if (!response.ok) {
            return `Error: No se pudo verificar el balance de COP. Status: ${response.status}`;
          }

          const result = await response.json();
          
          // Check if endpoint is disabled during deployment
          if (result.skipped) {
            return "⚠️ Servicio temporalmente no disponible durante el despliegue. Por favor, intenta de nuevo en unos minutos.";
          }
          
          if (result.success && result.results?.step5_balance_after?.result?.success) {
            const balance = result.results.step5_balance_after.result.balance;
            return `Balance actual de COP: ${balance.formattedBalance} (${balance.copBalance} tokens)`;
          } else {
            return `Error verificando balance: ${result.results?.step5_balance_after?.result?.message || 'Error desconocido'}`;
          }
        } catch (error) {
          return `Error verificando balance de COP: ${error instanceof Error ? error.message : 'Error desconocido'}`;
        }
      }
    }),

    new DynamicTool({
      name: "purchase_property_tokens_custom",
      description: "Compra tokens de una propiedad tokenizada usando tokens COP del usuario. Usa este tool para comprar tokens de propiedades como MIIA001, MIIA002, MIIA003.",
      func: async (input: string) => {
        try {
          // Check if operation is already in progress
          if (activeOperations.has('property_purchase_active')) {
            return "⚠️ Ya hay una compra de propiedad en progreso. Por favor espera a que termine.";
          }
          
          // Rate limiting to prevent loops
          if (!checkRateLimit('property_purchase', 1, 120000)) { // 1 call per 2 minutes
            return "⚠️ Demasiadas solicitudes. Por favor, espera 2 minutos antes de intentar de nuevo.";
          }
          
          // Mark operation as active
          activeOperations.add('property_purchase_active');
          
          // Parse the input to get property ID and token amount
          const parts = input.trim().split(' ');
          if (parts.length < 2) {
            return "Error: Por favor proporciona el ID de la propiedad y la cantidad de tokens. Ejemplo: 'MIIA001 5'";
          }

          const propertyId = parts[0].toUpperCase();
          const tokenAmount = parseInt(parts[1]);
          const phoneNumber = parts[2] || "+573009876543"; // Default phone number if not provided

          if (isNaN(tokenAmount) || tokenAmount <= 0) {
            return "Error: Por favor proporciona una cantidad válida de tokens mayor a 0.";
          }

          if (!['MIIA001', 'MIIA002', 'MIIA003'].includes(propertyId)) {
            return "Error: Propiedad no válida. Las propiedades disponibles son: MIIA001, MIIA002, MIIA003.";
          }

          // Call our working API endpoint with proper parameters
          const baseUrl = getBaseUrl();
          const encodedPhoneNumber = encodeURIComponent(phoneNumber);
          const response = await fetch(`${baseUrl}/api/test-full-purchase-flow?tokenAmount=${tokenAmount}&propertyId=${propertyId}&phoneNumber=${encodedPhoneNumber}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
          });

          if (!response.ok) {
            return `Error: No se pudo completar la compra de tokens de propiedad. Status: ${response.status}`;
          }

          const result = await response.json();
          
          // Check if endpoint is disabled during deployment
          if (result.skipped) {
            return "⚠️ Servicio temporalmente no disponible durante el despliegue. Por favor, intenta de nuevo en unos minutos.";
          }
          
          if (result.success && result.results?.propertyPurchase?.success) {
            const purchase = result.results.propertyPurchase.purchase;
            return `¡Compra exitosa! Has comprado ${purchase.tokensPurchased} tokens de ${purchase.propertyName} por ${purchase.formattedTotalCost}. Transacción: ${result.results.propertyPurchase.transaction.hash}. Porcentaje de propiedad: ${purchase.ownershipPercentage}`;
          } else {
            return `Error en la compra: ${result.results?.propertyPurchase?.message || result.error || 'Error desconocido'}`;
          }
        } catch (error) {
          return `Error ejecutando la compra de tokens de propiedad: ${error instanceof Error ? error.message : 'Error desconocido'}`;
        } finally {
          // Always clear the active operation
          activeOperations.delete('property_purchase_active');
        }
      }
    }),

    new DynamicTool({
      name: "get_property_info_custom",
      description: "Obtiene información detallada de una propiedad tokenizada específica. Usa este tool para ver detalles de MIIA001, MIIA002, MIIA003.",
      func: async (input: string) => {
        try {
          const propertyId = input.trim().toUpperCase();

          if (!['MIIA001', 'MIIA002', 'MIIA003'].includes(propertyId)) {
            return "Error: Propiedad no válida. Las propiedades disponibles son: MIIA001, MIIA002, MIIA003.";
          }

          // Call our working API endpoint
          const baseUrl = getBaseUrl();
          const response = await fetch(`${baseUrl}/api/test-property-purchase`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
          });

          if (!response.ok) {
            return `Error: No se pudo obtener información de la propiedad. Status: ${response.status}`;
          }

          const result = await response.json();
          
          if (result.success && result.property_info?.success) {
            const property = result.property_info.property;
            return `Información de ${propertyId}:\n- Nombre: ${property.name}\n- Ubicación: ${property.location}\n- Tipo: ${property.propertyType}\n- Área: ${property.area} m²\n- Precio por token: ${property.formatted_price_per_token}\n- Tokens totales: ${property.totalTokens}\n- Valor total: ${property.formatted_total_value}\n- Inversión mínima: ${property.min_investment}`;
          } else {
            return `Error obteniendo información: ${result.property_info?.message || 'Error desconocido'}`;
          }
        } catch (error) {
          return `Error obteniendo información de la propiedad: ${error instanceof Error ? error.message : 'Error desconocido'}`;
        }
      }
    }),

    new DynamicTool({
      name: "list_properties_custom",
      description: "Lista todas las propiedades tokenizadas disponibles para inversión en la plataforma MIIA. Usa este tool para ver todas las opciones disponibles.",
      func: async (_input: string) => {
        try {
          // Call our working API endpoint
          const baseUrl = getBaseUrl();
          const response = await fetch(`${baseUrl}/api/test-property-purchase`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
          });

          if (!response.ok) {
            return `Error: No se pudo obtener la lista de propiedades. Status: ${response.status}`;
          }

          const result = await response.json();
          
          if (result.success && result.property_info?.success) {
            const property = result.property_info.property;
            return `Propiedades tokenizadas disponibles:\n\n1. MIIA001 - ${property.name}\n   - Ubicación: ${property.location}\n   - Precio por token: ${property.formatted_price_per_token}\n   - Tokens disponibles: ${property.totalTokens}\n   - Valor total: ${property.formatted_total_value}\n\n2. MIIA002 - Apartamento Cerritos Premium (Pereira)\n   - Precio por token: $1 COP\n   - Tokens disponibles: 1,600,000\n   - Valor total: $1,600,000 COP\n\n3. MIIA003 - PH Dúplex Rosales Premium (Bogotá)\n   - Precio por token: $1 COP\n   - Tokens disponibles: 2,100,000\n   - Valor total: $2,100,000 COP`;
          } else {
            return `Error obteniendo lista de propiedades: ${result.property_info?.message || 'Error desconocido'}`;
          }
        } catch (error) {
          return `Error obteniendo lista de propiedades: ${error instanceof Error ? error.message : 'Error desconocido'}`;
        }
      }
    })
  ];
}
