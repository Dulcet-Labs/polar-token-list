# Polar Token List Monorepo

A comprehensive, community-maintained token list for the Sui blockchain, providing standardized token metadata for easy integration into wallets, DEXs, and other dApps.

## 🏗️ Monorepo Structure

This repository contains two main packages:

```
polar-token-list/
├── packages/
│   ├── token-service/          # Node.js/TypeScript token list service
│   │   ├── src/               # Core token list logic
│   │   ├── data/              # Token data files
│   │   ├── dist/              # Generated token lists
│   │   └── README.md          # Token service documentation
│   └── admin-interface/        # React-based admin dashboard
│       ├── src/               # React application
│       ├── public/            # Static assets
│       └── dist/              # Built admin interface
├── shared/                     # Shared types and utilities
│   ├── types/                 # Common TypeScript interfaces
│   ├── utils/                 # Shared utility functions
│   └── configs/               # Shared configurations
└── README.md                  # This file
```

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
- **`all.json`** - All known non-banned tokens on Sui
- **`strict.json`** - Verified tokens only (recommended for most use cases)
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

## 🌐 Usage

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