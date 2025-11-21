// BlockBerry API Integration for SUI Tokens
// https://docs.blockberry.one/reference/coins

export interface BlockBerryToken {
    coinType: string;
    objectId: string;
    coinName: string;
    coinDenom: string;
    decimals: number;
    coinSymbol: string;
    imgUrl?: string;
    description?: string;
    supply?: number;
    supplyInUsd?: number;
    price?: number;
    dominance?: number;
    circulatingSupply?: number;
    marketCap?: number;
    totalVolume?: number;
    maxSupply?: number;
    fdv?: number;
    holdersCount?: number;
    packageId?: string;
    creatorAddress?: string;
    creatorName?: string;
    creatorImg?: string;
    createTimestamp?: number;
    isVerified?: boolean;
    isBridged?: boolean;
    securityMessage?: string;
}

interface BlockBerryResponse {
    content: BlockBerryToken[];
    size: number;
    totalPages: number;
    totalCount: number;
    number: number;
    last: boolean;
    first: boolean;
    numberOfElements: number;
    empty: boolean;
}

export class BlockBerryAPI {
    private baseUrl = 'https://api.blockberry.one/sui/v1';
    private apiKey?: string;

    constructor(apiKey?: string) {
        // Load dotenv if not already loaded
        try {
            require('dotenv').config();
        } catch (e) {
            // dotenv might not be available in all environments
        }

        // Use provided key, or fallback to environment, or use hardcoded key
        this.apiKey = apiKey || process.env.BLOCKBERRY_API_KEY || 'Bg5rMHrJfHWRsywR2eT6cem2jsxT05';

        if (this.apiKey) {
            console.log(`✓ Using API key: ${this.apiKey.substring(0, 8)}...`);
        } else {
            console.log('⚠ No API key found');
        }
    }

