# MIIA Token Integration Guide

This document explains how the MIIA agent integrates with the deployed smart contracts to enable users to purchase property tokens.

## 🏗️ Architecture Overview

The integration connects your AI agent with the actual deployed smart contracts on Base Sepolia testnet, allowing users to:

1. **View Available Properties**: See all tokenized properties with real-time data
2. **Get Property Details**: View detailed information about specific properties
3. **Purchase Tokens**: Buy property tokens directly through the agent
4. **Track Portfolio**: View their token holdings across all properties

## 📋 Deployed Properties

### Live on Base Sepolia Testnet

| Property ID | Name | Location | Value | Tokens | Token Address |
|-------------|------|----------|-------|--------|---------------|
| MIIA001 | Apartamento Chapinero Premium | Chapinero, Bogotá | 500M COP | 500,000 | `0xE5e3203B043AaB9d2a43929Fc9ECde7f0D90DE6A` |
| MIIA002 | Casa Zona Rosa Bogotá | Zona Rosa, Bogotá | 800M COP | 800,000 | `0x98e7a98DfD326EBd13c78789768EaDe3f2251C56` |
| MIIA003 | Oficina El Poblado Medellín | El Poblado, Medellín | 350M COP | 350,000 | `0x188c31F1630a5F1ec7970962A1F3CcDe65E94C82` |

## 🔧 Integration Components

### 1. Token Action Provider (`token-action-provider.ts`)

The core integration component that provides the following actions:

#### Available Actions

- **`list_tokenized_properties`**: Lists all available tokenized properties
- **`get_property_token_info`**: Gets detailed information about a specific property
- **`purchase_property_tokens`**: Purchases tokens for a specific property
- **`get_user_token_holdings`**: Gets the user's portfolio of token holdings

#### Key Features

- Real-time contract interaction
- Automatic price calculations
- Investment validation (minimum 400,000 COP)
- Transaction execution and confirmation
- Portfolio tracking

### 2. Smart Contract Integration

#### Contract Addresses

```typescript
const DEPLOYED_CONTRACTS = {
  // Infrastructure
  TrustedIssuersRegistry: "0xe55B8d0F9776B97AF9d4b422d35f294216AB5B78",
  ClaimTopicsRegistry: "0xF5389C56Bc55e66D882cAB9814b176090d9996b7",
  IdentityRegistryStorage: "0x524b05CE6ec12AE02814f47C45478f06166Cc6Dc",
  IdentityRegistry: "0xC53C56848a8a62B8bea942C2844546B7b7E8e8Cc",
  
  // Properties
  properties: {
    MIIA001: { /* Property details */ },
    MIIA002: { /* Property details */ },
    MIIA003: { /* Property details */ }
  }
};
```

#### ABI Functions Used

```typescript
const PROPERTY_TOKEN_ABI = [
  // Read functions
  "propertyDetails()",
  "getAvailableTokens()",
  "totalSupply()",
  "balanceOf(address)",
  "getInvestorShares(address)",
  
  // Write functions
  "purchaseShares(address,uint256)"
];
```

## 🚀 Usage Examples

### 1. List Available Properties

```typescript
// Agent will call this automatically
await list_tokenized_properties()

// Returns:
{
  success: true,
  properties: [
    {
      propertyId: "MIIA001",
      name: "Apartamento Chapinero Premium",
      symbol: "CHAP001",
      formatted_total_value: "$500,000,000 COP",
      formatted_price_per_token: "$1,000 COP",
      sold_percentage: "0.00%"
    }
    // ... more properties
  ]
}
```

### 2. Get Property Details

```typescript
await get_property_token_info({ propertyId: "MIIA001" })

// Returns:
{
  success: true,
  property: {
    name: "Apartamento Chapinero Premium",
    totalValue: "500000000000000000000", // 500 ETH
    totalTokens: 500000,
    availableTokens: 500000,
    pricePerToken: 1000000000000000000, // 1 ETH
    min_investment: 400000,
    investment_per_token_percentage: "0.000200"
  }
}
```

### 3. Purchase Tokens

```typescript
await purchase_property_tokens({
  propertyId: "MIIA001",
  tokenAmount: 1000,
  phoneNumber: "+1234567890"
})

// Returns:
{
  success: true,
  transaction: {
    hash: "0x...",
    blockNumber: 12345,
    gasUsed: "150000"
  },
  purchase: {
    propertyId: "MIIA001",
    propertyName: "Apartamento Chapinero Premium",
    tokensPurchased: 1000,
    totalCost: "1.0",
    ownershipPercentage: "0.2000%",
    userAddress: "0x..."
  }
}
```

