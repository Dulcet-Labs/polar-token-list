import { readFileSync } from 'fs';
import { join } from 'path';

// SUI RPC Configuration
const SUI_RPC_ENDPOINTS = [
  'https://fullnode.mainnet.sui.io:443',
  'https://sui-mainnet-endpoint.blockvision.org',
  'https://sui-mainnet.nodeinfra.com'
];

interface SuiTokenMetadata {
  objectId: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  description?: string;
  iconUrl?: string;
  supply?: string;
}

interface TokenDiscoverySource {
  name: string;
  url: string;
  method: 'api' | 'scrape' | 'manual';
  priority: number;
}

export class SuiTokenDiscovery {
  private rpcEndpoint: string;
  
  constructor(rpcEndpoint?: string) {
    this.rpcEndpoint = rpcEndpoint || SUI_RPC_ENDPOINTS[0];
  }
  
  // Get token metadata from SUI RPC
  async getTokenMetadata(objectId: string): Promise<SuiTokenMetadata | null> {
    try {
      const response = await fetch(this.rpcEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'suix_getCoinMetadata',
          params: [objectId]
        })
      });
      
      const data: any = await response.json();
      
      if (data.result) {
        return {
          objectId,
          name: data.result.name,
          symbol: data.result.symbol,
          decimals: data.result.decimals,
          description: data.result.description,
          iconUrl: data.result.icon_url
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching metadata for ${objectId}:`, error);
      return null;
    }
  }
  
  // Validate that a token exists on SUI
  async validateToken(objectId: string): Promise<boolean> {
    const metadata = await this.getTokenMetadata(objectId);
    return metadata !== null;
  }
  
  // Get discovery sources for finding popular tokens
  static getDiscoverySources(): TokenDiscoverySource[] {
    return [
      {
        name: 'Cetus DEX',
        url: 'https://api-sui.cetus.zone/v2/sui/pools',
        method: 'api',
        priority: 1
      },
      {
        name: 'Turbos Finance',
        url: 'https://api.turbos.finance/pools',
        method: 'api', 
        priority: 1
      },
      {
        name: 'SuiSwap',
        url: 'https://suiswap.app/api/tokens',
        method: 'api',
        priority: 2
      },
      {
        name: 'DeepBook',
        url: 'https://deepbook.tech/api/pools',
        method: 'api',
        priority: 1
      },
      {
        name: 'SuiScan Coins',
        url: 'https://suiscan.xyz/mainnet/coins',
        method: 'scrape',
        priority: 2
      },
      {
        name: 'CoinGecko SUI',
        url: 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=sui-ecosystem',
        method: 'api',
        priority: 3
      }
    ];
  }
  
  // Fetch tokens from Cetus DEX (major SUI DEX)
  async fetchCetusTokens(): Promise<string[]> {
    try {
      console.log('Fetching tokens from Cetus DEX...');
      const response = await fetch('https://api-sui.cetus.zone/v2/sui/pools');
      const data: any = await response.json();
      
      const tokenIds = new Set<string>();
      
      if (data.data && Array.isArray(data.data.lp_list)) {
        data.data.lp_list.forEach((pool: any) => {
          if (pool.coin_a?.address) tokenIds.add(pool.coin_a.address);
          if (pool.coin_b?.address) tokenIds.add(pool.coin_b.address);
        });
      }
      
      return Array.from(tokenIds);
    } catch (error) {
      console.error('Error fetching Cetus tokens:', error);
      return [];
    }
  }
  
  // Discover top tokens by combining multiple sources
  async discoverTopTokens(limit: number = 100): Promise<SuiTokenMetadata[]> {
    console.log(`Discovering top ${limit} SUI tokens...`);
    
    const allTokenIds = new Set<string>();
    const validTokens: SuiTokenMetadata[] = [];
    
    // Add native SUI
    allTokenIds.add('0x2::sui::SUI');
    
    // Fetch from Cetus (major DEX)
    const cetusTokens = await this.fetchCetusTokens();
    cetusTokens.forEach(id => allTokenIds.add(id));
    
    console.log(`Found ${allTokenIds.size} unique token IDs from sources`);
    
    // Validate and get metadata for each token
    let processed = 0;
    for (const tokenId of allTokenIds) {
      if (validTokens.length >= limit) break;
      
      processed++;
      console.log(`Processing token ${processed}/${allTokenIds.size}: ${tokenId.slice(0, 20)}...`);
      
      const metadata = await this.getTokenMetadata(tokenId);
      if (metadata && metadata.name && metadata.symbol) {
        validTokens.push(metadata);
        console.log(`✓ Added: ${metadata.symbol} (${metadata.name})`);
      } else {
        console.log(`✗ Invalid metadata for ${tokenId}`);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\nDiscovered ${validTokens.length} valid tokens`);
    return validTokens;
  }
}

// CLI tool for token discovery
export async function runTokenDiscovery(): Promise<void> {
  const discovery = new SuiTokenDiscovery();
  
  console.log('=== SUI Token Discovery ===\n');
  
  const sources = SuiTokenDiscovery.getDiscoverySources();
  console.log('Available sources:');
  sources.forEach(source => {
    console.log(`  - ${source.name} (${source.method}, priority: ${source.priority})`);
  });
  
  console.log('\nStarting token discovery...\n');
  
  try {
    const tokens = await discovery.discoverTopTokens(100);
    
    console.log(`\n=== Discovery Complete ===`);
    console.log(`Found ${tokens.length} valid tokens`);
    
    // Save discovered tokens for review
    const outputPath = join(process.cwd(), 'data', 'discovered-tokens-temp.json');
    require('fs').writeFileSync(outputPath, JSON.stringify(tokens, null, 2));
    
    console.log(`\nTokens saved to: ${outputPath}`);
    console.log('\nNext steps:');
    console.log('1. Review the discovered tokens');
    console.log('2. Add verified ones to data/verified-tokens.json');
    console.log('3. Run yarn generate to create token lists');
    
  } catch (error) {
    console.error('Discovery failed:', error);
  }
}

if (require.main === module) {
  runTokenDiscovery();
}