    private async makeRequest(endpoint: string, params?: Record<string, any>): Promise<any> {
        const url = new URL(`${this.baseUrl}${endpoint}`);

        // Add query parameters
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    url.searchParams.append(key, value.toString());
                }
            });
        }

        const headers: Record<string, string> = {
            'accept': '*/*',
        };

        // Add API key if provided
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

    // Get all coins with pagination and custom sorting
    async getCoins(page: number = 0, limit: number = 100, sortBy: string = 'AGE', orderBy: string = 'DESC'): Promise<BlockBerryResponse> {
        return this.makeRequest('/coins', {
            page: page.toString(),
            size: limit.toString(),
            orderBy: orderBy,
            sortBy: sortBy
        });
    }

    // Get ALL verified tokens from BlockBerry using 3 parallel requests (OPTIMIZED with early termination)
    async getAllVerifiedTokens(): Promise<BlockBerryToken[]> {
        console.log('🚀 Fetching ALL verified SUI tokens from BlockBerry using parallel batches...');

        const verifiedTokens: BlockBerryToken[] = [];
        const BATCH_SIZE = 3; // Safe parallel batch size
        const BATCH_DELAY = 2000; // 2 second delay between batches
        let totalFetched = 0;
        let currentPage = 0;
        let hasNext = true;
        let consecutiveEmptyBatches = 0; // Track batches with no verified tokens
        const MAX_EMPTY_BATCHES = 5; // Stop after 5 consecutive batches with no verified tokens

        const startTime = Date.now();

        while (hasNext) {
            const batchEnd = currentPage + BATCH_SIZE;
            console.log(`\n📦 Fetching batch: pages ${currentPage}-${batchEnd - 1} (${BATCH_SIZE} parallel requests)`);

            try {
                // Create parallel requests for this batch
                const promises = [];
                for (let page = currentPage; page < batchEnd; page++) {
                    promises.push(this.getCoins(page, 100));
                }

                // Execute parallel requests
                const batchResults = await Promise.all(promises);

                // Process results
                let batchTokenCount = 0;
                let batchVerifiedCount = 0;
                let batchHasNext = false;

                batchResults.forEach((response, index) => {
                    if (response.content && response.content.length > 0) {
                        const pageTokens = response.content;
                        const pageVerified = pageTokens.filter(token => token.isVerified === true);

                        verifiedTokens.push(...pageVerified);
                        batchTokenCount += pageTokens.length;
                        batchVerifiedCount += pageVerified.length;

                        // Check if any page in batch has more data
                        if (!response.last) {
                            batchHasNext = true;
                        }
                    }
                });

                totalFetched += batchTokenCount;
                currentPage = batchEnd;
                hasNext = batchHasNext;

                console.log(`  ✅ Batch completed: ${batchTokenCount} tokens, ${batchVerifiedCount} verified`);
                console.log(`  📊 Total progress: ${verifiedTokens.length} verified tokens from ${totalFetched} total`);

                // Early termination logic
                if (batchVerifiedCount === 0) {
                    consecutiveEmptyBatches++;
                    console.log(`  ⚠️  No verified tokens in this batch (${consecutiveEmptyBatches}/${MAX_EMPTY_BATCHES} empty batches)`);

                    if (consecutiveEmptyBatches >= MAX_EMPTY_BATCHES) {
                        console.log(`  🛑 Stopping early: ${MAX_EMPTY_BATCHES} consecutive batches with no verified tokens`);
                        console.log(`  💡 Likely found all verified tokens (${verifiedTokens.length} total)`);
                        hasNext = false;
                        break;
                    }
                } else {
                    consecutiveEmptyBatches = 0; // Reset counter when we find verified tokens
                }

                // Smart early termination - stop if we have a good amount and recent batches are mostly empty
                if (verifiedTokens.length >= 800 && consecutiveEmptyBatches >= 2) {
                    console.log(`  🎯 Smart stop: Found ${verifiedTokens.length} verified tokens with ${consecutiveEmptyBatches} recent empty batches`);
                    console.log(`  💡 Likely found most/all verified tokens. Stopping to save time.`);
                    hasNext = false;
                    break;
                }

                // Also stop if we've processed a reasonable number of pages and found a good amount
                if (currentPage >= 50 && verifiedTokens.length > 500) {
                    console.log(`  🎯 Smart stop: Found ${verifiedTokens.length} verified tokens in ${currentPage} pages`);
                    console.log(`  💡 This covers most active/verified tokens. Stopping to save time.`);
                    hasNext = false;
                    break;
                }

                // Early stop if we've found a lot of tokens and hit diminishing returns
                if (verifiedTokens.length >= 1000 && currentPage >= 20) {
                    console.log(`  🎯 Excellent coverage: Found ${verifiedTokens.length} verified tokens in ${currentPage} pages`);
                    console.log(`  💡 This is more than expected. Stopping with great results.`);
                    hasNext = false;
                    break;
                }

                // Rate limiting delay between batches
                if (hasNext) {
                    console.log(`  ⏳ Waiting ${BATCH_DELAY}ms before next batch...`);
                    await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
                }

            } catch (error) {
                console.error(`❌ Batch failed at page ${currentPage}:`, error instanceof Error ? error.message : String(error));

                // Fallback to sequential for this batch
                console.log('🔄 Falling back to sequential requests...');
                for (let page = currentPage; page < batchEnd; page++) {
                    try {
                        const response = await this.getCoins(page, 100);
                        if (response.content && response.content.length > 0) {
                            const pageVerified = response.content.filter(token => token.isVerified === true);
                            verifiedTokens.push(...pageVerified);
                            totalFetched += response.content.length;

                            if (response.last) {
                                hasNext = false;
                                break;
                            }
                        }
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    } catch (fallbackError) {
                        console.error(`❌ Fallback failed at page ${page}:`, fallbackError instanceof Error ? fallbackError.message : String(fallbackError));
                        hasNext = false;
                        break;
                    }
                }
                currentPage = batchEnd;
            }
        }

        const elapsed = Date.now() - startTime;
        const rate = verifiedTokens.length / (elapsed / 1000);

        console.log(`\n🎉 COMPLETED: ${verifiedTokens.length} verified tokens from ${totalFetched} total tokens`);
        console.log(`⚡ Time: ${(elapsed / 1000 / 60).toFixed(1)} minutes (${rate.toFixed(1)} verified tokens/sec)`);
        console.log(`📄 Processed ${currentPage} pages (${((currentPage / 1615) * 100).toFixed(1)}% of total database)`);

        return verifiedTokens;
    }

    // Get coins sorted by trading volume (most traded) - using BlockBerry's native sorting
    async getCoinsByVolume(limit: number = 100): Promise<BlockBerryToken[]> {
        console.log(`Fetching top ${limit} tokens by trading volume from BlockBerry...`);

        const allTokens: BlockBerryToken[] = [];
        let page = 0; // Start from page 0
        const tokensPerPage = 100;
        const pagesNeeded = Math.ceil(limit / tokensPerPage);

        for (let currentPage = 0; currentPage < pagesNeeded; currentPage++) {
            try {
                // Use BlockBerry's native VOLUME sorting
                const response = await this.getCoins(currentPage, tokensPerPage, 'VOLUME', 'DESC');

                if (response.content && response.content.length > 0) {
                    allTokens.push(...response.content);
                    console.log(`Page ${currentPage}: Got ${response.content.length} tokens (total: ${allTokens.length})`);

                    // Stop if we have enough tokens or reached the last page
                    if (allTokens.length >= limit || response.last) {
                        break;
                    }

                    // Rate limiting - 1 second delay
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                    break;
                }
            } catch (error) {
                console.error(`Error fetching page ${currentPage}:`, error);
                break;
            }
        }

        // Return only tokens with volume and limit to requested amount
        const tokensWithVolume = allTokens.filter(token => token.totalVolume && token.totalVolume > 0);
        console.log(`✓ Found ${tokensWithVolume.length} tokens with trading volume`);

        return tokensWithVolume.slice(0, limit);
    }

    // Get coins with best trading activity - try multiple sorting strategies
    async getMostUsedTokens(limit: number = 100): Promise<BlockBerryToken[]> {
        console.log(`Fetching top ${limit} most used tokens...`);

        const allTokens: BlockBerryToken[] = [];
        const strategies = [
            { sortBy: 'VOLUME', weight: 0.4 },
            { sortBy: 'HOLDERS', weight: 0.3 },
            { sortBy: 'MARKET_CAP', weight: 0.3 }
        ];

        // Fetch tokens using different sorting strategies
        for (const strategy of strategies) {
            try {
                console.log(`Fetching by ${strategy.sortBy}...`);
                const response = await this.getCoins(0, Math.min(50, limit), strategy.sortBy, 'DESC');

                if (response.content && response.content.length > 0) {
                    // Add strategy weight to tokens
                    const weightedTokens = response.content.map(token => ({
                        ...token,
                        strategyWeight: strategy.weight
                    }));
                    allTokens.push(...weightedTokens);
                }

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`Error fetching by ${strategy.sortBy}:`, error);
            }
        }

        // Remove duplicates and calculate usage score
        const uniqueTokens = new Map();
        allTokens.forEach(token => {
            const key = token.coinType;
            if (!uniqueTokens.has(key)) {
                const usageScore = (token.totalVolume || 0) +
                    ((token.holdersCount || 0) * 1000) +
                    ((token.marketCap || 0) * 0.1);

                uniqueTokens.set(key, {
                    ...token,
                    usageScore
                });
            }
        });

        // Sort by usage score and return top tokens
        const sortedTokens = Array.from(uniqueTokens.values())
            .filter(token => token.usageScore > 0)
            .sort((a, b) => b.usageScore - a.usageScore)
            .slice(0, limit);

        console.log(`✓ Found ${sortedTokens.length} most used tokens`);
        return sortedTokens;
    }

    // Get specific coin details
    async getCoinDetails(coinType: string): Promise<BlockBerryToken | null> {
        try {
            const response = await this.makeRequest(`/coins/${encodeURIComponent(coinType)}`);
            return response.data || null;
        } catch (error) {
            console.error(`Error fetching coin ${coinType}:`, error);
            return null;
        }
    }

    // Convert BlockBerry token to our enhanced format
    convertToOurFormat(bbToken: BlockBerryToken, tokenType: 'verified' | 'candidate' | 'auto-discovered' = 'auto-discovered'): any {
        let verified = false;
        let verifiedBy = '';
        let tags: string[] = [];

        switch (tokenType) {
            case 'verified':
                verified = true;
                verifiedBy = 'blockberry';
                tags = ['verified', 'blockberry'];
                break;
            case 'candidate':
                verified = false;
                verifiedBy = '';
                tags = ['blockberry-verified', 'candidate'];
                break;
            case 'auto-discovered':
            default:
                verified = false;
                verifiedBy = '';
                tags = ['auto-discovered'];
                break;
        }

        // Calculate price change if we have price data
        const priceChange24h = bbToken.price && bbToken.totalVolume ?
            ((bbToken.totalVolume / (bbToken.marketCap || 1)) * 100) : undefined;

        return {
            name: bbToken.coinName,
            symbol: bbToken.coinSymbol,
            decimals: bbToken.decimals,
            coinType: bbToken.coinType,
            coinDenom: bbToken.coinDenom,      // ✅ Add coinDenom field
            objectId: bbToken.objectId,
            logoURI: bbToken.imgUrl,
            verified: verified,
            verifiedBy: verifiedBy,
            addedAt: new Date().toISOString(),
            tags: tags,
            extensions: {
                // DEX/Trading specific fields
                price: bbToken.price,
                volume24h: bbToken.totalVolume,
                marketCap: bbToken.marketCap,
                priceChange24h: priceChange24h,

                // Wallet/DApp specific fields
                holders: bbToken.holdersCount,
                totalSupply: bbToken.supply,
                circulatingSupply: bbToken.circulatingSupply,
                maxSupply: bbToken.maxSupply,

                // Metadata fields
                description: bbToken.description,
                website: undefined, // Not provided by BlockBerry API
                twitter: undefined,
                telegram: undefined,
                discord: undefined,

                // Technical fields
                packageId: bbToken.packageId,
                creatorAddress: bbToken.creatorAddress,
                creatorName: bbToken.creatorName,
                createTimestamp: bbToken.createTimestamp,

                // Security/Trust fields
                isVerified: bbToken.isVerified,
                isBridged: bbToken.isBridged,
                securityMessage: bbToken.securityMessage,
                auditReport: undefined, // Not provided by BlockBerry API

                // Additional BlockBerry specific fields
                dominance: bbToken.dominance,
                fdv: bbToken.fdv, // Fully Diluted Valuation
                supplyInUsd: bbToken.supplyInUsd,
                creatorImg: bbToken.creatorImg,
                blockberryVerified: tokenType === 'verified' || tokenType === 'candidate'
            },
            version: 1
        };
    }

    // Get specific number of verified tokens fast using parallel batches
    async getVerifiedTokensFast(targetCount: number = 1000): Promise<any[]> {
        console.log(`🚀 Fetching ${targetCount} verified tokens using 3 parallel requests...`);

        const verifiedTokens: BlockBerryToken[] = [];
        const BATCH_SIZE = 3;
        const BATCH_DELAY = 2000;
        let currentPage = 0;

        const startTime = Date.now();

        while (verifiedTokens.length < targetCount) {
            console.log(`\n📦 Batch: pages ${currentPage}-${currentPage + BATCH_SIZE - 1} (need ${targetCount - verifiedTokens.length} more tokens)`);

            try {
                const promises = [];
                for (let i = 0; i < BATCH_SIZE; i++) {
                    promises.push(this.getCoins(currentPage + i, 100));
                }

                const batchResults = await Promise.all(promises);
                let batchVerifiedCount = 0;

                batchResults.forEach(response => {
                    if (response.content) {
                        const pageVerified = response.content.filter(token => token.isVerified === true);
                        verifiedTokens.push(...pageVerified);
                        batchVerifiedCount += pageVerified.length;
                    }
                });

                console.log(`  ✅ Got ${batchVerifiedCount} verified tokens (total: ${verifiedTokens.length})`);

                currentPage += BATCH_SIZE;

                // Stop if we have enough
                if (verifiedTokens.length >= targetCount) {
                    break;
                }

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));

            } catch (error) {
                console.error(`❌ Batch failed:`, error instanceof Error ? error.message : String(error));
                break;
            }
        }

        const elapsed = Date.now() - startTime;
        const finalTokens = verifiedTokens.slice(0, targetCount);

        console.log(`\n⚡ Got ${finalTokens.length} verified tokens in ${(elapsed / 1000).toFixed(1)}s`);

        // Convert to our format
        const convertedTokens = finalTokens.map(token => this.convertToOurFormat(token, 'verified'));

        // Sort by trading volume
        const sortedTokens = convertedTokens.sort((a, b) => {
            const volumeA = a.extensions.volume24h || 0;
            const volumeB = b.extensions.volume24h || 0;
            return volumeB - volumeA;
        });

        // Show top 10
        console.log('\n🔥 Top 10 by trading volume:');
        sortedTokens.slice(0, 10).forEach((token, index) => {
            const volume = token.extensions.volume24h;
            const volumeStr = volume ? `$${(volume / 1000000).toFixed(1)}M` : '$0M';
            console.log(`${index + 1}. ${token.symbol} (${token.name}) - ${volumeStr}`);
        });

        return sortedTokens;
    }

    // Get ALL verified tokens for Polar with progress saving
    async getAllVerifiedTokensForPolar(): Promise<any[]> {
        console.log('Fetching ALL verified SUI tokens from BlockBerry with smart termination...');

        try {
            const allTokens = await this.getAllVerifiedTokens();

            // Convert to our format and mark as verified
            const convertedTokens = allTokens.map(token => this.convertToOurFormat(token, 'verified'));

            // Sort by trading volume (most traded first)
            const sortedTokens = convertedTokens.sort((a, b) => {
                const volumeA = a.extensions.volume24h || 0;
                const volumeB = b.extensions.volume24h || 0;
                return volumeB - volumeA;
            });

            console.log(`\n✓ Converted ${sortedTokens.length} verified tokens`);

            // Save intermediate results in case of interruption
            try {
                const fs = require('fs');
                const path = require('path');
                const backupPath = path.join(process.cwd(), 'data', 'verified-tokens-backup.json');
                fs.writeFileSync(backupPath, JSON.stringify(sortedTokens, null, 2));
                console.log(`💾 Backup saved to: ${backupPath}`);
            } catch (saveError) {
                console.log('⚠️  Could not save backup file');
            }

            // Show top 10 by volume
            console.log('\n🔥 Top 10 by trading volume:');
            sortedTokens.slice(0, 10).forEach((token, index) => {
                const volume = token.extensions.volume24h;
                const volumeStr = volume ? `$${(volume / 1000000).toFixed(1)}M` : '$0M';
                console.log(`${index + 1}. ${token.symbol} (${token.name}) - ${volumeStr}`);
            });

            // Show quality stats
            const withVolume = sortedTokens.filter(t => t.extensions.volume24h > 0);
            const withLogos = sortedTokens.filter(t => t.logoURI);
            const withHolders = sortedTokens.filter(t => t.extensions.holders > 0);

            console.log('\n📊 Quality Summary:');
            console.log(`- Total verified tokens: ${sortedTokens.length}`);
            console.log(`- With trading volume: ${withVolume.length} (${((withVolume.length / sortedTokens.length) * 100).toFixed(1)}%)`);
            console.log(`- With logos: ${withLogos.length} (${((withLogos.length / sortedTokens.length) * 100).toFixed(1)}%)`);
            console.log(`- With holders: ${withHolders.length} (${((withHolders.length / sortedTokens.length) * 100).toFixed(1)}%)`);

            return sortedTokens;

        } catch (error) {
            console.error('Error fetching all verified tokens:', error);
            return [];
        }
    }

    // Get top verified tokens by volume (fast method for DEX/wallet apps)
    async getTopVerifiedTokensByVolume(limit: number = 100): Promise<any[]> {
        console.log(`🚀 Fetching top ${limit} verified tokens by trading volume...`);

        try {
            // Use BlockBerry's native VOLUME sorting to get top traded tokens
            const response = await this.getCoins(0, limit, 'VOLUME', 'DESC');

            if (!response.content || response.content.length === 0) {
                console.log('❌ No tokens found');
                return [];
            }

            // Filter for verified tokens only
            const verifiedTokens = response.content.filter(token => token.isVerified === true);
            console.log(`✓ Found ${verifiedTokens.length} verified tokens from ${response.content.length} total`);

            // Convert to our format
            const convertedTokens = verifiedTokens.map(token => this.convertToOurFormat(token, 'verified'));

            // Show top 10 for review
            console.log('\n🔥 Top 10 verified tokens by trading volume:');
            convertedTokens.slice(0, 10).forEach((token, index) => {
                const volume = token.extensions.volume24h;
                const volumeStr = volume ? `$${(volume / 1000000).toFixed(1)}M` : '$0M';
                const holders = token.extensions.holders ? token.extensions.holders.toLocaleString() : 'N/A';
                console.log(`${index + 1}. ${token.symbol} (${token.name}) - Vol: ${volumeStr}, Holders: ${holders}`);
            });

            return convertedTokens;

        } catch (error) {
            console.error('Error fetching top verified tokens:', error);
            return [];
        }
    }

    // Get most traded/used tokens for our token list (legacy method)
    async getTopTokensForPolar(limit: number = 100): Promise<any[]> {
        console.log(`Fetching top ${limit} most traded SUI tokens from BlockBerry...`);

        try {
            // Get tokens by trading volume (most important for DEX)
            const mostTraded = await this.getCoinsByVolume(limit);
            console.log(`Found ${mostTraded.length} tokens with trading volume`);

            // Convert to our format
            const convertedTokens = mostTraded.map(token => this.convertToOurFormat(token, 'auto-discovered'));

            // Show top 10 for review
            console.log('\nTop 10 most traded tokens (24h volume):');
            convertedTokens.slice(0, 10).forEach((token, index) => {
                const volume = token.extensions.volume24h;
                const volumeStr = volume ? `$${(volume / 1000000).toFixed(1)}M` : 'N/A';
                const holders = token.extensions.holders || 'N/A';
                console.log(`${index + 1}. ${token.symbol} (${token.name}) - Vol: ${volumeStr}, Holders: ${holders}`);
            });

            return convertedTokens;

        } catch (error) {
            console.error('Error fetching tokens from BlockBerry:', error);
            return [];
        }
    }

    // Get ALL verified tokens as candidates for Polar verification
    async getAllVerifiedTokensAsCandidates(): Promise<any[]> {
        console.log('Fetching ALL 883 verified SUI tokens from BlockBerry as candidates...');

        try {
            const allTokens = await this.getAllVerifiedTokens();

            // Convert to our format and mark as candidates
            const candidateTokens = allTokens.map(token => this.convertToOurFormat(token, 'candidate'));

            // Sort by trading volume (most traded first)
            const sortedTokens = candidateTokens.sort((a, b) => {
                const volumeA = a.extensions.volume24h || 0;
                const volumeB = b.extensions.volume24h || 0;
                return volumeB - volumeA;
            });

            console.log(`\n✓ Converted ${sortedTokens.length} verified tokens as candidates`);

            // Show top 10 by volume
            console.log('\nTop 10 candidates by trading volume:');
            sortedTokens.slice(0, 10).forEach((token, index) => {
                const volume = token.extensions.volume24h;
                const volumeStr = volume ? `${(volume / 1000000).toFixed(1)}M` : '$0M';
                console.log(`${index + 1}. ${token.symbol} (${token.name}) - ${volumeStr}`);
            });

            return sortedTokens;

        } catch (error) {
            console.error('Error fetching verified tokens as candidates:', error);
            return [];
        }
    }

    // Alternative: Get most used tokens (combines volume, holders, transactions)
    async getMostUsedTokensForPolar(limit: number = 100): Promise<any[]> {
        console.log(`Fetching top ${limit} most used SUI tokens from BlockBerry...`);

        try {
            const mostUsed = await this.getMostUsedTokens(limit);
            console.log(`Found ${mostUsed.length} tokens with usage data`);

            const convertedTokens = mostUsed.map(token => this.convertToOurFormat(token, 'auto-discovered'));

            console.log('\nTop 10 most used tokens (volume + holders + transactions):');
            convertedTokens.slice(0, 10).forEach((token, index) => {
                const volume = token.extensions.volume24h;
                const holders = token.extensions.holders;
                const txs = token.extensions.transactions;
                console.log(`${index + 1}. ${token.symbol} - Vol: $${volume ? (volume / 1000000).toFixed(1) : 0}M, Holders: ${holders || 0}, Txs: ${txs || 0}`);
            });

            return convertedTokens;

        } catch (error) {
            console.error('Error fetching tokens from BlockBerry:', error);
            return [];
        }
    }
}

