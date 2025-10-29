// Test the new 3 parallel request implementation
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Simple test class using the same 3 parallel approach
class ThreeParallelAPI {
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

    // Get verified tokens using 3 parallel requests
    async getVerifiedTokensParallel(targetCount = 500) {
        console.log(`🚀 Getting ${targetCount} verified tokens using 3 parallel requests...`);
        
        const verifiedTokens = [];
        const BATCH_SIZE = 3;
        const BATCH_DELAY = 2000; // 2 seconds
        let currentPage = 0;
        
        const startTime = Date.now();

        while (verifiedTokens.length < targetCount) {
            console.log(`\n📦 Fetching batch: pages ${currentPage}-${currentPage + BATCH_SIZE - 1}`);
            console.log(`   Need ${targetCount - verifiedTokens.length} more verified tokens`);

            try {
                // Create 3 parallel requests
                const promises = [];
                for (let i = 0; i < BATCH_SIZE; i++) {
                    promises.push(this.getCoins(currentPage + i, 100));
                }

                // Execute in parallel
                const batchStart = Date.now();
                const batchResults = await Promise.all(promises);
                const batchTime = Date.now() - batchStart;

                // Process results
                let batchTokenCount = 0;
                let batchVerifiedCount = 0;

                batchResults.forEach((response, index) => {
                    if (response.content) {
                        const pageTokens = response.content;
                        const pageVerified = pageTokens.filter(token => token.isVerified === true);
                        
                        verifiedTokens.push(...pageVerified);
                        batchTokenCount += pageTokens.length;
                        batchVerifiedCount += pageVerified.length;
                        
                        console.log(`   Page ${currentPage + index}: ${pageTokens.length} tokens, ${pageVerified.length} verified`);
                    }
                });

                console.log(`  ✅ Batch completed in ${batchTime}ms: ${batchVerifiedCount} verified tokens`);
                console.log(`  📊 Total progress: ${verifiedTokens.length}/${targetCount} verified tokens`);

                currentPage += BATCH_SIZE;

                // Stop if we have enough
                if (verifiedTokens.length >= targetCount) {
                    console.log(`✓ Reached target of ${targetCount} tokens!`);
                    break;
                }

                // Rate limiting delay
                console.log(`  ⏳ Waiting ${BATCH_DELAY}ms...`);
                await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));

            } catch (error) {
                console.error(`❌ Batch failed:`, error.message);
                break;
            }
        }

        const elapsed = Date.now() - startTime;
        const finalTokens = verifiedTokens.slice(0, targetCount);
        
        console.log(`\n🎉 COMPLETED!`);
        console.log(`⚡ Got ${finalTokens.length} verified tokens in ${(elapsed/1000).toFixed(1)}s`);
        console.log(`📈 Rate: ${(finalTokens.length / (elapsed/1000)).toFixed(1)} verified tokens/sec`);
        
        return finalTokens;
    }
}

async function test3ParallelRequests() {
    console.log('=== Testing 3 Parallel Requests Implementation ===\n');
    
    const apiKey = process.env.BLOCKBERRY_API_KEY;
    const api = new ThreeParallelAPI(apiKey);
    
    try {
        // Test with 300 tokens (should take ~3 batches)
        const verifiedTokens = await api.getVerifiedTokensParallel(300);
        
        if (verifiedTokens.length > 0) {
            // Show quality stats
            const withVolume = verifiedTokens.filter(t => t.totalVolume > 0).length;
            const withLogos = verifiedTokens.filter(t => t.imgUrl).length;
            const withHolders = verifiedTokens.filter(t => t.holdersCount > 0).length;
            
            console.log('\n📊 Quality Stats:');
            console.log(`- Total verified tokens: ${verifiedTokens.length}`);
            console.log(`- With trading volume: ${withVolume}`);
            console.log(`- With logos: ${withLogos}`);
            console.log(`- With holders: ${withHolders}`);
            
            // Show top 5 by volume
            const topByVolume = verifiedTokens
                .filter(t => t.totalVolume > 0)
                .sort((a, b) => b.totalVolume - a.totalVolume)
                .slice(0, 5);
                
            console.log('\n🔥 Top 5 by volume:');
            topByVolume.forEach((token, i) => {
                const vol = `$${(token.totalVolume / 1000000).toFixed(1)}M`;
                const holders = token.holdersCount ? token.holdersCount.toLocaleString() : 'N/A';
                console.log(`${i+1}. ${token.coinSymbol} - Vol: ${vol}, Holders: ${holders}`);
            });
            
            // Save results
            const outputPath = path.join(process.cwd(), 'data', '3-parallel-test-results.json');
            fs.writeFileSync(outputPath, JSON.stringify(verifiedTokens, null, 2));
            console.log(`\n💾 Saved ${verifiedTokens.length} tokens to: ${outputPath}`);
            
        } else {
            console.log('❌ No verified tokens found');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

test3ParallelRequests();