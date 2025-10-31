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
  extensions?: TokenExtensions;
  signature?: Record<string, unknown>;
  version?: number;
};

export interface TokenExtensions {
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
  
  // Quality scoring
  qualityScore?: number;      // Quality score 0-100
  blockberryVerified?: boolean; // BlockBerry verification status
  
  // Additional metadata
  [key: string]: unknown;     // Allow additional fields
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

// Admin interface specific types
export interface TokenFilters {
  search: string;
  qualityScore: [number, number];
  tags: string[];
  verificationStatus: 'all' | 'candidates' | 'verified';
}

export interface AdminState {
  candidateTokens: Token[];
  verifiedTokens: Token[];
  selectedTokens: string[];
  filters: TokenFilters;
  sortBy: SortOption;
  isLoading: boolean;
  error: string | null;
}

export type SortOption = 
  | 'name'
  | 'symbol'
  | 'qualityScore'
  | 'addedAt'
  | 'volume24h'
  | 'marketCap'
  | 'holders';

export interface FileOperation {
  type: 'approve' | 'reject' | 'bulk-approve' | 'regenerate';
  payload: any;
  timestamp: string;
  adminId: string;
}

export interface OperationResult {
  success: boolean;
  message: string;
  affectedTokens: number;
  errors?: string[];
}