// CLI runner
export async function runBlockBerryDiscovery(): Promise<void> {
    console.log('=== BlockBerry SUI Token Discovery ===\n');

    // Load environment variables
    try {
        require('dotenv').config();
    } catch (e) {
        // dotenv might not be available
    }

    const api = new BlockBerryAPI(); // Constructor will handle API key loading

    try {
        // Get top 100 verified tokens by trading volume (optimized for DEX/wallet apps)
        const tokens = await api.getTopVerifiedTokensByVolume(100);

        if (tokens.length > 0) {
            console.log(`\n✓ Successfully fetched ${tokens.length} tokens`);

            // Save to file for review
            const fs = require('fs');
            const path = require('path');
            const outputPath = path.join(process.cwd(), 'data', 'blockberry-tokens.json');
            fs.writeFileSync(outputPath, JSON.stringify(tokens, null, 2));

            console.log(`\nTokens saved to: ${outputPath}`);
            console.log('\nNext steps:');
            console.log('1. Review the tokens in blockberry-tokens.json');
            console.log('2. Select verified tokens to add to data/verified-tokens.json');
            console.log('3. Set verified: true for tokens you want in the strict list');
            console.log('4. Run yarn generate to create the final token lists');

            // Show statistics
            const withMarketCap = tokens.filter(t => t.extensions.marketCap > 0).length;
            const withLogos = tokens.filter(t => t.logoURI).length;
            const withWebsites = tokens.filter(t => t.extensions.website).length;

            console.log('\nToken Statistics:');
            console.log(`- Tokens with market cap: ${withMarketCap}`);
            console.log(`- Tokens with logos: ${withLogos}`);
            console.log(`- Tokens with websites: ${withWebsites}`);

        } else {
            console.log('\n❌ No tokens found from BlockBerry API');
        }

    } catch (error) {
        console.error('BlockBerry discovery failed:', error);
        console.log('\nTroubleshooting:');
        console.log('1. Check if BlockBerry API is accessible');
        console.log('2. Consider getting an API key: https://blockberry.one');
        console.log('3. Check rate limits if using public endpoints');
    }
}

