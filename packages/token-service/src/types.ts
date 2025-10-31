export type Token = {
  name: string;
  symbol: string;
  decimals: number;
  coinType?: string;
  coinDenom?: string;
  objectId: string;
  logoURI?: string;
  verified: boolean;
  verifiedBy?: string;
  addedAt: string;
  tags?: string[];
  extensions?: TokenExtensions;
  signature?: Record<string, unknown>;
  version?: number;
};

export interface TokenExtensions {
  // DEX/Trading specific fields
  price?: number;
  volume24h?: number;
  marketCap?: number;
  priceChange24h?: number;
  
  // Wallet/DApp specific fields
  holders?: number;
  totalSupply?: number;
  circulatingSupply?: number;
  maxSupply?: number;
  
  // Metadata fields
  description?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  
  // Technical fields
  packageId?: string;
  creatorAddress?: string;
  creatorName?: string;
  createTimestamp?: number;
  
  // Security/Trust fields
  isVerified?: boolean;
  isBridged?: boolean;
  securityMessage?: string;
  auditReport?: string;
  
  // Quality scoring
  qualityScore?: number;
  blockberryVerified?: boolean;
  
  // Additional metadata
  [key: string]: unknown;
}

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