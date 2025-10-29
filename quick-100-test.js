// Quick test to get 100 verified tokens fast
require('dotenv').config();
const fs = require('fs');
const path = require('path');

class QuickBlockBerryAPI {
    constructor(apiKey) {
        this.baseUrl = 'https://api.blockberry.one/sui/v1';
        this.apiKey = apiKey;
    }

    async makeRequest(endpoint, params) {
        const url = new URL(`${this.baseUrl}${endpoint}`);
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    url.searchParams.append(key, value.toString());
                }
            });
        }

        const headers = { 'accept': '*/*' };
        if (this.apiKey) {
            headers['x-api-key'] = this.apiKey;
        }

        const response = await fetch(url.toString(), { headers });
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        return response.json();
    }

    async getCoins(page = 0, limit = 100) {
        return this.makeRequest('/coins', {
            page: page.toString(),
            size: limit.toString(),
            orderBy: 'DESC',
            sortBy: 'AGE'
        });
    }

    // Convert BlockBerry token to our enhanced format
    convertToOurFormat(bbToken) {
        return {
            name: bbToken.coinName,
            symbol: bbToken.coinSymbol,
            decimals: bbToken.decimals,
            coinType: bbToken.coinType,
            coinDenom: bbToken.coinDenom,      // ✅ Add coinDenom field
            objectId: bbToken.objectId,
            logoURI: bbToken.imgUrl,
            verified: true,
            verifiedBy: 'blockberry',
            addedAt: new Date().toISOString(),
            tags: ['verified', 'blockberry'],
            extensions: {
                // DEX/Trading specific fields
                price: bbToken.price,
                volume24h: bbToken.totalVolume,
                marketCap: bbToken.marketCap,
                
                // Wallet/DApp specific fields
                holders: bbToken.holdersCount,
                totalSupply: bbToken.supply,
                circulatingSupply: bbToken.circulatingSupply,
                maxSupply: bbToken.maxSupply,
                
                // Metadata fields
                description: bbToken.description,
                
                // Technical fields
                packageId: bbToken.packageId,
                creatorAddress: bbToken.creatorAddress,
                creatorName: bbToken.creatorName,
                createTimestamp: bbToken.createTimestamp,
                
                // Security/Trust fields
                isVerified: bbToken.isVerified,
                isBridged: bbToken.isBridged,
                securityMessage: bbToken.securityMessage,
                
                // Additional BlockBerry fields
                dominance: bbToken.dominance,
                fdv: bbToken.fdv,
                supplyInUsd: bbToken.supplyInUsd,
                creatorImg: bbToken.creatorImg,
                blockberryVerified: true
            },
            version: 1
        };
    }

    // Get exactly 100 verified tokens as fast as possible
    async get100VerifiedTokensFast() {
        console.log('🚀 Getting 100 verified tokens as fast as possible...');
        
        const start = Date.now();
        const verifiedTokens = [];
        let page = 0;
        
        // Since all tokens seem to be verified, we just need 1 page
        console.log('Fetching page 0 (should have 100 verified tokens)...');
        
        const response = await this.getCoins(0, 100);
        const pageTokens = response.content || [];
        const verifiedInPage = pageTokens.filter(token => token.isVerified === true);
        
        console.log(`✓ Got ${pageTokens.length} tokens, ${verifiedInPage.length} verified`);
        
        const elapsed = Date.now() - start;
        console.log(`⚡ Completed in ${elapsed}ms (${(elapsed/1000).toFixed(2)}s)`);
        
        return verifiedInPage.slice(0, 100);
    }
}

async function quickTest100Tokens() {
    console.log('=== Quick 100 Token Test ===\n');
    
    const apiKey = process.env.BLOCKBERRY_API_KEY;
    const api = new QuickBlockBerryAPI(apiKey);
    
    try {
        // Step 1: Get 100 verified tokens
        const verifiedTokens = await api.get100VerifiedTokensFast();
        
        if (verifiedTokens.length === 0) {
            console.log('❌ No verified tokens found');
            return;
        }
        
        console.log(`\n✅ Got ${verifiedTokens.length} verified tokens`);
        
        // Step 2: Convert to our format
        console.log('Converting to our token format...');
        const convertedTokens = verifiedTokens.map(token => api.convertToOurFormat(token));
        
        // Step 3: Show top 10 by volume
        const withVolume = convertedTokens.filter(t => t.extensions.volume24h > 0);
        const topByVolume = withVolume
            .sort((a, b) => b.extensions.volume24h - a.extensions.volume24h)
            .slice(0, 10);
            
        console.log('\n🔥 Top 10 by trading volume:');
        topByVolume.forEach((token, i) => {
            const vol = token.extensions.volume24h ? 
                `$${(token.extensions.volume24h / 1000000).toFixed(1)}M` : '$0M';
            const holders = token.extensions.holders ? 
                token.extensions.holders.toLocaleString() : 'N/A';
            console.log(`${i+1}. ${token.symbol} (${token.name}) - Vol: ${vol}, Holders: ${holders}`);
        });
        
        // Step 4: Save to file
        const outputPath = path.join(process.cwd(), 'data', 'quick-100-tokens.json');
        fs.writeFileSync(outputPath, JSON.stringify(convertedTokens, null, 2));
        console.log(`\n💾 Saved to: ${outputPath}`);
        
        // Step 5: Show stats
        console.log('\n📊 Token Quality Stats:');
        console.log(`- Total tokens: ${convertedTokens.length}`);
        console.log(`- With logos: ${convertedTokens.filter(t => t.logoURI).length}`);
        console.log(`- With volume: ${withVolume.length}`);
        console.log(`- With holders: ${convertedTokens.filter(t => t.extensions.holders > 0).length}`);
        console.log(`- With market cap: ${convertedTokens.filter(t => t.extensions.marketCap > 0).length}`);
        
        // Step 6: Show sample token
        console.log('\n🔍 Sample token structure:');
        const sample = convertedTokens[0];
        console.log(JSON.stringify({
            name: sample.name,
            symbol: sample.symbol,
            verified: sample.verified,
            verifiedBy: sample.verifiedBy,
            logoURI: sample.logoURI ? 'present' : 'missing',
            volume24h: sample.extensions.volume24h,
            holders: sample.extensions.holders
        }, null, 2));
        
        console.log('\n🎉 Ready to add to token list!');
        console.log('Next steps:');
        console.log('1. Review quick-100-tokens.json');
        console.log('2. Copy desired tokens to data/verified-tokens.json');
        console.log('3. Run yarn generate to create final lists');
        
        return convertedTokens;
        
    } catch (error) {
        console.error('❌ Quick test failed:', error);
    }
}

quickTest100Tokens();