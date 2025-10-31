// Test the improved BlockBerry API with native volume sorting
require('dotenv').config();

// Import the improved BlockBerry API
const { BlockBerryAPI } = require('./dist/discovery/blockberry-api.js');

async function testImprovedAPI() {
    console.log('=== Testing Improved BlockBerry API ===\n');
    
    const apiKey = process.env.BLOCKBERRY_API_KEY;
    const api = new BlockBerryAPI(apiKey);
    
    try {
        console.log('🚀 Testing new getTopVerifiedTokensByVolume method...');
        const start = Date.now();
        
        // Get top 50 verified tokens by volume (should be much faster)
        const tokens = await api.getTopVerifiedTokensByVolume(50);
        
        const elapsed = Date.now() - start;
        console.log(`\n⚡ Completed in ${(elapsed/1000).toFixed(2)}s`);
        
        if (tokens.length > 0) {
            console.log(`✅ Got ${tokens.length} verified tokens`);
            
            // Save to file
            const fs = require('fs');
            const path = require('path');
            const outputPath = path.join(process.cwd(), 'data', 'improved-blockberry-tokens.json');
            fs.writeFileSync(outputPath, JSON.stringify(tokens, null, 2));
            
            console.log(`💾 Saved to: ${outputPath}`);
            
            // Show quality stats
            const withVolume = tokens.filter(t => t.extensions.volume24h > 0).length;
            const withLogos = tokens.filter(t => t.logoURI).length;
            const avgVolume = tokens.reduce((sum, t) => sum + (t.extensions.volume24h || 0), 0) / tokens.length;
            
            console.log('\n📊 Quality Stats:');
            console.log(`- Tokens with volume: ${withVolume}/${tokens.length}`);
            console.log(`- Tokens with logos: ${withLogos}/${tokens.length}`);
            console.log(`- Average volume: $${(avgVolume / 1000000).toFixed(1)}M`);
            console.log(`- All verified: ${tokens.every(t => t.verified)}`);
            
        } else {
            console.log('❌ No tokens found');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testImprovedAPI();