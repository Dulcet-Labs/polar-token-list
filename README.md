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

> Note: There are several places a token list may be served from:
> - Raw file in this repository (raw.githubusercontent.com)
> - GitHub Pages / CDN / Static hosting under your domain
> - GitHub API (for programmatic retrieval)
> 
> Below are practical curl and code examples for each case and troubleshooting tips.

### JavaScript/TypeScript

Use the appropriate URL for where you host the list. Example using the repository raw file (replace `main` with your default branch if different):

```javascript
// Example: raw GitHub URL to the strict list (served as raw JSON)
const TOKEN_LIST_URL = "https://raw.githubusercontent.com/Dulcet-Labs/polar-token-list/main/packages/token-service/dist/strict.json";

async function getTokenList() {
  const response = await fetch(TOKEN_LIST_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch token list: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
```

### Command Line (curl)

- Recommended: use raw.githubusercontent.com when pointing to a file in the repo:
```bash
# Raw GitHub-hosted file (read-only)
curl -L -f "https://raw.githubusercontent.com/Dulcet-Labs/polar-token-list/main/packages/token-service/dist/strict.json" | jq
```

- If you have the GitHub "blob" URL (HTML), convert it to raw or use the /raw/ path:
  - Browser blob URL:
    https://github.com/Dulcet-Labs/polar-token-list/blob/main/packages/token-service/dist/strict.json
  - Raw equivalent:
    https://raw.githubusercontent.com/Dulcet-Labs/polar-token-list/main/packages/token-service/dist/strict.json
  - Or:
    https://github.com/Dulcet-Labs/polar-token-list/raw/main/packages/token-service/dist/strict.json

- GitHub API (returns raw content when you request the raw media type):
```bash
curl -H "Accept: application/vnd.github.v3.raw" -L \
  "https://api.github.com/repos/Dulcet-Labs/polar-token-list/contents/packages/token-service/dist/strict.json" \
  -o strict.json
```

- Private repo or rate-limited requests (use a token):
```bash
curl -H "Authorization: token YOUR_GITHUB_TOKEN" -L \
  "https://raw.githubusercontent.com/Dulcet-Labs/polar-token-list/main/packages/token-service/dist/strict.json" \
  -o strict.json
```

Helpful flags:
- -L : follow redirects
- -f : fail on HTTP error codes (so script exits non-zero on 4xx/5xx)
- -sS: silent but show errors

### Troubleshooting

- You get HTML instead of JSON: you're using a "blob" (web) URL. Switch to raw.githubusercontent.com or the /raw/ path.
- 404 Not Found: confirm branch name (main/master), file path, and filename (case-sensitive).
- 401/403: the repo or file is private or you're rate-limited. Use an authenticated request or host the list on a public CDN.
- CORS errors (in browser): CORS is enforced by browsers; curl/server-side fetches ignore CORS. If you need browser access, serve the JSON from a host that sets Access-Control-Allow-Origin: * (e.g., GitHub Pages, your CDN).
- Rate limiting by GitHub API: authenticate with a token or use a CDN to host the published lists.

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