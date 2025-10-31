import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface PolarVerifiedToken {
  name: string;
  symbol: string;
  coinType: string;
  verifiedBy: 'polar';
  verifiedAt: string;
  reason?: string;
}

interface PolarVerifiedList {
  name: string;
  chain: string;
  updatedAt: string;
  description: string;
  tokens: PolarVerifiedToken[];
  verifiedTokens: PolarVerifiedToken[]; // Keep for backward compatibility
  totalCount: number;
}

export function generatePolarVerifiedList(): PolarVerifiedList {
  const dataDir = join(process.cwd(), 'data');
  
  // Read Polar-verified tokens
  const polarVerifiedPath = join(dataDir, 'polar-verified.json');
  let polarTokens: PolarVerifiedToken[] = [];
  
  try {
    polarTokens = JSON.parse(readFileSync(polarVerifiedPath, 'utf8'));
  } catch (error) {
    console.log('No polar-verified.json found. Creating empty Polar verification list.');
    polarTokens = [];
  }
  
  // Validate each token has required fields
  const validTokens = polarTokens.filter(token => 
    token.name && token.symbol && token.coinType && token.verifiedBy === 'polar'
  );
  
  if (validTokens.length !== polarTokens.length) {
    console.log(`⚠️  Filtered out ${polarTokens.length - validTokens.length} invalid Polar verification entries`);
  }
  
  return {
    name: 'Polar Verified Tokens',
    chain: 'sui',
    updatedAt: new Date().toISOString(),
    description: 'Tokens verified by Polar team - eligible for checkmark in Polar DEX UI',
    tokens: validTokens,
    verifiedTokens: validTokens, // Keep for backward compatibility
    totalCount: validTokens.length
  };
}

export function writePolarVerifiedList(outputPath?: string): void {
  const polarList = generatePolarVerifiedList();
  const path = outputPath || join(process.cwd(), 'dist', 'polar-verified.json');
  
  writeFileSync(path, JSON.stringify(polarList, null, 2));
  console.log(`Generated polar-verified.json with ${polarList.totalCount} Polar-verified tokens`);
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  writePolarVerifiedList();
}