// CLI runner for ALL verified tokens using 3 parallel requests (OPTIMIZED)
export async function runAllVerifiedDiscovery(): Promise<void> {
    console.log('=== BlockBerry ALL Verified SUI Tokens (3 Parallel Requests) ===\n');

    // Load environment variables
    try {
        require('dotenv').config();
    } catch (e) {
        // dotenv might not be available
    }

    const api = new BlockBerryAPI(); // Constructor will handle API key loading

    console.log('Estimated time: ~30-45 minutes for full scan\n');

    try {
        console.log('🚀 Starting FULL database scan using 3 parallel requests...');
        console.log('This will scan all ~161,427 tokens across ~1,615 pages');
        console.log('Progress will be shown every batch (3 pages)\n');

        const tokens = await api.getAllVerifiedTokensForPolar();

        if (tokens.length > 0) {
            const fs = require('fs');
            const path = require('path');
            const outputPath = path.join(process.cwd(), 'data', 'all-verified-tokens.json');
            fs.writeFileSync(outputPath, JSON.stringify(tokens, null, 2));

            console.log(`\n🎉 SUCCESS: ALL ${tokens.length} verified tokens saved to: ${outputPath}`);

            // Enhanced statistics
            const withVolume = tokens.filter(t => t.extensions.volume24h > 0);
            const withLogos = tokens.filter(t => t.logoURI);
            const withHolders = tokens.filter(t => t.extensions.holders > 0);
            const withMarketCap = tokens.filter(t => t.extensions.marketCap > 0);

            console.log('\n📊 Complete Token Statistics:');
            console.log(`- Total verified tokens: ${tokens.length}`);
            console.log(`- With trading volume: ${withVolume.length} (${((withVolume.length / tokens.length) * 100).toFixed(1)}%)`);
            console.log(`- With logos: ${withLogos.length} (${((withLogos.length / tokens.length) * 100).toFixed(1)}%)`);
            console.log(`- With holders: ${withHolders.length} (${((withHolders.length / tokens.length) * 100).toFixed(1)}%)`);
            console.log(`- With market cap: ${withMarketCap.length} (${((withMarketCap.length / tokens.length) * 100).toFixed(1)}%)`);

            // Show top performers
            const topByVolume = withVolume.slice(0, 20);
            console.log('\n🏆 Top 20 by trading volume:');
            topByVolume.forEach((token, i) => {
                const vol = `$${(token.extensions.volume24h / 1000000).toFixed(1)}M`;
                const holders = token.extensions.holders ? token.extensions.holders.toLocaleString() : 'N/A';
                console.log(`${i + 1}. ${token.symbol} - Vol: ${vol}, Holders: ${holders}`);
            });

            console.log('\n✅ Next steps:');
            console.log('1. Review all-verified-tokens.json');
            console.log('2. Copy desired tokens to data/verified-tokens.json');
            console.log('3. Run yarn generate to create final token lists');
            console.log('4. Consider filtering by volume/holders for DEX integration');

        } else {
            console.log('\n❌ No verified tokens found');
        }

    } catch (error) {
        console.error('❌ Full verified discovery failed:', error);
        console.log('\nTroubleshooting:');
        console.log('1. Check internet connection');
        console.log('2. Verify API key is valid');
        console.log('3. Try running with smaller batches first');
    }
}

// Alternative CLI runner for most used tokens
export async function runMostUsedDiscovery(): Promise<void> {
    console.log('=== BlockBerry Most Used SUI Tokens ===\n');

    // Load environment variables
    try {
        require('dotenv').config();
    } catch (e) {
        // dotenv might not be available
    }

    const api = new BlockBerryAPI(); // Constructor will handle API key loading

    try {
        const tokens = await api.getMostUsedTokensForPolar(100);

        if (tokens.length > 0) {
            const fs = require('fs');
            const path = require('path');
            const outputPath = path.join(process.cwd(), 'data', 'most-used-tokens.json');
            fs.writeFileSync(outputPath, JSON.stringify(tokens, null, 2));

            console.log(`\n✓ Most used tokens saved to: ${outputPath}`);
        }
    } catch (error) {
        console.error('Most used discovery failed:', error);
    }
}

// ESM module detection
if (import.meta.url === `file://${process.argv[1]}`) {
    runBlockBerryDiscovery();
}