// Quick test to see BlockBerry data structure and optimization options

// Simple BlockBerry API test class
class BlockBerryAPI {
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

        console.log(`Fetching: ${url.toString()}`);
        const response = await fetch(url.toString(), { headers });

        if (!response.ok) {
            throw new Error(`BlockBerry API error: ${response.status} ${response.statusText}`);
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
}

async function testBlockBerryData() {
    console.log('=== Testing BlockBerry API - Single Page ===\n');
    
    // Load environment variables
    require('dotenv').config();
    const apiKey = process.env.BLOCKBERRY_API_KEY || 'Bg5rMHrJfHWRsywR2eT6cem2jsxT05';
    console.log(`Using API key: ${apiKey ? apiKey.substring(0, 8) + '...' : 'None'}`);
    
    const api = new BlockBerryAPI(apiKey);
    
    try {
        // Test 1: Get just one page to see data structure
        console.log('1. Testing single page (100 tokens)...');
        const response = await api.getCoins(0, 100); // page 0, size 100
        
        console.log(`Response structure:`);
        console.log(`- Total pages: ${response.totalPages}`);
        console.log(`- Total count: ${response.totalCount}`);
        console.log(`- Current page: ${response.number}`);
        console.log(`- Tokens in this page: ${response.content.length}`);
        console.log(`- Is last page: ${response.last}`);
        
        // Check verification status
        const verifiedCount = response.content.filter(token => token.isVerified === true).length;
        console.log(`- Verified tokens in this page: ${verifiedCount}`);
        
        // Show first 3 tokens to see data structure
        console.log('\nFirst 3 tokens:');
        response.content.slice(0, 3).forEach((token, i) => {
            console.log(`${i + 1}. ${token.coinSymbol} (${token.coinName})`);
            console.log(`   - Verified: ${token.isVerified}`);
            console.log(`   - Volume: ${token.totalVolume || 'N/A'}`);
            console.log(`   - Holders: ${token.holdersCount || 'N/A'}`);
            console.log(`   - Market Cap: ${token.marketCap || 'N/A'}`);
        });
        
        // Test 2: Check if we can increase page size
        console.log('\n2. Testing larger page size (500 tokens)...');
        try {
            const largeResponse = await api.getCoins(0, 500);
            console.log(`✓ Large page works: ${largeResponse.content.length} tokens`);
            
            // Test even larger
            console.log('\n3. Testing maximum page size (1000 tokens)...');
            const maxResponse = await api.getCoins(0, 1000);
            console.log(`✓ Max page works: ${maxResponse.content.length} tokens`);
            
        } catch (error) {
            console.log(`❌ Large page failed: ${error.message}`);
        }
        
        // Test 3: Check API rate limits
        console.log('\n4. Testing rapid requests (no delay)...');
        const start = Date.now();
        const promises = [];
        for (let i = 0; i < 3; i++) {
            promises.push(api.getCoins(i, 100));
        }
        
        try {
            const results = await Promise.all(promises);
            const elapsed = Date.now() - start;
            console.log(`✓ 3 parallel requests completed in ${elapsed}ms`);
            console.log(`Total tokens fetched: ${results.reduce((sum, r) => sum + r.content.length, 0)}`);
        } catch (error) {
            console.log(`❌ Parallel requests failed: ${error.message}`);
        }
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run the test
testBlockBerryData();