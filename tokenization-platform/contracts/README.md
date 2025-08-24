# MIIA - Colombian Real Estate Tokenization Platform

Smart contracts for tokenizing Colombian real estate properties using ERC-3643 T-REX standard for regulatory compliance. **Hackathon Version** - Simplified for demonstration purposes with Colombian COP token integration.

## 🏗️ Architecture

### Core Contracts

- **PropertyToken.sol**: ERC-3643 compliant token representing fractional ownership of a property (optimized for size)
- **ColombianCOP.sol**: ERC-20 mock token for Colombian Peso (COP) with 100 trillion supply
- **SimpleCompliance.sol**: Simplified compliance module for hackathon demo (auto-compliant)
- **HackathonPropertyFactory.sol**: Factory for creating property tokens with compliance setup
- **T-REX Infrastructure**: IdentityRegistry, TrustedIssuersRegistry, ClaimTopicsRegistry

### Hackathon Features

- **🇨🇴 COP-Only Purchases**: All properties can only be purchased using Colombian COP tokens
- **Auto-Compliance**: All addresses are automatically KYC compliant for demo purposes
- **Simplified Workflow**: Streamlined tokenization process for hackathon presentation
- **Multiple Properties**: Support for multiple property tokenizations
- **Optimized Contracts**: Reduced contract size for deployment compatibility
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
# Deploy Property 1 (includes Colombian COP token)
npx hardhat run scripts/deploy-property-1-simple.js --network localhost

# Deploy Property 2 (reuses COP token)
npx hardhat run scripts/deploy-property-2-simple.js --network localhost

# Deploy Property 3 (reuses COP token)
npx hardhat run scripts/deploy-property-3-simple.js --network localhost
```

## 📋 Testing

The test suite covers:

- Property token creation and validation
- Colombian COP token integration and testing
- COP-based purchase workflows
- Simplified compliance rules (auto-compliant)
- Token purchase workflows with COP payments
- Multiple investor scenarios
- End-to-end tokenization process
- COP amount calculations and validations

### Run Specific Tests

```bash
# Run all tests
npx hardhat test

# Run with detailed output
npx hardhat test --reporter spec

# Run specific test file
npx hardhat test test/SimpleTokenization.test.js

# Run Colombian COP tests
npx hardhat test test/ColombianCOP.test.js
```

## 🔧 Deployment

### Local Development

1. Start local Hardhat node:
```bash
npx hardhat node
```

2. Deploy contracts:
```bash
# Deploy all properties with COP integration
npx hardhat run scripts/deploy-property-1-simple.js --network localhost
npx hardhat run scripts/deploy-property-2-simple.js --network localhost
npx hardhat run scripts/deploy-property-3-simple.js --network localhost
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

**Property 1: Apartaestudio La Julita Premium**
- Token Address: `0xCaa3bd187e785c37b24eBb5c87e26bBe621dEACa`
- Symbol: `LAJU001`
- Sale Value: 240M COP
- Total Tokens: 240,000
- 🇨🇴 Purchase Price: 1,000 COP per token
- Status: Ready for COP-based purchases

**Property 2: Apartamento Cerritos Premium**
- Token Address: `0x642165367c007e414a4899a884ac1026169524A5`
- Symbol: `CERR002`
- Sale Value: 1.6B COP
- Total Tokens: 1,600,000
- 🇨🇴 Purchase Price: 1,000 COP per token
- Status: Ready for COP-based purchases

**Property 3: PH Dúplex Rosales Premium**
- Token Address: `0x98bBa5749433Ab65Ea274DBA86C31308c470Bbed`
- Symbol: `ROSA003`
- Sale Value: 2.1B COP
- Total Tokens: 2,100,000
- 🇨🇴 Purchase Price: 1,000 COP per token
- Status: Ready for COP-based purchases

### Infrastructure Contracts

