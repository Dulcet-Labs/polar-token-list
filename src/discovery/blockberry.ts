import { DiscoveryProvider, DiscoveredCoin } from "./provider";

// Blockberry API Response Types (based on documentation)
interface BlockberryResponse {
  data?: BlockberryCoin[];
  result?: BlockberryCoin[];
  coins?: BlockberryCoin[];
  content?: BlockberryCoin[];
  pagination?: {
    limit?: number;
    offset?: number;
    total?: number;
    page?: number;
    pages?: number;
  };
  // Some endpoints return these at the top level
  size?: number;
  totalPages?: number;
  totalCount?: number;
  page?: number;
}

interface BlockberryCoin {
  coinType?: string;
  coin_type?: string;
  type?: string;
  objectId?: string;
  name?: string;
  coinName?: string; // observed
  symbol?: string;
  coinDenom?: string; // observed
  coinSymbol?: string; // observed
  decimals?: number;
  description?: string;
  iconUrl?: string;
  icon_url?: string;
  imgUrl?: string; // observed
  websiteUrl?: string;
  website_url?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  totalSupply?: string;
  total_supply?: string;
  marketCap?: number;
  market_cap?: number;
  price?: number;
}

export class BlockberryProvider implements DiscoveryProvider {
  name = "Blockberry";
  private readonly baseUrl = "https://blockberry.one";
  private readonly apiKey: string;
  private readonly rateLimitMs: number;

  constructor() {
    this.apiKey = process.env.BLOCKBERRY_API_KEY || '';
    this.rateLimitMs = Number(process.env.RATE_LIMIT_MS) || 200;
    
    if (!this.apiKey) {
      throw new Error('BLOCKBERRY_API_KEY environment variable is required');
    }
  }

  async discover(maxPages = Number.POSITIVE_INFINITY): Promise<DiscoveredCoin[]> {
    console.log(`[${this.name}] Starting token discovery, max pages: ${maxPages}`);
    
    if (!this.apiKey) {
      throw new Error('Blockberry API key not configured');
    }

    const allTokens: DiscoveredCoin[] = [];
    const limit = 100; // Max items per page per Blockberry
    let offset = 0;
    let totalFetched = 0;
    let page = 1;
    let discoveredTotalPages: number | undefined = undefined;
    // If maxPages <= 0, we will fetch all pages (use API reported totalPages)
    const userWantsAll = !isFinite(maxPages) || maxPages <= 0;

    try {
      while (true) {
        console.log(`[${this.name}] Fetching page ${page} (offset: ${offset}, limit: ${limit})...`);
        
        const { coins: pageTokens, totalPages } = await this.fetchTokensPage(offset, limit);
        
        if (pageTokens.length === 0) {
          console.log(`[${this.name}] No more tokens found, stopping`);
          break;
        }

        const validTokens = pageTokens
          .filter(this.isValidToken.bind(this))
          .map(this.convertBlockberryToken.bind(this));

        allTokens.push(...validTokens);
        totalFetched += pageTokens.length;
        
        console.log(
          `[${this.name}] Page ${page}: ${validTokens.length}/${pageTokens.length} valid tokens (total: ${allTokens.length})`
        );

        // Capture totalPages once available
        if (totalPages && !discoveredTotalPages) {
          discoveredTotalPages = totalPages;
          console.log(`[${this.name}] API reports totalPages=${discoveredTotalPages}`);
        }

        // If we got fewer tokens than requested, we've reached the end
        if (pageTokens.length < limit) {
          console.log(`[${this.name}] Reached end of results (got ${pageTokens.length} < ${limit})`);
          break;
        }

        offset += limit;
        page++;

        // Check page cap: either user-defined or API reported
        const cap = userWantsAll
          ? (discoveredTotalPages ?? Number.POSITIVE_INFINITY)
          : Math.min(maxPages, discoveredTotalPages ?? Number.POSITIVE_INFINITY);
        if (page > cap) {
          console.log(`[${this.name}] Reached page cap (${cap}). Stopping.`);
          break;
        }

        // Rate limiting between requests
        if (page <= (discoveredTotalPages ?? Number.POSITIVE_INFINITY)) {
          await new Promise(resolve => setTimeout(resolve, this.rateLimitMs));
        }
      }

      console.log(`[${this.name}] Discovery completed: ${allTokens.length} valid tokens from ${totalFetched} total`);
      return allTokens;

    } catch (error) {
      console.error(`[${this.name}] Discovery failed:`, error);
      throw error;
    }
  }

