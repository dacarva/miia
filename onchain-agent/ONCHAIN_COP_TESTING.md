# 🪙 Onchain COP Token Minting - Testing Guide

This guide explains how to test the real onchain COP token minting functionality using smart accounts with subsidized gas.

## 🎯 What's Been Implemented

### ✅ Real Blockchain Integration
- **Smart Accounts**: Using `CdpSmartWalletProvider` 
- **Gas Sponsorship**: Subsidized gas on Base Sepolia (no ETH needed)
- **Real Contracts**: Actual ColombianCOP contract deployment
- **Phone-to-Wallet**: Automatic wallet creation from phone numbers

### ✅ Onchain Functions
1. **`mint_cop_tokens`** - Mints COP tokens directly to user's smart wallet
2. **`check_cop_balance`** - Queries actual contract balance
3. **Real transactions** - Not simulated, actual blockchain calls

## 🧪 How to Test

### 1. Setup Requirements
```bash
# Make sure you have CDP API keys in .env
CDP_API_KEY_ID=your_key_id
CDP_API_KEY_SECRET=your_secret_key
NETWORK_ID=base-sepolia
```

### 2. Test COP Minting via API

**Create COP Tokens:**
```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+573001234567",
    "message": "Quiero crear 1000000 tokens COP para invertir",
    "createNewWallet": false
  }'
```

**Check COP Balance:**
```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+573001234567", 
    "message": "Verifica mi saldo de tokens COP",
    "createNewWallet": false
  }'
```

### 3. Expected Results

**Successful COP Minting:**
```json
{
  "success": true,
  "transaction": {
    "hash": "0x1234567890abcdef...",
    "blockNumber": 12345,
    "gasUsed": "50000",
    "status": "success"
  },
  "balance": {
    "userAddress": "0xABC123...",
    "phoneNumber": "+573001234567",
    "copAmount": 1000000,
    "formattedBalance": "$1.000.000 COP",
    "copTokenAddress": "0xD1E0A2c64e7a1Db0b7455587c2b382C756c38f6E"
  },
  "message": "¡Tokens COP creados exitosamente onchain!"
}
```

**Balance Check:**
```json
{
  "success": true,
  "balance": {
    "userAddress": "0xABC123...",
    "copBalance": 1000000,
    "formattedBalance": "$1.000.000 COP",
    "copTokenAddress": "0xD1E0A2c64e7a1Db0b7455587c2b382C756c38f6E"
  },
  "message": "Tu saldo actual de tokens COP es: $1.000.000 COP (consultado onchain)"
}
```

## 🔧 Technical Details

### Smart Account Flow
1. **Wallet Creation**: `CdpSmartWalletProvider.configureWithWallet()`
2. **Gas Sponsorship**: Automatic on Base Sepolia testnet
3. **Transaction Execution**: `walletProvider.sendTransaction()`
4. **No ETH Required**: User doesn't need to fund wallet

### Contract Interaction
```typescript
// Mint COP tokens
const mintCallData = encodeFunctionData({
  abi: [{ /* ColombianCOP.mintCOPToSelf ABI */ }],
  functionName: "mintCOPToSelf",
  args: [BigInt(copAmount)]
});

const transaction = await walletProvider.sendTransaction({
  to: "0xD1E0A2c64e7a1Db0b7455587c2b382C756c38f6E",
  data: mintCallData,
  value: 0
});
```

### Balance Query
```typescript
// Check COP balance
const result = await walletProvider.readContract({
  address: "0xD1E0A2c64e7a1Db0b7455587c2b382C756c38f6E",
  abi: [{ /* ColombianCOP.balanceOfCOP ABI */ }],
  functionName: "balanceOfCOP",
  args: [userAddress]
});
```

## 🚨 Error Handling

### Common Errors
1. **Network Issues**: Connection to Base Sepolia failed
2. **Contract Errors**: Invalid function call or parameters
3. **Transaction Failures**: Out of gas or execution reverted
4. **Timeout**: Transaction confirmation timeout

### Error Response Format
```json
{
  "success": false,
  "error": "Error creando tokens COP onchain",
  "message": "No pude crear los tokens COP onchain. Error: [detailed error]. Verifica que tienes una conexión activa a Base Sepolia."
}
```

## 🔗 Blockchain Verification

### View on Base Sepolia Explorer
- **ColombianCOP Contract**: [0xD1E0A2c64e7a1Db0b7455587c2b382C756c38f6E](https://sepolia.basescan.org/address/0xD1E0A2c64e7a1Db0b7455587c2b382C756c38f6E)
- **User Transactions**: Check transaction hash in Base Sepolia explorer
- **Token Balance**: View ERC-20 token balance in explorer

### Manual Contract Verification
```bash
# Using cast (if available)
cast call 0xD1E0A2c64e7a1Db0b7455587c2b382C756c38f6E \
  "balanceOfCOP(address)(uint256)" \
  YOUR_SMART_WALLET_ADDRESS \
  --rpc-url https://sepolia.base.org
```

## 🎉 Success Indicators

✅ **Real Transaction Hash**: Actual blockchain transaction, not mock  
✅ **Gas Sponsorship**: No ETH deducted from user wallet  
✅ **Contract State**: COP balance increases onchain  
✅ **Explorer Verification**: Transaction visible in Base Sepolia explorer  

## 📞 User Experience

### Natural Language Commands
Users can say:
- "Quiero crear 1 millón de tokens COP"
- "Necesito tokens COP para invertir" 
- "Verifica mi saldo de COP"
- "Cuántos tokens COP tengo?"

### Agent Response
The agent will:
1. Create smart wallet automatically (if new user)
2. Execute real blockchain transaction
3. Wait for confirmation
4. Report actual transaction hash and results
5. No technical complexity exposed to user

---

**⚠️ Note**: This is testnet functionality. The ColombianCOP is a mock token for demonstration. In production, you'd integrate with actual stablecoin contracts.