- **TrustedIssuersRegistry**: `0xf16ee4801a58ac2b8D8fa6A820B97fa61fcc89B3`
- **ClaimTopicsRegistry**: `0x6d08364738Ea9f8349520d95E9928f0917bB7CaB`
- **IdentityRegistryStorage**: `0x6226386501E2cb20F5B0315C1070e39a9A3F1Ba6`
- **IdentityRegistry**: `0x405B764d249c9B69b7e53CEaAc2ffE1F116A80D8`
- **🇨🇴 ColombianCOP Token**: `0xD1E0A2c64e7a1Db0b7455587c2b382C756c38f6E` (100 trillion supply)

## 💰 Token Economics

### Property Tokenization Model

- **🇨🇴 Purchase Currency**: Colombian COP tokens only
- **Token Supply**: Based on property value and minimum investment
- **Price Per Token**: Property Sale Value ÷ Total Tokens (in COP)
- **Minimum Purchase**: 1 token
- **Platform Fee**: None (hackathon demo)
- **COP Token Supply**: 100 trillion tokens (mock token)

### Example: Apartaestudio La Julita Premium

```
Property Sale Value: 240,000,000 COP (240M COP)
Total Tokens: 240,000
🇨🇴 Price per Token: 1,000 COP
Minimum Investment: 1,000 COP (1 token)
Ownership per Token: 0.000417% of property
Required COP Tokens: 1,000 COP tokens per property token
```

## 🔒 Security Features

### Hackathon Compliance

- **🇨🇴 COP-Only Purchases**: All properties require Colombian COP tokens
- **Auto-KYC**: All addresses are automatically compliant for demo
- **Simplified Rules**: Streamlined for hackathon presentation
- **Transfer Restrictions**: Standard T-REX transfer restrictions
- **Access Control**: Role-based permissions using OpenZeppelin
- **Contract Optimization**: Reduced size for deployment compatibility

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
  totalValue: 3940000000,     // 3.94B COP
  totalTokens: 3940000,
  activeProperties: 3,
  deploymentNetwork: "base-sepolia",
  copTokenAddress: "0x...",
  purchaseCurrency: "COP"
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

- `PropertyTokenized`: New property tokenized with COP integration
- `SharesPurchased`: Token purchase completed with COP amount
- `ColombianCOPMinted`: COP tokens minted for testing
- `KYCStatusUpdated`: KYC verification status change

## 🧪 Demo Scenario

The test demonstrates a complete tokenization workflow:

1. **Deploy Infrastructure**: T-REX registry contracts + Colombian COP token
2. **Create Property Token**: Apartaestudio in La Julita, Pereira
3. **Setup Compliance**: Auto-compliant KYC for all addresses
4. **Register Investors**: Multiple investor identities
5. **Execute COP Purchases**: Buy tokens using Colombian COP tokens
6. **Verify Holdings**: Confirm token balances and ownership
7. **Calculate Performance**: Track investment percentages and COP amounts

### Demo Output

```
🏗️  Setting up T-REX infrastructure for hackathon...
✅ T-REX infrastructure deployed successfully

🇨🇴 Deploying Colombian COP Token...
✅ ColombianCOP deployed at: 0x...
✅ Colombian COP token set in property

📄 Checking property details...
   ✅ Property ID: MIIA001
   ✅ Sale Value: 240M COP
   ✅ Total Tokens: 240000

💰 Testing COP-based token purchase...
   ✅ Identity registered for investor: 0x...
   ✅ Required COP: 10,000,000 COP tokens
   ✅ Tokens purchased: 10000
   📊 Ownership percentage: 4.17%

🚀 === HACKATHON TOKENIZATION DEMO ===
1️⃣  Setting up investor identities...
   ✅ Identities registered for both investors (auto-compliant)
2️⃣  Executing COP purchases...
   💰 Investor1 tokens: 15000 (15M COP paid)
   💰 Investor2 tokens: 8000 (8M COP paid)
3️⃣  Final summary:
   🏭 Total supply: 23000
   🛍️  Available: 217000
   📊 Sold: 9.58%
   🇨🇴 Total COP collected: 23M COP
🎉 HACKATHON DEMO COMPLETED SUCCESSFULLY!
```

## 📚 Documentation

### Contract Interfaces

- [PropertyToken Interface](./contracts/PropertyToken.sol) - COP-integrated property tokens
- [ColombianCOP Interface](./contracts/ColombianCOP.sol) - Colombian Peso mock token
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