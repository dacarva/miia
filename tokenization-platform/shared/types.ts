// Shared types for tokenization platform

export interface Property {
  web_id: string;
  title: string;
  description?: string;
  property_type: "Apartamento" | "Casa" | "Local" | "Lote" | "Oficina";
  sale_value: number;
  area: number;
  neighborhood: string;
  rooms?: number;
  bathrooms?: number;
  floors?: number;
  parking_spaces?: number;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  images?: string[];
  features?: string[];
}

export interface TokenizedProperty extends Property {
  // Blockchain information
  tokenAddress?: string;
  tokenSymbol: string;
  totalSupply: number;
  decimals: number;
  
  // Investment information
  totalTokens: number;
  availableTokens: number;
  pricePerToken: number;
  minInvestment: number;
  maxInvestment: number;
  
  // Compliance (ERC-3643 T-REX)
  identityRegistryAddress?: string;
  complianceAddress?: string;
  
  // Status
  status: "draft" | "tokenizing" | "active" | "sold_out" | "paused";
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenizationRequest {
  propertyId: string;
  issuerAddress: string;
  tokenName: string;
  tokenSymbol: string;
  totalSupply: number;
  minInvestment: number;
  complianceRules: ComplianceRule[];
}

export interface ComplianceRule {
  type: "kyc_required" | "accredited_investor" | "geography_restriction" | "investment_limit";
  parameters: Record<string, any>;
  description: string;
}

export interface Investment {
  id: string;
  investorPhone: string;
  investorAddress: string;
  propertyId: string;
  tokenAmount: number;
  investmentAmount: number;
  status: "pending" | "completed" | "failed";
  transactionHash?: string;
  createdAt: Date;
}