# MIIA - Colombian Real Estate Tokenization Platform

Smart contracts for tokenizing Colombian real estate properties using ERC-3643 T-REX standard for regulatory compliance. **Hackathon Version** - Simplified for demonstration purposes.

## 🏗️ Architecture

### Core Contracts

- **PropertyToken.sol**: ERC-3643 compliant token representing fractional ownership of a property
- **SimpleCompliance.sol**: Simplified compliance module for hackathon demo (auto-compliant)
- **HackathonPropertyFactory.sol**: Factory for creating property tokens with compliance setup
- **T-REX Infrastructure**: IdentityRegistry, TrustedIssuersRegistry, ClaimTopicsRegistry

### Hackathon Features

- **Auto-Compliance**: All addresses are automatically KYC compliant for demo purposes
- **Simplified Workflow**: Streamlined tokenization process for hackathon presentation
- **Multiple Properties**: Support for multiple property tokenizations
- **Base Sepolia Deployment**: Live testnet deployment for demonstration

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd tokenization-platform/contracts
npm install
```

### 2. Compile Contracts

```bash
npx hardhat compile
```

### 3. Run Tests

```bash
npx hardhat test
```

### 4. Run Demo Tokenization

```bash
npx hardhat run scripts/deploy-property-1-simple.js --network localhost
```

## 📋 Testing

The test suite covers:

- Property token creation and validation
- Simplified compliance rules (auto-compliant)
- Token purchase workflows
- Multiple investor scenarios
- End-to-end tokenization process

### Run Specific Tests

```bash
# Run all tests
npx hardhat test

# Run with detailed output
npx hardhat test --reporter spec

# Run specific test file
npx hardhat test test/SimpleTokenization.test.js
```

## 🔧 Deployment

### Local Development

1. Start local Hardhat node:
```bash
npx hardhat node
```

2. Deploy contracts:
```bash
npx hardhat run scripts/deploy-property-1-simple.js --network localhost
```

### Base Sepolia Testnet

1. Set environment variables:
```bash
export PRIVATE_KEY=your_private_key
export BASESCAN_API_KEY=your_basescan_api_key
```

2. Deploy to testnet:
```bash
npx hardhat run scripts/deploy-property-1-simple.js --network base-sepolia
npx hardhat run scripts/deploy-property-2-simple.js --network base-sepolia
npx hardhat run scripts/deploy-property-3-simple.js --network base-sepolia
```

3. Verify contracts:
```bash
npx hardhat verify --network base-sepolia DEPLOYED_CONTRACT_ADDRESS
```

## 🏠 Live Deployed Properties

### Base Sepolia Testnet

**Property 1: Apartamento Chapinero Premium**
- Token Address: `0xE5e3203B043AaB9d2a43929Fc9ECde7f0D90DE6A`
- Symbol: `CHAP001`
- Total Value: 500 ETH (500M COP)
- Total Tokens: 500,000
- Status: Ready for demo

**Property 2: Casa Zona Rosa Bogotá**
- Token Address: `0x98e7a98DfD326EBd13c78789768EaDe3f2251C56`
- Symbol: `ROSA002`
- Total Value: 800 ETH (800M COP)
- Total Tokens: 800,000
- Status: Ready for demo

**Property 3: Oficina El Poblado Medellín**
- Token Address: `0x188c31F1630a5F1ec7970962A1F3CcDe65E94C82`
- Symbol: `POB003`
- Total Value: 350 ETH (350M COP)
- Total Tokens: 350,000
- Status: Ready for demo

### Infrastructure Contracts

- **TrustedIssuersRegistry**: `0xe55B8d0F9776B97AF9d4b422d35f294216AB5B78`
- **ClaimTopicsRegistry**: `0xF5389C56Bc55e66D882cAB9814b176090d9996b7`
- **IdentityRegistryStorage**: `0x524b05CE6ec12AE02814f47C45478f06166Cc6Dc`
- **IdentityRegistry**: `0xC53C56848a8a62B8bea942C2844546B7b7E8e8Cc`

## 💰 Token Economics

### Property Tokenization Model

- **Token Supply**: Based on property value and minimum investment
- **Price Per Token**: Property Value ÷ Total Tokens
- **Minimum Purchase**: 1 token
- **Platform Fee**: None (hackathon demo)

### Example: Apartamento Chapinero Premium

```
Property Value: 500,000,000 COP (500M COP)
Total Tokens: 500,000
Price per Token: 1,000 COP
Minimum Investment: 1,000 COP (1 token)
Ownership per Token: 0.0002% of property
```

## 🔒 Security Features

### Hackathon Compliance

- **Auto-KYC**: All addresses are automatically compliant for demo
- **Simplified Rules**: Streamlined for hackathon presentation
- **Transfer Restrictions**: Standard T-REX transfer restrictions
- **Access Control**: Role-based permissions using OpenZeppelin

### Smart Contract Security

- **Access Control**: Role-based permissions using OpenZeppelin
- **Reentrancy Protection**: Protection against reentrancy attacks
- **Input Validation**: Comprehensive parameter validation
- **Emergency Pause**: Circuit breaker for emergency situations

## 📊 Portfolio Management

### Investment Tracking

- Individual property holdings
- Total portfolio value
- Performance metrics
- Returns calculation
- Ownership percentages

### Portfolio Summary

```javascript
{
  totalInvestments: 3,
  totalValue: 1650000000,     // 1.65B COP
  totalTokens: 1650000,
  activeProperties: 3,
  deploymentNetwork: "base-sepolia"
}
```

## 🌐 Integration

### API Endpoints

The contracts integrate with the MIIA platform through:

- Property creation and management
- Investor registration and KYC
- Token purchase and transfers
- Portfolio tracking and analytics

### Event Monitoring

Key events for off-chain integration:

- `PropertyTokenCreated`: New property tokenized
- `SharesPurchased`: Token purchase completed
- `PropertyTokenized`: Property details initialized
- `KYCStatusUpdated`: KYC verification status change

## 🧪 Demo Scenario

The test demonstrates a complete tokenization workflow:

1. **Deploy Infrastructure**: T-REX registry contracts
2. **Create Property Token**: Apartamento in Chapinero, Bogotá
3. **Setup Compliance**: Auto-compliant KYC for all addresses
4. **Register Investors**: Multiple investor identities
5. **Execute Purchases**: Buy tokens for multiple investors
6. **Verify Holdings**: Confirm token balances and ownership
7. **Calculate Performance**: Track investment percentages

### Demo Output

```
🏗️  Setting up T-REX infrastructure for hackathon...
✅ T-REX infrastructure deployed successfully

