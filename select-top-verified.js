// Select top verified tokens for the main verified list
const fs = require('fs');
const path = require('path');

function selectTopVerifiedTokens() {
    console.log('🔍 Selecting top verified tokens for main list...\n');
    
    // Read all verified tokens
    const allVerifiedPath = path.join(process.cwd(), 'data', 'all-verified-tokens.json');
    const allTokens = JSON.parse(fs.readFileSync(allVerifiedPath, 'utf8'));
    
    console.log(`📊 Total verified tokens available: ${allTokens.length}`);
    
    // Filter for high-quality tokens suitable for DEX/wallet
    const highQualityTokens = allTokens.filter(token => {
        const ext = token.extensions;
        return (
            // Must have trading volume OR significant holders
            (ext.volume24h > 1000000 || ext.holders > 100) && // $1M+ volume OR 100+ holders
            // Must have logo
            token.logoURI &&
            // Exclude test/fragment tokens
            !token.symbol.includes('FRGMT') &&
            !token.name.toLowerCase().includes('fragment') &&
            !token.name.toLowerCase().includes('test') &&
            !token.symbol.includes('TEST')
        );
    });
    
    console.log(`✨ High-quality tokens: ${highQualityTokens.length}`);
    
    // Sort by a combination of volume and holders (usage score)
    const tokensWithScore = highQualityTokens.map(token => ({
        ...token,
        usageScore: (token.extensions.volume24h || 0) + ((token.extensions.holders || 0) * 10000)
    }));
    
    const sortedTokens = tokensWithScore.sort((a, b) => b.usageScore - a.usageScore);
    
    // Take top 100 for main verified list
    const topTokens = sortedTokens.slice(0, 100);
    
    console.log('\n🏆 Top 20 selected tokens:');
    topTokens.slice(0, 20).forEach((token, i) => {
        const vol = token.extensions.volume24h ? 
            `$${(token.extensions.volume24h / 1000000).toFixed(1)}M` : '$0M';
        const holders = token.extensions.holders ? 
            token.extensions.holders.toLocaleString() : 'N/A';
        console.log(`${i+1}. ${token.symbol} (${token.name}) - Vol: ${vol}, Holders: ${holders}`);
    });
    
    // Save to verified tokens list
    const verifiedPath = path.join(process.cwd(), 'data', 'verified-tokens.json');
    fs.writeFileSync(verifiedPath, JSON.stringify(topTokens, null, 2));
    
    console.log(`\n💾 Saved top ${topTokens.length} tokens to: ${verifiedPath}`);
    
    // Show quality stats
    const withVolume = topTokens.filter(t => t.extensions.volume24h > 0).length;
    const withLogos = topTokens.filter(t => t.logoURI).length;
    const avgVolume = topTokens.reduce((sum, t) => sum + (t.extensions.volume24h || 0), 0) / topTokens.length;
    const avgHolders = topTokens.reduce((sum, t) => sum + (t.extensions.holders || 0), 0) / topTokens.length;
    
    console.log('\n📈 Quality Metrics:');
    console.log(`- Tokens with volume: ${withVolume}/${topTokens.length}`);
    console.log(`- Tokens with logos: ${withLogos}/${topTokens.length}`);
    console.log(`- Average volume: $${(avgVolume / 1000000).toFixed(1)}M`);
    console.log(`- Average holders: ${Math.round(avgHolders).toLocaleString()}`);
    console.log(`- All verified: ${topTokens.every(t => t.verified)}`);
    
    console.log('\n✅ Ready for token list generation!');
    console.log('Next: Run "yarn generate" to create final token lists');
    
    return topTokens;
}

selectTopVerifiedTokens();