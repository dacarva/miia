export type AgentRequest = { 
  userMessage: string;
  phoneNumber?: string;
  createNewWallet?: boolean;
};

export type AgentResponse = { response?: string; error?: string };