📄 Checking property details...
   ✅ Property ID: HACK001
   ✅ Total Value: 350.0 ETH
   ✅ Total Tokens: 350000

💰 Testing token purchase with auto-compliance...
   ✅ Identity registered for investor: 0x...
   ✅ Tokens purchased: 10000
   ✅ Investor shares: 10000
   📊 Ownership percentage: 2.8571%

🚀 === HACKATHON TOKENIZATION DEMO ===
1️⃣  Setting up investor identities...
   ✅ Identities registered for both investors (auto-compliant)
2️⃣  Executing token purchases...
   💰 Investor1 tokens: 15000
   💰 Investor2 tokens: 8000
3️⃣  Final summary:
   🏭 Total supply: 23000
   🛍️  Available: 327000
   📊 Sold: 6.57%
🎉 HACKATHON DEMO COMPLETED SUCCESSFULLY!
```

## 📚 Documentation

### Contract Interfaces

- [PropertyToken Interface](./contracts/PropertyToken.sol)
- [SimpleCompliance Interface](./contracts/SimpleCompliance.sol)
- [HackathonPropertyFactory Interface](./contracts/HackathonPropertyFactory.sol)

### T-REX Integration

Based on Tokeny Solutions T-REX standard:
- ERC-3643 compliant tokens
- Identity management system
- Compliance framework
- Transfer restrictions

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit pull request

## 📄 License

GPL-3.0 License - See [LICENSE](LICENSE) file for details.

## 🆘 Support

For technical support or questions:
- Create an issue in the repository
- Join our Discord community
- Contact the development team

---

**⚠️ Disclaimer**: This is a hackathon project for demonstration purposes. The simplified compliance rules are for demo only and not intended for production use without proper auditing and regulatory approval.