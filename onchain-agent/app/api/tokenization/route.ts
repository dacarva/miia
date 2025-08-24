import { NextRequest, NextResponse } from 'next/server';

interface TokenizationRequest {
  action: 'create_property' | 'list_properties' | 'purchase_tokens' | 'get_portfolio';
  data?: any;
  userWallet?: string;
}

interface PropertyData {
  name: string;
  address: string;
  cadastralRegistry: string;
  totalValue: number;
  totalTokens: number;
  description?: string;
  area?: number;
  propertyType?: string;
}

interface PurchaseData {
  propertyId: string;
  tokenAmount: number;
  maxPrice: number;
}

const TOKENIZATION_PLATFORM_API = process.env.TOKENIZATION_PLATFORM_API || 'http://localhost:3001/api';

async function callTokenizationPlatform(endpoint: string, data: any = {}) {
  try {
    const response = await fetch(`${TOKENIZATION_PLATFORM_API}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TOKENIZATION_API_KEY}`,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error calling tokenization platform:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: TokenizationRequest = await request.json();
    const { action, data, userWallet } = body;

    switch (action) {
      case 'create_property':
        {
          const propertyData: PropertyData = data;
          
          // Validate required fields
          if (!propertyData.name || !propertyData.address || !propertyData.totalValue || !propertyData.totalTokens) {
            return NextResponse.json(
              { error: 'Faltan campos requeridos: name, address, totalValue, totalTokens' },
              { status: 400 }
            );
          }

          // Create property token through the tokenization platform
          const result = await callTokenizationPlatform('/properties/create', {
            ...propertyData,
            issuer: userWallet,
            onchainID: userWallet, // Use wallet address as onchain ID for simplicity
          });

          return NextResponse.json({
            success: true,
            message: `Propiedad "${propertyData.name}" tokenizada exitosamente`,
            propertyId: result.propertyId,
            tokenAddress: result.tokenAddress,
            transactionHash: result.transactionHash,
          });
        }

      case 'list_properties':
        {
          const filters = data || {};
          const properties = await callTokenizationPlatform('/properties/list', filters);
          
          return NextResponse.json({
            success: true,
            properties: properties.map((prop: any) => ({
              id: prop.id,
              name: prop.name,
              address: prop.address,
              totalValue: prop.totalValue,
              availableTokens: prop.availableTokens,
              pricePerToken: prop.pricePerToken,
              expectedReturn: prop.expectedReturn,
              riskLevel: prop.riskLevel,
            })),
          });
        }

      case 'purchase_tokens':
        {
          const purchaseData: PurchaseData = data;
          
          if (!purchaseData.propertyId || !purchaseData.tokenAmount || !userWallet) {
            return NextResponse.json(
              { error: 'Faltan campos requeridos: propertyId, tokenAmount, userWallet' },
              { status: 400 }
            );
          }

          // Execute token purchase
          const result = await callTokenizationPlatform('/properties/purchase', {
            ...purchaseData,
            investor: userWallet,
          });

          return NextResponse.json({
            success: true,
            message: `Compra exitosa: ${purchaseData.tokenAmount} tokens de la propiedad ${purchaseData.propertyId}`,
            purchaseId: result.purchaseId,
            totalCost: result.totalCost,
            transactionHash: result.transactionHash,
          });
        }

      case 'get_portfolio':
        {
          if (!userWallet) {
            return NextResponse.json(
              { error: 'Se requiere wallet del usuario' },
              { status: 400 }
            );
          }

          const portfolio = await callTokenizationPlatform('/portfolio/get', {
            investor: userWallet,
          });

          return NextResponse.json({
            success: true,
            portfolio: {
              totalInvested: portfolio.totalInvested,
              currentValue: portfolio.currentValue,
              totalReturns: portfolio.totalReturns,
              activeInvestments: portfolio.investments.length,
              investments: portfolio.investments,
            },
          });
        }

      default:
        return NextResponse.json(
          { error: 'Acción no reconocida' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error in tokenization API:', error);
    
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}