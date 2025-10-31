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
  filters: string[];
  tokens: Token[];
}

interface BannedList {
  name: string;
  chain: string;
  updatedAt: string;
  banned: Array<{ objectId: string; reason?: string }>;
}

export function generateStrictList(): TokenList {
  const dataDir = join(process.cwd(), 'data');
  
  // Read manually curated strict tokens (separate from verified-tokens.json)
  const strictTokensPath = join(dataDir, 'strict-tokens.json');
  let strictTokens: Token[] = [];
  
  try {
    strictTokens = JSON.parse(readFileSync(strictTokensPath, 'utf8'));
  } catch (error) {
    console.log('No strict-tokens.json found. Strict list will be empty until manually curated.');
    strictTokens = [];
  }
  
  // Read banned tokens
  const bannedPath = join(dataDir, 'banned.json');
  const bannedList: BannedList = JSON.parse(readFileSync(bannedPath, 'utf8'));
  const bannedObjectIds = new Set(bannedList.banned.map(b => b.objectId.toLowerCase()));
  
  // Filter out banned tokens from manually curated list
  const filteredTokens = strictTokens.filter(token => 
    token.objectId && !bannedObjectIds.has(token.objectId.toLowerCase())
  );
  
  // Sort alphabetically by symbol
  const sortedTokens = filteredTokens.sort((a, b) => 
    a.symbol.localeCompare(b.symbol)
  );
  
  return {
    name: 'Polar Strict Tokens',
    chain: 'sui',
    updatedAt: new Date().toISOString(),
    filters: ['manually-curated', 'verified'],
    tokens: sortedTokens
  };
}

export function writeStrictList(outputPath?: string): void {
  const strictList = generateStrictList();
  const path = outputPath || join(process.cwd(), 'dist', 'strict.json');
  
  writeFileSync(path, JSON.stringify(strictList, null, 2));
  console.log(`Generated strict.json with ${strictList.tokens.length} tokens`);
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  writeStrictList();
}