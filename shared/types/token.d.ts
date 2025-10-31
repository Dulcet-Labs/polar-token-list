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
    price?: number;
    volume24h?: number;
    marketCap?: number;
    priceChange24h?: number;
    holders?: number;
    totalSupply?: number;
    circulatingSupply?: number;
    maxSupply?: number;
    description?: string;
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
    packageId?: string;
    creatorAddress?: string;
    creatorName?: string;
    createTimestamp?: number;
    isVerified?: boolean;
    isBridged?: boolean;
    securityMessage?: string;
    auditReport?: string;
    qualityScore?: number;
    blockberryVerified?: boolean;
    [key: string]: unknown;
}
export type BannedList = {
    name: string;
    chain: string;
    updatedAt: string;
    banned: {
        coinType?: string;
        objectId: string;
        reason?: string;
        addedAt?: string;
    }[];
};
export type OutputList = {
    name: string;
    chain: string;
    updatedAt: string;
    tokens: Token[];
    filters?: string[];
};
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
export type SortOption = 'name' | 'symbol' | 'qualityScore' | 'addedAt' | 'volume24h' | 'marketCap' | 'holders';
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
