# MIIA - Colombian Real Estate Tokenization Platform

Smart contracts for tokenizing Colombian real estate properties using ERC-3643 T-REX standard for regulatory compliance.

## 🏗️ Architecture

### Core Contracts

- **PropertyToken.sol**: ERC-3643 compliant token representing fractional ownership of a property
- **ColombianCompliance.sol**: Compliance module enforcing Colombian securities regulations
- **PropertyTokenFactory.sol**: Factory for creating property tokens with compliance setup
- **FractionalPurchase.sol**: Handles fractional property purchases with platform fees
- **PortfolioTracker.sol**: Tracks investor portfolios and investment performance

### Compliance Features

- **KYC Verification**: Colombian ID (cédula) verification and KYC status tracking
- **Investment Limits**: Different limits for qualified vs non-qualified investors
- **Residency Requirements**: Colombian residency verification
- **Minimum Investment**: 1M COP minimum investment requirement
- **Maximum Limits**: 50M COP limit for non-qualified investors

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
npx hardhat run scripts/demo-tokenization.js --network localhost
```

## 📋 Testing

The test suite covers:

- Property token creation and validation
- Colombian compliance rules enforcement
- Fractional purchase workflows
- Portfolio tracking functionality
- End-to-end tokenization process

### Run Specific Tests

```bash
# Run all tests
npx hardhat test

# Run with detailed output
npx hardhat test --reporter spec

# Run specific test file
npx hardhat test test/PropertyTokenization.test.js
```

## 🔧 Deployment

### Local Development

1. Start local Hardhat node:
```bash
npx hardhat node
```

2. Deploy contracts:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

3. Run demo:
```bash
npx hardhat run scripts/demo-tokenization.js --network localhost
```

### Base Sepolia Testnet

1. Set environment variables:
```bash
export PRIVATE_KEY=your_private_key
export BASESCAN_API_KEY=your_basescan_api_key
```

2. Deploy to testnet:
```bash
npx hardhat run scripts/deploy.js --network base-sepolia
```

3. Verify contracts:
```bash
npx hardhat verify --network base-sepolia DEPLOYED_CONTRACT_ADDRESS
```

## 💰 Token Economics

### Property Tokenization Model

- **Token Supply**: Based on property value and minimum investment (400,000 COP)
- **Price Per Token**: Property Value ÷ Total Tokens
- **Minimum Purchase**: 100 tokens (400,000 COP)
- **Platform Fee**: 2.5% on all transactions

### Example: Apartamento Chapinero

```
Property Value: 350,000,000 COP (350M COP)
Total Tokens: 350,000
Price per Token: 1,000 COP
Minimum Investment: 100,000 COP (100 tokens)
Ownership per Token: 0.0002857% of property
```

## 🔒 Security Features

### Compliance Checks

- **Identity Verification**: Cédula registration and validation
- **KYC Status**: Mandatory KYC completion before transfers
- **Investment Limits**: Automatic enforcement of regulatory limits
- **Transfer Restrictions**: Only to compliant, verified investors

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
  totalInvestments: 2,
  totalValue: 85000000,     // 85M COP
  totalTokens: 85000,
  activeProperties: 2,
  totalReturns: 5000000     // 5M COP profit
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
- `InvestorRegistered`: New investor onboarded
- `KYCStatusUpdated`: KYC verification status change

## 🧪 Demo Scenario

The demo script demonstrates a complete tokenization workflow:

1. **Deploy Infrastructure**: T-REX registry contracts
2. **Create Property Token**: Apartamento in Chapinero, Bogotá
3. **Setup Compliance**: Register Colombian investor with KYC
4. **List for Sale**: Make tokens available for purchase
5. **Execute Purchase**: Buy 10,000 tokens (2.857% ownership)
6. **Verify Holdings**: Confirm token balance and ownership
7. **Update Portfolio**: Track investment in portfolio system

### Demo Output

```
🏠 MIIA - Demo de Tokenización de Propiedades Colombianas
============================================================
👤 Addresses and contracts...
📋 1. Deploying T-REX infrastructure...
🏢 2. Tokenizing property...
⚖️  3. Setting up Colombian compliance...
🛒 4. Listing property for fractional sale...
💰 5. Purchasing tokens...
🔍 6. Verifying holdings...
📊 7. Updating portfolio...
📈 8. Tokenization summary...
✅ ¡TOKENIZACIÓN EXITOSA!
```

## 📚 Documentation

### Contract Interfaces

- [PropertyToken Interface](./contracts/PropertyToken.sol)
- [Compliance Interface](./contracts/ColombianCompliance.sol)
- [Factory Interface](./contracts/PropertyTokenFactory.sol)

### Regulatory Compliance

Based on Colombian securities regulations:
- Superintendencia Financiera de Colombia (SFC) guidelines
- Colombian resident investor requirements
- KYC/AML compliance standards
- Investment limit enforcement

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

**⚠️ Disclaimer**: This is a hackathon project for demonstration purposes. Not intended for production use without proper auditing and regulatory approval.