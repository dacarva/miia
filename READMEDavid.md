# MIIA - Colombian Real Estate Tokenization Platform

A comprehensive blockchain-based real estate tokenization platform for Colombian properties, featuring AI-powered investment assistance and COP stablecoin integration.

## 🏗️ Project Structure

```
miia/
├── onchain-agent/          # AI-powered investment agent
│   ├── app/api/           # Next.js API routes
│   ├── app/api/agent/     # LLM agent and custom tools
│   └── postman_collection.json  # API testing collection
├── tokenization-platform/  # Smart contracts and deployment
│   ├── contracts/         # Solidity smart contracts
│   └── dashboard/         # Web interface (future)
└── shared/                # Shared types and utilities
```

## 🚀 Key Features

### 🤖 AI-Powered Investment Agent
- **Natural Language Interface**: Spanish-language real estate investment assistant
- **Onchain Transactions**: Direct blockchain integration for COP and property token purchases
- **Dynamic URL Support**: Automatic environment detection for production deployment
- **Custom Tools Integration**: Bypass LangChain-AgentKit compatibility issues

### 🏠 Tokenized Properties
- **MIIA001**: Apartaestudio La Julita Premium (Pereira) - 240M COP
- **MIIA002**: Apartamento Cerritos Premium (Pereira) - 1.6B COP  
- **MIIA003**: PH Dúplex Rosales Premium (Bogotá) - 2.1B COP

### 💰 COP Stablecoin Integration
- **Simplified Pricing**: 1 property token = 1 COP
- **Smart Confirmation**: 4-minute timeout with early exit when confirmed
- **Minimum Investment**: 400,000 COP per transaction
- **ERC-3643 T-REX Compliance**: Regulatory-compliant tokenized assets

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+
- CDP API credentials
- OpenAI API key
- Base Sepolia testnet access

### Local Development
```bash
# Clone the repository
git clone <repository-url>
cd miia

# Start the onchain agent
cd onchain-agent
npm install
cp .env.local .env
# Add your environment variables
npm run dev
```

### Environment Variables
```bash
# CDP Configuration
CDP_API_KEY_ID=your_cdp_api_key_id
CDP_API_KEY_SECRET=your_cdp_api_key_secret
CDP_WALLET_SECRET=your_cdp_wallet_secret

# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key

# Network Configuration
NETWORK_ID=base-sepolia

# Optional: Base URL for production
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
```

## 🧪 Testing

### Complete Investment Flow
```bash
# Step 1: Create wallet and purchase COP tokens
curl -X POST "http://localhost:3000/api/agent" \
  -H "Content-Type: application/json" \
  -d '{
    "userMessage": "Hola, quiero empezar a invertir en propiedades tokenizadas.",
    "phoneNumber": "+573009876543",
    "createNewWallet": true
  }'

# Step 2: Purchase property tokens
curl -X POST "http://localhost:3000/api/agent" \
  -H "Content-Type: application/json" \
  -d '{
    "userMessage": "Quiero comprar 5 tokens de MIIA001.",
    "phoneNumber": "+573009876543"
  }'
```

### Direct API Testing
```bash
# Test COP purchase
curl -X GET "http://localhost:3000/api/test-cop-purchase"

# Test property purchase
curl -X GET "http://localhost:3000/api/test-property-purchase"
```

## 🚀 Production Deployment

### Vercel Deployment
```bash
# Vercel automatically sets VERCEL_URL
# No additional configuration needed for base URL
```

### Other Platforms
```bash
# Set the base URL environment variable
NEXT_PUBLIC_BASE_URL=https://your-deployed-app.com
```

### Dynamic URL Support
The application automatically detects the environment:
- **Local Development**: Uses `http://localhost:3000`
- **Vercel**: Uses `https://${process.env.VERCEL_URL}` (automatically set)
- **Custom**: Uses `NEXT_PUBLIC_BASE_URL` environment variable

## 📊 Smart Contracts

### Deployed Contracts (Base Sepolia)
- **ColombianCOP (MCOP)**: `0xc2861B9bAd9aAeB682f001fE9DcD7Cdd630e4b12`
- **Property Tokens**: ERC-3643 T-REX compliant contracts
- **Smart Wallets**: Account Abstraction with subsidized gas

### Contract Features
- **18 Decimals**: Standard ERC20 with 1e12 multiplier for fiat COP amounts
- **Buy Shares Function**: Direct property token purchase using COP
- **Approval System**: ERC20 approve before property token purchase
- **Sequential Transactions**: 3-second wait between confirmations

## 📚 Documentation

### Detailed Guides
- [Onchain Agent README](onchain-agent/README.md) - Complete agent documentation
- [Deployment Guide](onchain-agent/DEPLOYMENT.md) - Production deployment instructions
- [Postman Collection](onchain-agent/postman_collection.json) - API testing scenarios

### External Resources
- [AgentKit Documentation](https://docs.cdp.coinbase.com/agentkit/docs/welcome)
- [Coinbase Developer Platform](https://docs.cdp.coinbase.com/)
- [Base Sepolia Testnet](https://docs.base.org/network-information/)
- [ERC-3643 T-REX Standard](https://docs.tokeny.com/)

## 🎯 Use Cases

### Colombian Real Estate Investment
- **Fractional Ownership**: Invest in premium properties with small amounts
- **Liquidity**: Trade property tokens on secondary markets
- **Regulatory Compliance**: ERC-3643 T-REX standard ensures compliance
- **AI Assistance**: Natural language interface for investment decisions

### Target Market
- Colombian investors seeking blockchain-based real estate exposure
- International investors interested in Colombian real estate
- Developers building on-chain real estate applications

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Test with Postman collection
4. Verify blockchain transactions
5. Submit pull request

### Key Areas for Contribution
- **Smart Contract Optimization**: Gas efficiency and security improvements
- **UI/UX Enhancement**: Dashboard and user interface development
- **Additional Properties**: Integration of new tokenized properties
- **Multi-language Support**: Additional language interfaces

## 📈 Performance Metrics

### Transaction Performance
- **Average Confirmation Time**: 4-30 seconds
- **Success Rate**: 100% (all transactions successful on blockchain)
- **Early Exit**: Returns immediately when confirmed
- **Timeout Setting**: 4 minutes maximum wait

### Agent Capabilities
- **19 Total Actions**: Including COP operations, property management, and wallet functions
- **Multi-language Support**: Spanish-optimized for Colombian market
- **Error Recovery**: Graceful handling of temporary failures
- **User Education**: Automatic minimum investment guidance

## 🔒 Security

### Smart Contract Security
- **ERC-3643 T-REX Compliance**: Regulatory-compliant tokenization
- **Access Control**: Proper role-based permissions
- **Input Validation**: Comprehensive parameter checking
- **Gas Optimization**: Efficient transaction execution

### API Security
- **Environment Variables**: Secure credential management
- **Input Sanitization**: Protection against malicious inputs
- **Rate Limiting**: Protection against abuse
- **Error Handling**: Secure error responses

---

**Built with ❤️ for the Colombian real estate tokenization ecosystem**

Powered by [AgentKit](https://github.com/coinbase/agentkit) • [Coinbase Developer Platform](https://docs.cdp.coinbase.com/) • [Base](https://base.org/)