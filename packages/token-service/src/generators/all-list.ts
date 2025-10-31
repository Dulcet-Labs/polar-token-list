import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface Token {
  name: string;
  symbol: string;
  decimals: number;
  objectId: string;
  logoURI?: string;
  verified: boolean;
  verifiedBy?: string;
  addedAt: string;
  tags: string[];
  extensions?: {
    website?: string;
    twitter?: string;
    github?: string;
    discord?: string;
    telegram?: string;
    description?: string;
  };
  signature?: {
    algo: 'ed25519' | 'secp256k1';
    signedAt: string;
    value: string;
  };
  version?: number;
}

interface TokenList {
  name: string;
  chain: string;
  updatedAt: string;
  tokens: Token[];
}

interface BannedList {
  name: string;
  chain: string;
  updatedAt: string;
  banned: Array<{ objectId: string; reason?: string }>;
}

export function generateAllList(): TokenList {
  const dataDir = join(process.cwd(), 'data');
  
  // Read verified tokens
  const verifiedTokensPath = join(dataDir, 'verified-tokens.json');
  const verifiedTokens: Token[] = JSON.parse(readFileSync(verifiedTokensPath, 'utf8'));
  
  // Read banned tokens
  const bannedPath = join(dataDir, 'banned.json');
  const bannedList: BannedList = JSON.parse(readFileSync(bannedPath, 'utf8'));
  const bannedObjectIds = new Set(bannedList.banned.map(b => b.objectId.toLowerCase()));
  
  // Filter out banned tokens
  const filteredTokens = verifiedTokens.filter(token => 
    token.objectId && !bannedObjectIds.has(token.objectId.toLowerCase())
  );
  
  // Sort: verified first, then alphabetically by symbol
  const sortedTokens = filteredTokens.sort((a, b) => {
    if (a.verified !== b.verified) {
      return a.verified ? -1 : 1;
    }
    return a.symbol.localeCompare(b.symbol);
  });
  
  return {
    name: 'Polar All Tokens',
    chain: 'sui',
    updatedAt: new Date().toISOString(),
    tokens: sortedTokens
  };
}

export function writeAllList(outputPath?: string): void {
  const allList = generateAllList();
  const path = outputPath || join(process.cwd(), 'dist', 'all.json');
  
  writeFileSync(path, JSON.stringify(allList, null, 2));
  console.log(`Generated all.json with ${allList.tokens.length} tokens`);
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  writeAllList();
}