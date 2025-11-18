import { BlockBerryAPI } from './dist/discovery/blockberry-api.js';
import fs from 'fs';
import path from 'path';

const api = new BlockBerryAPI();

try {
  const tokens = await api.getAllVerifiedTokensForPolar();
  
  const outputPath = path.join(process.cwd(), 'data', 'all-verified-tokens.json');
  fs.writeFileSync(outputPath, JSON.stringify(tokens, null, 2));
  
  console.log(`\n🎉 Got ALL ${tokens.length} verified tokens saved to data/all-verified-tokens.json`);
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
