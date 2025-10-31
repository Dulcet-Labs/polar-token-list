# Polar Token Service

The core Node.js/TypeScript service for managing Sui blockchain token lists, discovery, and validation.

## 🚀 Quick Start

```bash
# Install dependencies (from monorepo root)
yarn install

# Build the service
yarn token-service build

# Import BlockBerry verified tokens as candidates
yarn token-service import-verified-candidates

# Generate token lists
yarn token-service generate
```

## 📁 Available Lists

- **`dist/all.json`** - All known non-banned tokens on Sui
- **`dist/strict.json`** - Verified tokens only (recommended for most use cases)
- **`dist/banned.json`** - List of known malicious or problematic tokens

## 🔧 Commands

| Command | Description |
|---------|-------------|
| `yarn build` | Compile TypeScript |
| `yarn generate` | Generate all token lists |
| `yarn import-verified-candidates` | Import BlockBerry tokens as candidates |
| `yarn discover` | Discover new tokens |
| `yarn bootstrap` | Initial setup (fetch all tokens) |
| `yarn validate` | Validate token lists |

## 📊 Token Management Workflow

### 1. Import Candidates
```bash
yarn import-verified-candidates
```
Fetches all verified tokens from BlockBerry API as verification candidates.

### 2. Review Candidates
Check `data/tokens.json` for imported candidate tokens with:
- Quality scores (0-100)
- BlockBerry verification status
- Metadata completeness

### 3. Manual Verification
Move approved tokens to `data/verified-tokens.json` and set:
- `verified: true`
- `verifiedBy: "polar-admin"`

### 4. Generate Lists
```bash
yarn generate
```
Creates final token lists in `dist/` directory.

## 🔐 Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Add your BlockBerry API key
BLOCKBERRY_API_KEY=your_api_key_here
```

Get your API key from [BlockBerry.one](https://blockberry.one)

## 📋 Token Schema

Each token includes:

```typescript
{
  name: string;          // e.g., "Sui Token"
  symbol: string;        // e.g., "SUI"
  decimals: number;      // e.g., 9
  objectId: string;      // Sui object ID
  verified: boolean;     // Verification status
  verifiedBy?: string;   // Admin ID
  addedAt: string;       // ISO timestamp
  tags?: string[];       // e.g., ["verified", "blockberry-verified"]
  extensions?: {         // Additional metadata
    website?: string;
    description?: string;
    qualityScore?: number;
    // ... more fields
  };
}
```

## 🧪 Testing & Validation

```bash
# Dry run import (preview only)
yarn import-candidates-dry-run

# Verbose output
yarn import-candidates-verbose

# Validate token lists
yarn validate
```

## 📈 Quality Scoring

Tokens are automatically scored 0-100 based on:
- Metadata completeness
- Logo availability  
- Website/social links
- Trading activity
- Holder count

## 🔍 Discovery Sources

- **BlockBerry API**: Verified tokens from BlockBerry.one
- **SUI RPC**: Direct blockchain token discovery
- **Manual Addition**: Community-submitted tokens

## 📚 Documentation

- [Setup Guide](./SETUP.md) - Detailed setup instructions
- [Schema Documentation](./Schema.md) - Complete token schema
- [Shared Types](../../shared/types/token.ts) - TypeScript interfaces

## 🤝 Integration

The token service integrates with:
- **Admin Interface**: Web dashboard for token management
- **GitHub Actions**: Automated discovery and publishing
- **CDN/Static Hosting**: Token list distribution

---

For more information, see the [main repository README](../../README.md).