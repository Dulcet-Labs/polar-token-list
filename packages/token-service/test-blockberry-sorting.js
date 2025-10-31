// Test different BlockBerry sorting options
require('dotenv').config();

class BlockBerrySortingTest {
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

        console.log(`🔍 Testing: ${url.toString()}`);
        const response = await fetch(url.toString(), { headers });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        return response.json();
    }

    async testSorting(sortBy, orderBy = 'DESC', limit = 10) {
        try {
            const response = await this.makeRequest('/coins', {
                page: '0',
                size: limit.toString(),
                orderBy: orderBy,
                sortBy: sortBy
            });

            console.log(`\n✅ ${sortBy} (${orderBy}) - Got ${response.content.length} tokens:`);
            
            response.content.slice(0, 5).forEach((token, i) => {
                const vol = token.totalVolume ? `$${(token.totalVolume / 1000000).toFixed(1)}M` : '$0M';
                const holders = token.holdersCount ? token.holdersCount.toLocaleString() : 'N/A';
                const marketCap = token.marketCap ? `$${(token.marketCap / 1000000).toFixed(1)}M` : '$0M';
                console.log(`  ${i+1}. ${token.coinSymbol} - Vol: ${vol}, MC: ${marketCap}, Holders: ${holders}`);
            });
            
            return response.content;
            
        } catch (error) {
            console.log(`❌ ${sortBy} failed: ${error.message}`);
            return [];
        }
    }
}

async function testAllSortingOptions() {
    console.log('=== Testing BlockBerry Sorting Options ===\n');
    
    const apiKey = process.env.BLOCKBERRY_API_KEY;
    const api = new BlockBerrySortingTest(apiKey);
    
    // Test different sorting options
    const sortOptions = [
        'AGE',           // What we used (newest first)
        'VOLUME',        // By trading volume
        'MARKET_CAP',    // By market cap
        'HOLDERS',       // By holder count
        'PRICE',         // By price
        'NAME',          // Alphabetical
        'SYMBOL'         // By symbol
    ];
    
    for (const sortBy of sortOptions) {
        await api.testSorting(sortBy, 'DESC', 10);
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    console.log('\n🎯 Summary:');
    console.log('- AGE: Newest tokens first (what we used)');
    console.log('- VOLUME: Highest trading volume first (best for DEX)');
    console.log('- MARKET_CAP: Largest market cap first');
    console.log('- HOLDERS: Most holders first (popular tokens)');
}

testAllSortingOptions();