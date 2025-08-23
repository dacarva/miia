import { ActionProvider, WalletProvider, CreateAction } from "@coinbase/agentkit";
import { Property, PropertyWithInvestmentInfo } from "../properties/route";
import propertyData from "../mocks/venta_propiedades_subset_valid.json";

export interface PropertySearchParams {
  limit?: number;
  offset?: number;
  neighborhood?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
}

export interface PropertyInvestmentParams {
  propertyId: string;
  phoneNumber: string;
  investmentAmount: number;
}

class PropertyActionProvider extends ActionProvider<WalletProvider> {
  supportsNetwork(network: string): boolean {
    // Support all networks for property data access
    return true;
  }

  getActions(): CreateAction[] {
    return [
      {
        name: "search_properties",
        description: "Busca propiedades disponibles para inversión en Pereira, Colombia. Permite filtrar por barrio, precio, área, etc.",
        argsSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Número máximo de propiedades a retornar (default: 5)",
              default: 5
            },
            offset: {
              type: "number", 
              description: "Número de propiedades a saltar para paginación (default: 0)",
              default: 0
            },
            neighborhood: {
              type: "string",
              description: "Filtrar por barrio en Pereira (ej: Centro, Alamos, Pinares)"
            },
            minPrice: {
              type: "number",
              description: "Precio mínimo en COP"
            },
            maxPrice: {
              type: "number", 
              description: "Precio máximo en COP"
            },
            minArea: {
              type: "number",
              description: "Área mínima en metros cuadrados"
            },
            maxArea: {
              type: "number",
              description: "Área máxima en metros cuadrados"
            }
          },
          required: []
        },
        func: async (args: PropertySearchParams) => this.searchProperties(args)
      },
      {
        name: "get_property_details",
        description: "Obtiene detalles completos de una propiedad específica incluyendo información de tokenización",
        argsSchema: {
          type: "object",
          properties: {
            propertyId: {
              type: "string",
              description: "ID único de la propiedad (web_id)"
            }
          },
          required: ["propertyId"]
        },
        func: async (args: { propertyId: string }) => this.getPropertyDetails(args)
      },
      {
        name: "calculate_investment_tokens",
        description: "Calcula cuántos tokens de propiedad se pueden comprar con un monto de inversión",
        argsSchema: {
          type: "object",
          properties: {
            propertyId: {
              type: "string",
              description: "ID único de la propiedad"
            },
            investmentAmount: {
              type: "number",
              description: "Monto de inversión en COP"
            }
          },
          required: ["propertyId", "investmentAmount"]
        },
        func: async (args: { propertyId: string; investmentAmount: number }) => this.calculateInvestmentTokens(args)
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

  private calculateTokenomics(property: Property): {
    min_investment: number;
    max_investment: number;
    total_tokens: number;
    available_tokens: number;
    price_per_token: number;
    investment_percentage_per_token: number;
  } {
    const MIN_INVESTMENT_COP = 400000; // $100 USD = 400,000 COP
    const total_tokens = Math.floor(property.sale_value / MIN_INVESTMENT_COP);
    const price_per_token = property.sale_value / total_tokens;
    const investment_percentage_per_token = (1 / total_tokens) * 100;
    
    return {
      min_investment: MIN_INVESTMENT_COP,
      max_investment: property.sale_value,
      total_tokens,
      available_tokens: total_tokens, // For hackathon, all tokens are available
      price_per_token,
      investment_percentage_per_token
    };
  }

  private enhancePropertyWithInvestmentInfo(property: Property): PropertyWithInvestmentInfo {
    const tokenomics = this.calculateTokenomics(property);
    
    return {
      ...property,
      ...tokenomics,
      formatted_price: this.formatCurrency(property.sale_value)
    };
  }

  private async searchProperties(params: PropertySearchParams): Promise<any> {
    try {
      const limit = params.limit || 5;
      const offset = params.offset || 0;

      let filteredProperties = propertyData as Property[];

      // Apply filters
      if (params.neighborhood) {
        filteredProperties = filteredProperties.filter(p => 
          p.neighborhood.toLowerCase().includes(params.neighborhood!.toLowerCase())
        );
      }

      if (params.minPrice) {
        filteredProperties = filteredProperties.filter(p => p.sale_value >= params.minPrice!);
      }

      if (params.maxPrice) {
        filteredProperties = filteredProperties.filter(p => p.sale_value <= params.maxPrice!);
      }

      if (params.minArea) {
        filteredProperties = filteredProperties.filter(p => p.area >= params.minArea!);
      }

      if (params.maxArea) {
        filteredProperties = filteredProperties.filter(p => p.area <= params.maxArea!);
      }

      // Sort by price (ascending by default)
      filteredProperties.sort((a, b) => a.sale_value - b.sale_value);

      // Apply pagination
      const paginatedProperties = filteredProperties.slice(offset, offset + limit);

      // Enhance with investment information
      const enhancedProperties = paginatedProperties.map(p => this.enhancePropertyWithInvestmentInfo(p));
      
      return {
        success: true,
        properties: enhancedProperties,
        total: filteredProperties.length,
        hasMore: offset + limit < filteredProperties.length,
        message: `Encontré ${enhancedProperties.length} propiedades disponibles en Pereira.`
      };

    } catch (error) {
      console.error("Error searching properties:", error);
      return {
        success: false,
        error: "Error buscando propiedades. Intenta nuevamente.",
        message: "Lo siento, hubo un error buscando propiedades. Por favor intenta nuevamente."
      };
    }
  }

  private async getPropertyDetails(params: { propertyId: string }): Promise<any> {
    try {
      const property = propertyData.find((p: Property) => p.web_id === params.propertyId);
      
      if (!property) {
        return {
          success: false,
          error: "Propiedad no encontrada",
          message: "No encontré una propiedad con ese ID. Verifica el número e intenta nuevamente."
        };
      }

      const enhancedProperty = this.enhancePropertyWithInvestmentInfo(property as Property);
      
      return {
        success: true,
        property: enhancedProperty,
        message: `Detalles completos de la propiedad ${enhancedProperty.title}`
      };

    } catch (error) {
      console.error("Error fetching property details:", error);
      return {
        success: false,
        error: "Error obteniendo detalles de la propiedad",
        message: "No pude obtener los detalles de esa propiedad. Verifica el ID e intenta nuevamente."
      };
    }
  }

  private async calculateInvestmentTokens(params: { propertyId: string; investmentAmount: number }): Promise<any> {
    try {
      const propertyDetails = await this.getPropertyDetails({ propertyId: params.propertyId });
      
      if (!propertyDetails.success) {
        return propertyDetails;
      }

      const property: PropertyWithInvestmentInfo = propertyDetails.property;
      const MIN_INVESTMENT = 400000; // 400,000 COP

      if (params.investmentAmount < MIN_INVESTMENT) {
        return {
          success: false,
          message: `La inversión mínima es $400,000 COP. Tu monto de ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(params.investmentAmount)} es menor al mínimo requerido.`
        };
      }

      if (params.investmentAmount > property.sale_value) {
        return {
          success: false,
          message: `No puedes invertir más que el valor total de la propiedad (${property.formatted_price}).`
        };
      }

      const tokensToReceive = Math.floor(params.investmentAmount / property.price_per_token);
      const exactInvestment = tokensToReceive * property.price_per_token;
      const ownershipPercentage = (tokensToReceive / property.total_tokens) * 100;

      return {
        success: true,
        property: property,
        investment: {
          requested_amount: params.investmentAmount,
          exact_amount: exactInvestment,
          tokens_to_receive: tokensToReceive,
          ownership_percentage: ownershipPercentage,
          price_per_token: property.price_per_token
        },
        message: `Con $${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(exactInvestment)} recibirás ${tokensToReceive} tokens, equivalente al ${ownershipPercentage.toFixed(4)}% de la propiedad.`
      };

    } catch (error) {
      console.error("Error calculating investment tokens:", error);
      return {
        success: false,
        error: "Error calculando tokens de inversión",
        message: "Hubo un error calculando tu inversión. Intenta nuevamente."
      };
    }
  }
}

export function propertyActionProvider(): PropertyActionProvider {
  return new PropertyActionProvider();
}