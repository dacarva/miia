# MIIA - Colombian Real Estate Tokenization Platform

## Project Overview

This project, "MIIA," is a comprehensive platform for tokenizing Colombian real estate. It enables fractional ownership of properties through blockchain technology, specifically using the Base Sepolia testnet. The platform is divided into two main components: a smart contract backend for tokenization and a user-facing AI agent for interaction.

The core technologies used are:
- **Blockchain:** Solidity for smart contracts, Hardhat for development and deployment, and the ERC-3643 T-REX standard for regulatory compliance.
- **AI Agent:** A Next.js application powered by AgentKit, LangChain, and OpenAI to provide a natural language interface (in Spanish) for users.
- **Frontend:** The AI agent is the primary interface, but there is also a `dashboard` component within the `tokenization-platform` that is not fully developed.

The project is structured as a monorepo with two main directories:
- `onchain-agent`: The AI agent and user-facing application.
- `tokenization-platform`: The smart contracts and blockchain-related components.

---

## `onchain-agent`

This is a Next.js application that serves as an AI-powered onchain agent for the MIIA platform. It allows users to interact with the platform using natural language (Spanish) to perform actions like purchasing Colombian Peso (COP) stablecoins, checking their balance, and inquiring about available properties.

### Building and Running

1.  **Install Dependencies:**
    ```bash
    cd onchain-agent
    npm install
    ```

2.  **Environment Variables:**
    Create a `.env` file by copying `.env.local` and fill in the required API keys and secrets:
    ```
    CDP_API_KEY_ID=your_coinbase_api_key_id
    CDP_API_KEY_SECRET=your_coinbase_api_key_secret
    CDP_WALLET_SECRET=your_wallet_secret
    OPENAI_API_KEY=your_openai_api_key
    NETWORK_ID=base-sepolia
    ```

3.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

### Key Files

-   `app/api/agent/route.ts`: The main API endpoint for the AI agent.
-   `app/api/agent/create-agent.ts`: Configures the AI agent with system prompts and context.
-   `app/api/agent/token-action-provider.ts`: Defines the actions the agent can take related to the COP token.
-   `app/api/agent/property-action-provider.ts`: Defines the actions the agent can take related to properties.

---

## `tokenization-platform`

This directory contains the Solidity smart contracts and Hardhat development environment for the MIIA tokenization platform.

### Building and Running

1.  **Install Dependencies:**
    ```bash
    cd tokenization-platform/contracts
    npm install
    ```

2.  **Compile Contracts:**
    ```bash
    npx hardhat compile
    ```

3.  **Run Tests:**
    ```bash
    npx hardhat test
    ```

4.  **Deploy to a Local Network:**
    First, start a local Hardhat node:
    ```bash
    npx hardhat node
    ```
    Then, in a separate terminal, run the deployment scripts:
    ```bash
    npx hardhat run scripts/deploy-property-1-simple.js --network localhost
    npx hardhat run scripts/deploy-property-2-simple.js --network localhost
    npx hardhat run scripts/deploy-property-3-simple.js --network localhost
    ```

### Key Files

-   `contracts/PropertyToken.sol`: The ERC-3643 compliant token for representing property ownership.
-   `contracts/ColombianCOP.sol`: An ERC-20 mock token for the Colombian Peso.
-   `contracts/HackathonPropertyFactory.sol`: A factory contract for creating new property tokens.
-   `scripts/deploy-property-1-simple.js`: A script to deploy the first sample property and the ColombianCOP token.
-   `hardhat.config.js`: The configuration file for the Hardhat development environment.
