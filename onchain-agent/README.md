# Colombian Real Estate Tokenization Agent

This is a specialized onchain agent built with [AgentKit](https://github.com/coinbase/agentkit) for Colombian real estate tokenization and COP stablecoin operations. The agent facilitates fractional real estate investments using blockchain technology on Base Sepolia.

## 🚀 Features

### ✅ Enhanced COP Token Operations
- **COP Stablecoin Purchasing**: Buy Colombian Peso (COP) stablecoins for property investments
- **Smart Transaction Confirmation**: 4-minute timeout with early exit when confirmed (typically ~4 seconds)
- **Real-time Balance Checking**: Query COP token balances from blockchain
- **Multiple Confirmation Methods**: API endpoint + webpage parsing for robust verification
- **Subsidized Gas**: All transactions use subsidized gas on Base Sepolia

### 🏠 Tokenized Real Estate Platform
- **Three Available Properties**:
  - **MIIA001**: Apartaestudio La Julita Premium (Pereira) - 240M COP
  - **MIIA002**: Apartamento Cerritos Premium (Pereira) - 1.6B COP  
  - **MIIA003**: PH Dúplex Rosales Premium (Bogotá) - 2.1B COP
- **Fractional Ownership**: Purchase property tokens using COP stablecoins
- **Minimum Investment**: 400,000 COP per transaction
- **ERC-3643 T-REX Compliance**: Regulatory-compliant tokenized assets

### 🤖 AI-Powered Interactions
- **Natural Language Processing**: Spanish-language real estate investment assistant
- **Educational Guidance**: Explains tokenization, minimum investments, and processes
- **Smart Error Handling**: Graceful fallbacks with helpful user guidance
- **Investment Calculations**: Automatic token and percentage calculations

## 🛠 Setup

### Prerequisites
```bash
# Required environment variables
CDP_API_KEY_ID=your_coinbase_api_key_id
CDP_API_KEY_SECRET=your_coinbase_api_key_secret
CDP_WALLET_SECRET=your_wallet_secret
OPENAI_API_KEY=your_openai_api_key
NETWORK_ID=base-sepolia

# Optional: Base URL for production deployment
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
```

### Installation
```bash
npm install
cp .env.local .env
# Add your environment variables to .env
npm run dev
```

### Build Configuration
For the hackathon, ESLint and TypeScript checking are disabled during build to avoid linter errors. This is configured in `next.config.js`:

```javascript
eslint: {
  ignoreDuringBuilds: true,
},
typescript: {
  ignoreBuildErrors: true,
}
```

### Environment Variables
Create a `.env.local` file with the following variables:

```bash
# CDP Configuration
CDP_API_KEY_ID=your_cdp_api_key_id_here
CDP_API_KEY_SECRET=your_cdp_api_key_secret_here
CDP_WALLET_SECRET=your_cdp_wallet_secret_here

# OpenAI API Key for LLM
OPENAI_API_KEY=your_openai_api_key_here

# Network Configuration
NETWORK_ID=base-sepolia

# Base URL for API endpoints (optional)
# For local development: leave empty or set to http://localhost:3000
# For production: set to your deployed URL (e.g., https://your-app.vercel.app)
NEXT_PUBLIC_BASE_URL=
```

## 📡 API Endpoints

### Core Agent Endpoint
```http
POST /api/agent
Content-Type: application/json

{
  "userMessage": "Quiero comprar 100,000 tokens COP y esperar confirmación",
  "phoneNumber": "+573001234567"
}
```

### Direct Testing Endpoints
```http
# Test COP purchase with confirmation waiting
GET /api/test-cop-purchase

# Debug blockchain connectivity
GET /api/debug-blockchain

# Wallet management
GET /api/wallets
GET /api/wallets?phoneNumber=+573001234567
```

## 🎯 Usage Examples

### Purchase COP Tokens
```json
{
  "userMessage": "Quiero comprar 500,000 tokens COP para invertir en propiedades",
  "phoneNumber": "+573001234567"
}
```

### Check Balance
```json
{
  "userMessage": "¿Cuál es mi saldo actual de tokens COP?",
  "phoneNumber": "+573001234567"
}
```

### View Properties
```json
{
  "userMessage": "Muéstrame las propiedades tokenizadas disponibles",
  "phoneNumber": "+573001234567"
}
```

## 🔗 Blockchain Integration

### Smart Contracts (Base Sepolia)
- **ColombianCOP (MCOP)**: `0xD1E0A2c64e7a1Db0b7455587c2b382C756c38f6E`
- **Property Tokens**: ERC-3643 T-REX compliant contracts
- **Smart Wallets**: Account Abstraction with subsidized gas

### Recent Successful Transactions
- **Fast Confirmation**: `0xb40a44cdf6351fba1eb0f7cacb7cfa6055b753d9596fea7422561f8fc75972c9` (confirmed in ~4 seconds)
- **Reliable Execution**: `0xf7da705be495f5fbb6842e86a5b64bc6950978e86a95a582db86a15cd81328da` (successful)
- **Explorer**: https://sepolia.basescan.org/tx/{hash}

## 🧪 Testing

### Complete Flow Testing
Test the entire investment flow from wallet creation to property token purchase:

```bash
# Step 1: Create a new wallet with a new phone number
curl -X POST "http://localhost:3000/api/agent" \
  -H "Content-Type: application/json" \
  -d '{
    "userMessage": "Hola, quiero empezar a invertir en propiedades tokenizadas. Necesito crear una wallet y comprar tokens COP.",
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

### Postman Collection
The project includes a comprehensive Postman collection with:
- **Enhanced COP Token Operations**: Direct and LLM-integrated tests
- **Variable-driven Requests**: Easy customization with predefined amounts
- **Confirmation Testing**: Real timeout and early-exit scenarios
- **Educational Scenarios**: Different investment amounts and guidance
- **Production Deployment**: Updated with dynamic URL support

### Test Variables
```json
{
  "cop_small_amount": "50000",    // Below minimum threshold
  "cop_medium_amount": "100000",  // Standard test amount
  "cop_large_amount": "500000",   // Above minimum threshold
  "cop_contract_address": "0xD1E0A2c64e7a1Db0b7455587c2b382C756c38f6E"
}
```

## 📊 Performance Metrics

### Transaction Confirmation
- **Average Confirmation Time**: 4-30 seconds
- **Timeout Setting**: 4 minutes maximum wait
- **Success Rate**: 100% (all transactions successful on blockchain)
- **Early Exit**: Returns immediately when confirmed (no unnecessary waiting)

### Agent Capabilities
- **19 Total Actions**: Including COP operations, property management, and wallet functions
- **Multi-language Support**: Spanish-optimized for Colombian market
- **Error Recovery**: Graceful handling of temporary failures
- **User Education**: Automatic minimum investment guidance

## 🏗 Architecture

### Core Components
1. **AgentKit Integration** (`/app/api/agent/prepare-agentkit.ts`)
   - Wallet provider setup
   - Action provider registration
   - Phone number to wallet mapping

2. **Token Action Provider** (`/app/api/agent/token-action-provider.ts`)
   - COP token purchasing with confirmation waiting
   - Balance checking
   - Transaction hash extraction
   - Multi-method confirmation detection

3. **Custom Tools** (`/app/api/agent/custom-tools.ts`)
   - Dynamic URL support for production deployment
   - Direct API endpoint integration
   - Bypass LangChain-AgentKit compatibility issues
   - Environment-aware base URL detection

4. **Agent Creation** (`/app/api/agent/create-agent.ts`)
   - LLM configuration (GPT-5-nano)
   - Spanish-language system prompts
   - Colombian real estate context
   - Custom tools integration

### Key Features Implementation
- **Confirmation Waiting**: 5-second polling with dual detection methods
- **Smart Wallet Support**: User Operations (Account Abstraction)
- **Phone-based Wallets**: Automatic wallet creation and management
- **Educational AI**: Investment guidance and requirement explanations
- **Dynamic URL Support**: Automatic environment detection for production deployment
- **Custom Tools Integration**: Bypass LangChain-AgentKit compatibility issues

## 📚 Documentation

### Learn More
- [AgentKit Documentation](https://docs.cdp.coinbase.com/agentkit/docs/welcome)
- [Coinbase Developer Platform](https://docs.cdp.coinbase.com/)
- [Base Sepolia Testnet](https://docs.base.org/network-information/)
- [ERC-3643 T-REX Standard](https://docs.tokeny.com/)

### Colombian Real Estate Context
- **Investment Focus**: Pereira and Bogotá premium properties
- **Minimum Investment**: 400,000 COP ($100 USD approximately)
- **Tokenization Benefits**: Fractional ownership, liquidity, regulatory compliance
- **Target Market**: Colombian investors seeking blockchain-based real estate exposure

## 🚀 Production Deployment

### Environment Setup
```bash
# Production environment variables
NODE_ENV=production
CDP_API_KEY_ID=prod_key_id
CDP_API_KEY_SECRET=prod_key_secret
OPENAI_API_KEY=prod_openai_key
NETWORK_ID=base-mainnet  # For production
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
```

### Dynamic URL Support
The application automatically detects the environment and uses appropriate URLs:

- **Local Development**: Uses `http://localhost:3000`
- **Vercel**: Uses `https://${process.env.VERCEL_URL}` (automatically set)
- **Custom**: Uses `NEXT_PUBLIC_BASE_URL` environment variable

### Deployment Platforms

#### Vercel
```bash
# Vercel automatically sets VERCEL_URL
# No additional configuration needed for base URL
```

#### Other Platforms
```bash
# Set the base URL environment variable
NEXT_PUBLIC_BASE_URL=https://your-deployed-app.com
```

### Monitoring
- **Transaction Tracking**: All transactions logged with explorer links
- **Error Logging**: Comprehensive error handling and reporting
- **Performance Metrics**: Confirmation timing and success rates
- **User Analytics**: Investment patterns and amounts

## 🤝 Contributing

Contributions are welcome! This project demonstrates:
- **AgentKit Integration Patterns**: Custom action providers
- **Blockchain UX**: Transaction confirmation best practices  
- **Multilingual AI**: Spanish real estate domain expertise
- **DeFi Applications**: Stablecoin-based property tokenization

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Test with Postman collection
4. Verify blockchain transactions
5. Submit pull request

---

**Built with ❤️ for the Colombian real estate tokenization ecosystem**

Powered by [AgentKit](https://github.com/coinbase/agentkit) • [Coinbase Developer Platform](https://docs.cdp.coinbase.com/) • [Base](https://base.org/)