### 4. View Portfolio

```typescript
await get_user_token_holdings({ phoneNumber: "+1234567890" })

// Returns:
{
  success: true,
  portfolio: {
    userAddress: "0x...",
    phoneNumber: "+1234567890",
    totalHoldings: 2,
    totalTokens: 2500,
    totalValue: "2500000000000000000000", // 2500 ETH
    formattedTotalValue: "$2,500,000,000 COP",
    holdings: [
      {
        propertyId: "MIIA001",
        propertyName: "Apartamento Chapinero Premium",
        tokens: 1000,
        ownershipPercentage: "0.2000%",
        formattedValue: "$1,000,000,000 COP"
      }
      // ... more holdings
    ]
  }
}
```

## 💰 Token Economics

### Pricing Model

- **1 ETH = 1,000,000 COP** (for demo purposes)
- **Minimum Investment**: 400,000 COP (0.4 ETH)
- **Token Price**: Property Value ÷ Total Tokens
- **Ownership per Token**: 1 ÷ Total Tokens × 100%

### Example Calculations

**MIIA001 - Apartamento Chapinero Premium**
- Total Value: 500 ETH (500M COP)
- Total Tokens: 500,000
- Price per Token: 1 ETH (1M COP)
- Min Investment: 400 tokens (400M COP)
- Ownership per Token: 0.0002%

## 🔒 Security Features

### Investment Validation

- Minimum investment enforcement (400,000 COP)
- Available token validation
- Transaction confirmation waiting
- Error handling and rollback

### Compliance

- ERC-3643 T-REX standard compliance
- Identity verification (simplified for hackathon)
- Transfer restrictions
- Audit trail through blockchain

## 🧪 Testing

### Run Integration Test

```bash
cd onchain-agent
node test-token-integration.js
```

### Expected Output

```
🧪 Testing MIIA Token Integration...

📋 Available Tokenized Properties:
=====================================

🏠 MIIA001: Apartamento Chapinero Premium
   Symbol: CHAP001
   Token Address: 0xE5e3203B043AaB9d2a43929Fc9ECde7f0D90DE6A
   Total Value: 500.0 ETH (500M COP)
   Total Tokens: 500,000
   Price per Token: 1.0 ETH
   Min Investment: 400 tokens (400,000 COP)
   Ownership per Token: 0.000200%

✅ Token Integration Test Complete!
```

## 🔄 Agent Integration

### Updated Agent Capabilities

The agent now supports both:

1. **Properties in Pereira** (mock data)
   - `search_properties`
   - `get_property_details`
   - `calculate_investment_tokens`

2. **Tokenized Properties** (real blockchain)
   - `list_tokenized_properties`
   - `get_property_token_info`
   - `purchase_property_tokens`
   - `get_user_token_holdings`

### User Flow

1. **User asks for investment opportunities**
2. **Agent offers two options**:
   - Properties in Pereira (mock data)
   - Tokenized properties (real blockchain)
3. **User chooses tokenized properties**
4. **Agent shows available properties**
5. **User selects a property**
6. **Agent shows details and purchase options**
7. **User purchases tokens**
8. **Agent confirms transaction and shows portfolio**

## 🚨 Important Notes

### Network Requirements

- **Network**: Base Sepolia testnet only
- **Gas**: Users need ETH for gas fees
- **Faucet**: Available for testnet ETH

### Limitations

- **Demo Mode**: Simplified compliance for hackathon
- **Testnet Only**: Not for production use
- **Limited Properties**: Only 3 properties deployed
- **Fixed Pricing**: 1 ETH = 1M COP for demo

### Error Handling

The integration includes comprehensive error handling for:
- Insufficient funds
- Invalid property IDs
- Network issues
- Transaction failures
- Contract errors

## 📈 Future Enhancements

### Planned Features

1. **More Properties**: Additional tokenized properties
2. **Real-time Pricing**: Dynamic price updates
3. **Secondary Market**: Token trading between users
4. **Yield Generation**: Rental income distribution
5. **Regulatory Compliance**: Full KYC/AML integration

### Production Considerations

1. **Mainnet Deployment**: Move to production networks
2. **Security Audits**: Professional smart contract audits
3. **Insurance**: Property insurance integration
4. **Legal Framework**: Regulatory compliance
5. **Custody Solutions**: Institutional-grade custody

---

**⚠️ Disclaimer**: This integration is for hackathon demonstration purposes. The simplified compliance and testnet deployment are not suitable for production use without proper auditing and regulatory approval.
