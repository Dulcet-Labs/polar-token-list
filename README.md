# Polar Token List

A comprehensive, community-maintained token list for the Sui blockchain, providing standardized token metadata for easy integration into wallets, DEXs, and other dApps.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Yarn 4.5.2+

### Installation
```bash
# Install all dependencies
yarn install

# Build both packages
yarn build
```

### Development

#### Token Service
```bash
# Import BlockBerry verified tokens as candidates
yarn import-candidates

# Generate token lists (all.json, strict.json)
yarn generate-lists

# Discover new tokens
yarn discover

# Validate token lists
yarn validate
```

#### Admin Interface
```bash
# Start the admin dashboard
yarn dev

# Build for production
yarn admin build
```

## 📦 Packages

### Token Service (`@polar/token-service`)

The core Node.js service that manages token discovery, validation, and list generation.

**Key Features:**
- BlockBerry API integration for verified tokens
- Token quality scoring and validation
- Multiple token list formats (all, strict, banned)
- Automated discovery and import workflows

**Available Lists:**
- **`all.json`** - All known non-banned tokens on Sui (879 tokens)
- **`strict.json`** - Manually curated verified tokens (3 tokens)
- **`polar-verified.json`** - Tokens verified by Polar team (16 tokens)
- **`banned.json`** - List of known malicious or problematic tokens

[📖 Token Service Documentation](./packages/token-service/README.md)

### Admin Interface (`@polar/admin-interface`)

A React-based web dashboard for managing token verification and reviewing candidates.

**Key Features:**
- Web-based token candidate review
- Bulk approve/reject operations
- Quality score filtering and sorting
- Real-time token list management

[📖 Admin Interface Documentation](./packages/admin-interface/README.md)

## 🔧 Workspace Commands

| Command | Description |
|---------|-------------|
| `yarn build` | Build both packages |
| `yarn dev` | Start admin interface in development |
| `yarn generate-lists` | Generate token lists |
| `yarn import-candidates` | Import BlockBerry tokens as candidates |
| `yarn discover` | Discover new tokens |
| `yarn validate` | Validate all token lists |

## 🌐 Live Token Lists

**🚀 Production Endpoints (GitHub Pages)**

All token lists are automatically deployed and available at:

- **All Tokens**: `https://dulcet-labs.github.io/polar-token-list/all.json`
- **Strict Tokens**: `https://dulcet-labs.github.io/polar-token-list/strict.json`  
- **Polar Verified**: `https://dulcet-labs.github.io/polar-token-list/polar-verified.json`
- **Banned Tokens**: `https://dulcet-labs.github.io/polar-token-list/banned.json`

**📊 Browse Lists**: Visit [https://dulcet-labs.github.io/polar-token-list/](https://dulcet-labs.github.io/polar-token-list/) for a web interface showing all available lists.

### JavaScript/TypeScript Integration

```javascript
// Fetch all tokens (879 tokens from BlockBerry)
const allTokens = await fetch('https://dulcet-labs.github.io/polar-token-list/all.json')
  .then(r => r.json());

// Fetch strict curated tokens (3 manually verified)
const strictTokens = await fetch('https://dulcet-labs.github.io/polar-token-list/strict.json')
  .then(r => r.json());

// Fetch Polar team verified tokens (16 tokens)
const polarTokens = await fetch('https://dulcet-labs.github.io/polar-token-list/polar-verified.json')
  .then(r => r.json());

// All lists use the same format
console.log(`All: ${allTokens.tokens.length} tokens`);
console.log(`Strict: ${strictTokens.tokens.length} tokens`);
console.log(`Polar: ${polarTokens.tokens.length} tokens`);

// Example: Filter tokens by symbol
const suiToken = allTokens.tokens.find(token => token.symbol === 'SUI');
console.log(suiToken);
```

### Command Line Usage

```bash
# Test all endpoints
curl -s "https://dulcet-labs.github.io/polar-token-list/all.json" | jq '.name, (.tokens | length)'
curl -s "https://dulcet-labs.github.io/polar-token-list/strict.json" | jq '.name, (.tokens | length)'
curl -s "https://dulcet-labs.github.io/polar-token-list/polar-verified.json" | jq '.name, (.tokens | length)'
curl -s "https://dulcet-labs.github.io/polar-token-list/banned.json" | jq '.name, (.banned | length)'

# Get specific token info
curl -s "https://dulcet-labs.github.io/polar-token-list/strict.json" | jq '.tokens[0]'
```

### DEX/Wallet Integration

```javascript
// Example: Load token list for a DEX interface
class TokenListManager {
  constructor() {
    this.baseUrl = 'https://dulcet-labs.github.io/polar-token-list/';
  }

  async loadTokenList(type = 'strict') {
    const response = await fetch(`${this.baseUrl}${type}.json`);
    const data = await response.json();
    return data.tokens;
  }

  async getVerifiedTokens() {
    return this.loadTokenList('strict');
  }

  async getAllTokens() {
    return this.loadTokenList('all');
  }

  async getBannedTokens() {
    const response = await fetch(`${this.baseUrl}banned.json`);
    const data = await response.json();
    return data.banned;
  }
}
```

### Updates & Caching

- **Auto-updates**: Lists refresh automatically when the team pushes changes
- **Caching**: GitHub Pages caches for ~5-10 minutes
- **CORS**: All endpoints include CORS headers for browser access
- **Reliability**: 99.9% uptime via GitHub's CDN

## 🔐 Environment Setup

Create environment files for each package:

```bash
# Token service environment
cp packages/token-service/.env.example packages/token-service/.env
# Add your BlockBerry API key

# Admin interface environment (if needed)
cp packages/admin-interface/.env.example packages/admin-interface/.env
```

## 🧪 Development Workflow

1. **Token Discovery**: Use the token service to discover and import new tokens
2. **Quality Review**: Use the admin interface to review token candidates
3. **Verification**: Approve high-quality tokens through the admin dashboard
4. **List Generation**: Generate final token lists for distribution

## 📚 Documentation

- [Token Service Setup](./packages/token-service/SETUP.md)
- [Token Schema](./packages/token-service/Schema.md)
- [Shared Types](./shared/types/token.ts)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes in the appropriate package
4. Test your changes
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and feature requests, please [open an issue](https://github.com/your-org/polar-token-list/issues).

---

**Built with ❤️ for the Sui ecosystem**