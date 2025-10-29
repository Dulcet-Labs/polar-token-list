export type Token = {
  name: string;
  symbol: string;
  decimals: number;
  coinType?: string;
  coinDenom?: string;           // ✅ Add coinDenom for better token identification
  objectId: string;
  logoURI?: string;
  verified: boolean;
  verifiedBy?: string;
  addedAt: string;
  tags?: string[];
  extensions?: {
    // DEX/Trading specific fields
    price?: number;             // Current price in USD
    volume24h?: number;         // 24h trading volume
    marketCap?: number;         // Market capitalization
    priceChange24h?: number;    // 24h price change percentage
    
    // Wallet/DApp specific fields
    holders?: number;           // Number of token holders
    totalSupply?: number;       // Total token supply
    circulatingSupply?: number; // Circulating supply
    maxSupply?: number;         // Maximum supply
    
    // Metadata fields
    description?: string;       // Token description
    website?: string;           // Official website
    twitter?: string;           // Twitter handle
    telegram?: string;          // Telegram group
    discord?: string;           // Discord server
    
    // Technical fields
    packageId?: string;         // SUI package ID
    creatorAddress?: string;    // Token creator address
    creatorName?: string;       // Token creator name
    createTimestamp?: number;   // Creation timestamp
    
    // Security/Trust fields
    isVerified?: boolean;       // BlockBerry verification
    isBridged?: boolean;        // Is bridged token
    securityMessage?: string;   // Security warnings
    auditReport?: string;       // Audit report URL
    
    // Additional metadata
    [key: string]: unknown;     // Allow additional fields
  };
  signature?: Record<string, unknown>;
  version?: number;
};

export type BannedList = {
  name: string;
  chain: string;
  updatedAt: string;
  banned: { coinType?: string; objectId: string; reason?: string; addedAt?: string }[];
};

export type OutputList = {
  name: string;
  chain: string;
  updatedAt: string;
  tokens: Token[];
  filters?: string[];
};
