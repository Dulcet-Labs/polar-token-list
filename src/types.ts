export type Token = {
  name: string;
  symbol: string;
  decimals: number;
  objectId: string;
  logoURI?: string;
  verified: boolean;
  verifiedBy?: string;
  addedAt: string;
  tags?: string[];
  extensions?: Record<string, unknown>;
  signature?: Record<string, unknown>;
  version?: number;
};

export type BannedList = {
  name: string;
  chain: string;
  updatedAt: string;
  banned: { objectId: string; reason?: string; addedAt?: string }[];
};

export type OutputList = {
  name: string;
  chain: string;
  updatedAt: string;
  tokens: Token[];
  filters?: string[];
};
