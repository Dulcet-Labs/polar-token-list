# Polar Token List

A comprehensive, community-maintained token list for the Sui blockchain, providing standardized token metadata for easy integration into wallets, DEXs, and other dApps.

## Available Lists

- **`all.json`** - All known non-banned tokens on Sui
- **`strict.json`** - Verified tokens only (recommended for most use cases)
- **`banned.json`** - List of known malicious or problematic tokens

## Usage

### JavaScript/TypeScript

```javascript
const TOKEN_LIST_URL = "https://your-domain.com/polar-token-list/strict.json";

async function getTokenList() {
  const response = await fetch(TOKEN_LIST_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch token list: ${response.statusText}`);
  }
  return response.json();
}
```

### Command Line

```bash
# Get token list info
curl -sSL https://your-domain.com/polar-token-list/strict.json | jq
```

## Token List Structure

Each token list includes:

```typescript
{
  name: string;          // e.g., "Polar Token List"
  chain: string;         // "sui"
  updatedAt: string;     // ISO timestamp of last update
  tokens: Token[];       // Array of token objects
  filters?: string[];    // e.g., ["verified"]
}
```

## Verification Policy

- **Strict List** includes only tokens with `verified: true`
- Verification is done manually by trusted admins
- Each verified token includes:
  - `verified: true`
  - `verifiedBy`: Admin ID
  - Additional metadata (website, socials, etc.)

## Token Import & Management

### Import BlockBerry Verified Tokens

Import all 883 verified tokens from BlockBerry as verification candidates:

```bash
# Basic import
yarn import-verified-candidates

# Dry run (preview what would be imported)
yarn import-candidates-dry-run

# Verbose output with detailed progress
yarn import-candidates-verbose

# Custom tokens file location
yarn import-verified-candidates --tokens-file ./custom-tokens.json
```

### Environment Setup

Create a `.env` file with your BlockBerry API key for better rate limits:

```bash
BLOCKBERRY_API_KEY=your_api_key_here
```

Get your API key from [BlockBerry.one](https://blockberry.one)

### Token Verification Workflow

1. **Import candidates**: Run `yarn import-verified-candidates` to fetch BlockBerry verified tokens
2. **Review candidates**: Check `data/tokens.json` for imported candidate tokens
3. **Manual verification**: Move approved tokens to `data/verified-tokens.json` and set:
   - `verified: true`
   - `verifiedBy: "polar-admin"`
4. **Generate lists**: Run `yarn generate` to create final token lists

## Support

For issues and feature requests, please [open an issue](https://github.com/your-org/polar-token-list/issues).
