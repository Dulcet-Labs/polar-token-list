// Test the full 3 parallel scan with a smaller dataset first
require('dotenv').config();

// Import the BlockBerry API
const { BlockBerryAPI } = require('./dist/discovery/blockberry-api.js');

async function testFullScan() {
    console.log('=== Testing Full Scan with 3 Parallel Requests ===\n');

    const apiKey = process.env.BLOCKBERRY_API_KEY;
    const api = new BlockBerryAPI(apiKey);

    try {
        console.log('🧪 Testing with 1000 verified tokens first...');
        console.log('This should take ~2-3 minutes\n');

        // Use the fast method to get 1000 verified tokens
        const tokens = await api.getVerifiedTokensFast(1000);

        if (tokens.length > 0) {
            console.log(`\n✅ Successfully got ${tokens.length} verified tokens!`);

            // Save results
            const fs = require('fs');
            const path = require('path');
            const outputPath = path.join(process.cwd(), 'data', 'test-1000-verified.json');
            fs.writeFileSync(outputPath, JSON.stringify(tokens, null, 2));

            console.log(`💾 Saved to: ${outputPath}`);

            // Quality analysis
            const withVolume = tokens.filter(t => t.extensions.volume24h > 0);
            const withLogos = tokens.filter(t => t.logoURI);
            const avgHolders = tokens.reduce((sum, t) => sum + (t.extensions.holders || 0), 0) / tokens.length;

            console.log('\n📊 Quality Analysis:');
            console.log(`- Tokens with volume: ${withVolume.length}/${tokens.length} (${((withVolume.length / tokens.length) * 100).toFixed(1)}%)`);
            console.log(`- Tokens with logos: ${withLogos.length}/${tokens.length} (${((withLogos.length / tokens.length) * 100).toFixed(1)}%)`);
            console.log(`- Average holders: ${Math.round(avgHolders).toLocaleString()}`);

            console.log('\n🎯 Ready for full scan?');
            console.log('If this looks good, run: node -e "require(\'./dist/discovery/blockberry-api.js\').runAllVerifiedDiscovery()"');
            console.log('Or use: yarn discover:all');

        } else {
            console.log('❌ No tokens found');
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testFullScan();