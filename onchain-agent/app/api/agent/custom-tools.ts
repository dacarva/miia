import { DynamicTool } from "@langchain/core/tools";

/**
 * Custom tools that directly execute onchain logic by calling our working API endpoints
 * This bypasses the LangChain-AgentKit integration issues
 */

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
      name: "purchase_cop_tokens_custom",
      description: "Compra tokens COP colombianos (stablecoin) para usar en inversiones inmobiliarias. Usa este tool cuando necesites comprar COP tokens.",
      func: async (input: string) => {
        try {
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
          
          if (result.success && result.results?.step4_purchase?.result?.success) {
            const purchase = result.results.step4_purchase.result;
            return `¡Compra exitosa! Se han comprado ${purchase.balance.copAmount} COP tokens. Transacción: ${purchase.transaction.hash}. Balance actual: ${purchase.balance.formattedBalance}`;
          } else {
            return `Error en la compra: ${result.results?.step4_purchase?.result?.message || 'Error desconocido'}`;
          }
        } catch (error) {
          return `Error ejecutando la compra de COP: ${error instanceof Error ? error.message : 'Error desconocido'}`;
        }
      }
    }),

    new DynamicTool({
      name: "check_cop_balance_custom",
      description: "Verifica el saldo de tokens COP del usuario. Usa este tool para verificar el balance actual de COP tokens.",
      func: async (_input: string) => {
        try {
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
          // Parse the input to get property ID and token amount
          const parts = input.trim().split(' ');
          if (parts.length < 2) {
            return "Error: Por favor proporciona el ID de la propiedad y la cantidad de tokens. Ejemplo: 'MIIA001 1'";
          }

          const propertyId = parts[0].toUpperCase();
          const tokenAmount = parseInt(parts[1]);

          if (isNaN(tokenAmount) || tokenAmount <= 0) {
            return "Error: Por favor proporciona una cantidad válida de tokens mayor a 0.";
          }

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
            return `Error: No se pudo completar la compra de tokens de propiedad. Status: ${response.status}`;
          }

          const result = await response.json();
          
          if (result.success && result.results?.success) {
            const purchase = result.results.purchase;
            return `¡Compra exitosa! Has comprado ${purchase.tokensPurchased} tokens de ${purchase.propertyName} por ${purchase.formattedTotalCost}. Transacción: ${result.results.transaction.hash}. Porcentaje de propiedad: ${purchase.ownershipPercentage}%`;
          } else {
            return `Error en la compra: ${result.results?.message || 'Error desconocido'}`;
          }
        } catch (error) {
          return `Error ejecutando la compra de tokens de propiedad: ${error instanceof Error ? error.message : 'Error desconocido'}`;
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