  private async fetchTokensPage(offset: number, limit: number): Promise<{ coins: BlockberryCoin[]; totalPages?: number; totalCount?: number; }> {
    // Use the correct API endpoint from Blockberry documentation
    const url = 'https://api.blockberry.one/sui/v1/coins';
    
    // Convert offset to page number (page starts from 0)
    const page = Math.floor(offset / limit);
    
    const params = new URLSearchParams({
      page: page.toString(),
      size: limit.toString(),
      orderBy: 'DESC',
      sortBy: 'AGE' // Use AGE as shown in the documentation example
    });

    try {
      const fullUrl = `${url}?${params}`;
      console.log(`[${this.name}] Fetching: ${fullUrl}`);
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'x-api-key': this.apiKey
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText}${errorText ? ' - ' + errorText : ''}`);
      }

      const data = await response.json() as BlockberryResponse | any;
      
      // Debug: Log the actual response structure
      console.log(`[${this.name}] Response keys:`, Object.keys(data));
      console.log(`[${this.name}] Sample response:`, JSON.stringify(data, null, 2).substring(0, 500));
      
      // Handle different response formats
      const coins = (data.data || data.result || data.coins || data.content || []) as BlockberryCoin[];
      const totalPages = (data.totalPages as number | undefined) || data.pagination?.pages;
      const totalCount = (data.totalCount as number | undefined) || data.pagination?.total;
      
      if (!Array.isArray(coins)) {
        console.warn(`[${this.name}] Coins is not an array:`, typeof coins, coins);
        return { coins: [], totalPages, totalCount };
      }

      return { coins, totalPages, totalCount };
    } catch (error) {
      console.error(`[${this.name}] Error fetching page (offset: ${offset}):`, error);
      throw error;
    }
  }

  private isValidToken(token: BlockberryCoin): boolean {
    const objectId = (token.objectId || '').toLowerCase();
    const coinType = token.coinType || token.coin_type || token.type;
    const name = (token.name || token.coinName || '').trim();
    const symbol = (token.symbol || token.coinDenom || token.coinSymbol || '').trim();
    const decimals = typeof token.decimals === 'number' ? token.decimals : undefined;

    const isHexObjectId = /^0x[a-f0-9]+$/.test(objectId);

    return !!(
      isHexObjectId &&
      name &&
      symbol &&
      typeof decimals === 'number' &&
      decimals >= 0 &&
      decimals <= 18 &&
      symbol.length <= 16 &&
      name.length <= 64 &&
      // Filter out obvious test tokens or spam
      !this.isSpamToken({ ...token, name, symbol })
    );
  }

  private isSpamToken(token: BlockberryCoin): boolean {
    const spamIndicators = [
      /test/i,
      /fake/i,
      /scam/i,
      /\$\$\$/,
      /🚀{3,}/, // Multiple rocket emojis
      /\.{3,}/, // Multiple dots
      /^x{3,}$/i, // Just x's
      /admin/i,
    ];

    const textToCheck = `${token.name} ${token.symbol} ${token.description || ''}`;
    return spamIndicators.some(pattern => pattern.test(textToCheck));
  }

  private convertBlockberryToken(token: BlockberryCoin): DiscoveredCoin {
    const coinType = token.coinType || token.coin_type || token.type;
    const iconUrl = token.iconUrl || token.icon_url || token.imgUrl;
    const websiteUrl = token.websiteUrl || token.website_url;
    const name = (token.name || token.coinName || token.coinDenom || token.coinSymbol || 'Unknown').trim();
    const symbol = (token.symbol || token.coinDenom || token.coinSymbol || 'UNKNOWN').trim();
    const objectId = (token.objectId || '').toLowerCase();

    return {
      name,
      symbol,
      decimals: token.decimals || 0,
      objectId,
      logoURI: iconUrl,
      website: websiteUrl,
    };
  }
}
