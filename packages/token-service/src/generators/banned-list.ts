import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface BannedList {
  name: string;
  chain: string;
  updatedAt: string;
  banned: Array<{ 
    coinType?: string; 
    objectId: string; 
    reason?: string; 
    addedAt?: string;
  }>;
}

export function generateBannedList(): BannedList {
  const dataDir = join(process.cwd(), 'data');
  
  // Read banned tokens
  const bannedPath = join(dataDir, 'banned.json');
  let bannedList: BannedList;
  
  try {
    bannedList = JSON.parse(readFileSync(bannedPath, 'utf8'));
  } catch (error) {
    console.log('No banned.json found. Creating empty banned list.');
    bannedList = {
      name: 'Polar Banned Tokens',
      chain: 'sui',
      updatedAt: new Date().toISOString(),
      banned: []
    };
  }
  
  // Update timestamp
  bannedList.updatedAt = new Date().toISOString();
  
  return bannedList;
}

export function writeBannedList(outputPath?: string): void {
  const bannedList = generateBannedList();
  const path = outputPath || join(process.cwd(), 'dist', 'banned.json');
  
  writeFileSync(path, JSON.stringify(bannedList, null, 2));
  console.log(`Generated banned.json with ${bannedList.banned.length} banned tokens`);
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  writeBannedList();
}