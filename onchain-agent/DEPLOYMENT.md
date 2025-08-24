# MIIA Onchain Agent - Deployment Guide

## Environment Variables Setup

### Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Base URL for API endpoints
# For local development: leave empty or set to http://localhost:3000
# For production: set to your deployed URL (e.g., https://your-app.vercel.app)
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app

# OpenAI API Key for LLM
OPENAI_API_KEY=your_openai_api_key_here

# CDP Configuration
CDP_API_KEY_ID=your_cdp_api_key_id_here
CDP_API_KEY_SECRET=your_cdp_api_key_secret_here
CDP_WALLET_SECRET=your_cdp_wallet_secret_here

# Network Configuration
NETWORK_ID=base-sepolia
```

### Vercel Deployment

When deploying to Vercel, the `VERCEL_URL` environment variable is automatically set. The custom tools will use this URL automatically.

### Other Platforms

For other deployment platforms, set the `NEXT_PUBLIC_BASE_URL` environment variable to your deployed URL.

## Testing the Complete Flow

### 1. Create a New Wallet and Purchase Property Tokens

```bash
# Step 1: Create a new wallet with a new phone number
curl -X POST "https://your-app.vercel.app/api/agent" \
  -H "Content-Type: application/json" \
  -d '{
    "userMessage": "Hola, quiero empezar a invertir en propiedades tokenizadas. Necesito crear una wallet y comprar tokens COP.",
    "phoneNumber": "+573009876543",
    "createNewWallet": true
  }'

# Step 2: Purchase property tokens
curl -X POST "https://your-app.vercel.app/api/agent" \
  -H "Content-Type: application/json" \
  -d '{
    "userMessage": "Quiero comprar 5 tokens de MIIA001.",
    "phoneNumber": "+573009876543"
  }'
```

### 2. Test Direct API Endpoints

```bash
# Test COP purchase
curl -X GET "https://your-app.vercel.app/api/test-cop-purchase"

# Test property purchase
curl -X GET "https://your-app.vercel.app/api/test-property-purchase"
```

## Custom Tools Configuration

The custom tools automatically detect the environment and use the appropriate base URL:

- **Local Development**: Uses `http://localhost:3000`
- **Vercel**: Uses `https://${process.env.VERCEL_URL}`
- **Custom**: Uses `NEXT_PUBLIC_BASE_URL` environment variable

## Features

✅ **Complete Onchain Integration**: All transactions execute on Base Sepolia testnet
✅ **Simplified Pricing Model**: 1 property token = 1 COP
✅ **LLM Agent**: Natural language interface for property investments
✅ **Custom Tools**: Bypass LangChain-AgentKit integration issues
✅ **Dynamic URLs**: Works in both development and production

## Troubleshooting

### Custom Tools Not Working
- Ensure `NEXT_PUBLIC_BASE_URL` is set correctly
- Check that the API endpoints are accessible
- Verify environment variables are loaded

### LLM Integration Issues
- The custom tools bypass the original LangChain-AgentKit issues
- If problems persist, check OpenAI API key and rate limits

### Onchain Transactions Failing
- Verify CDP credentials are correct
- Check Base Sepolia network connectivity
- Ensure wallet has sufficient ETH for gas fees
