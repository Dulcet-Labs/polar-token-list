// Test optimal parallel request count for BlockBerry
require('dotenv').config();

class ParallelBlockBerryAPI {
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

    // Test different parallel batch sizes
    async testParallelBatches() {
        const batchSizes = [2, 3, 4, 5];
        
        for (const batchSize of batchSizes) {
            console.log(`\n=== Testing ${batchSize} parallel requests ===`);
            
            try {
                const start = Date.now();
                const promises = [];
                
                for (let i = 0; i < batchSize; i++) {
                    promises.push(this.getCoins(i, 100));
                }
                
                const results = await Promise.all(promises);
                const elapsed = Date.now() - start;
                const totalTokens = results.reduce((sum, r) => sum + (r.content?.length || 0), 0);
                const verifiedCount = results.reduce((sum, r) => 
                    sum + (r.content?.filter(t => t.isVerified)?.length || 0), 0);
                
                console.log(`✅ SUCCESS: ${batchSize} requests in ${elapsed}ms`);
                console.log(`   - Total tokens: ${totalTokens}`);
                console.log(`   - Verified tokens: ${verifiedCount}`);
                console.log(`   - Rate: ${(totalTokens / (elapsed/1000)).toFixed(0)} tokens/sec`);
                
                // Small delay before next test
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                console.log(`❌ FAILED: ${batchSize} requests - ${error.message}`);
            }
        }
    }

    // Optimized fetching with safe parallel batches
    async getVerifiedTokensOptimized(targetTokens = 1000) {
        console.log(`\n=== Fetching ${targetTokens} verified tokens optimized ===`);
        
        const SAFE_BATCH_SIZE = 3; // Based on our testing
        const BATCH_DELAY = 5000; // 5 second delay between batches
        
        const allVerifiedTokens = [];
        const tokensPerPage = 100;
        const pagesNeeded = Math.ceil(targetTokens / tokensPerPage);
        
        console.log(`Need ~${pagesNeeded} pages, using batches of ${SAFE_BATCH_SIZE}`);
        
        const start = Date.now();
        
        for (let startPage = 0; startPage < pagesNeeded; startPage += SAFE_BATCH_SIZE) {
            const batchEnd = Math.min(startPage + SAFE_BATCH_SIZE, pagesNeeded);
            const batchSize = batchEnd - startPage;
            
            console.log(`Fetching batch: pages ${startPage}-${batchEnd-1} (${batchSize} requests)`);
            
            try {
                const promises = [];
                for (let page = startPage; page < batchEnd; page++) {
                    promises.push(this.getCoins(page, 100));
                }
                
                const batchResults = await Promise.all(promises);
                const batchTokens = batchResults.flatMap(r => r.content || []);
                const batchVerified = batchTokens.filter(t => t.isVerified);
                
                allVerifiedTokens.push(...batchVerified);
                
                console.log(`  ✓ Got ${batchTokens.length} tokens, ${batchVerified.length} verified (total: ${allVerifiedTokens.length})`);
                
                // Stop if we have enough
                if (allVerifiedTokens.length >= targetTokens) {
                    console.log(`✓ Reached target of ${targetTokens} tokens`);
                    break;
                }
                
                // Delay between batches
                if (batchEnd < pagesNeeded) {
                    console.log(`  Waiting ${BATCH_DELAY}ms...`);
                    await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
                }
                
            } catch (error) {
                console.error(`❌ Batch failed:`, error.message);
                break;
            }
        }
        
        const elapsed = Date.now() - start;
        console.log(`\n🎉 Completed: ${allVerifiedTokens.length} verified tokens in ${(elapsed/1000).toFixed(1)}s`);
        console.log(`   Rate: ${(allVerifiedTokens.length / (elapsed/1000)).toFixed(1)} verified tokens/sec`);
        
        return allVerifiedTokens.slice(0, targetTokens);
    }
}

async function testParallelOptimization() {
    console.log('=== BlockBerry Parallel Optimization Test ===');
    
    const apiKey = process.env.BLOCKBERRY_API_KEY;
    const api = new ParallelBlockBerryAPI(apiKey);
    
    try {
        // Test 1: Find optimal batch size
        await api.testParallelBatches();
        
        // Test 2: Use optimal approach to fetch 500 verified tokens
        const verifiedTokens = await api.getVerifiedTokensOptimized(500);
        
        if (verifiedTokens.length > 0) {
            console.log('\n=== Results Analysis ===');
            const withVolume = verifiedTokens.filter(t => t.totalVolume > 0);
            console.log(`Tokens with volume: ${withVolume.length}/${verifiedTokens.length}`);
            
            // Top 5 by volume
            const top5 = withVolume
                .sort((a, b) => b.totalVolume - a.totalVolume)
                .slice(0, 5);
                
            console.log('\nTop 5 by volume:');
            top5.forEach((token, i) => {
                const vol = `$${(token.totalVolume / 1000000).toFixed(1)}M`;
                console.log(`${i+1}. ${token.coinSymbol} - ${vol}`);
            });
        }
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testParallelOptimization();