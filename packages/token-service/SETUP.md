# Polar Token List - Setup Guide

This guide will help you bootstrap the token list with all 100k+ Sui tokens and set up automated discovery.

## Quick Start

### 1. Get Blockberry API Key

1. Go to [Blockberry.one](https://blockberry.one/)
2. Sign up for an account
3. Get your API key from the dashboard

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env file and add your API key
# BLOCKBERRY_API_KEY=your_actual_api_key_here
```

### 3. Install Dependencies

```bash
yarn install
```

### 4. Bootstrap All Tokens (One-time)

This will fetch ALL tokens from the Sui network (~100k tokens):

```bash
# For initial bootstrap - gets ALL tokens (may take 30+ minutes)
BLOCKBERRY_MAX_PAGES=1000 yarn bootstrap
```

**Important:** This will make 1000+ API calls and take significant time. Monitor the console output for progress.

### 5. Generate Token Lists

```bash
# Build the final token lists (all.json, strict.json)
yarn compose
```

### 6. Set Up Regular Discovery

For ongoing updates, use a much smaller page count:

```bash
# Edit .env to set lower page count for regular runs
# BLOCKBERRY_MAX_PAGES=10

# Run regular discovery (every 6 hours via GitHub Actions)
yarn discover
```

## Scripts Explained

### `yarn bootstrap`
- **Purpose**: Initial population of ALL tokens from Sui network
- **Usage**: Run once to get started
- **Time**: 30-60 minutes for full bootstrap
- **Output**: Populates `data/discovered-tokens.csv` with 50k-100k tokens

### `yarn discover` 
- **Purpose**: Find new tokens since last run
- **Usage**: Regular updates (automated via GitHub Actions)
- **Time**: 1-5 minutes typically
- **Output**: Adds new tokens to existing discovered list

### `yarn compose`
- **Purpose**: Generate final token lists from discovered tokens
- **Usage**: After bootstrap or discovery updates
- **Time**: Few seconds
- **Output**: `dist/all.json` and `dist/strict.json`

## Configuration Options

### Environment Variables

```bash
# Required
BLOCKBERRY_API_KEY=your_api_key_here

# Optional - adjust based on your needs
BLOCKBERRY_MAX_PAGES=1000    # For bootstrap
# BLOCKBERRY_MAX_PAGES=10    # For regular updates
RATE_LIMIT_MS=200           # Delay between API calls
```

### Bootstrap Settings

For the initial bootstrap, you may want to adjust:

- **Conservative**: `BLOCKBERRY_MAX_PAGES=500` (~50k tokens, ~20 mins)
- **Comprehensive**: `BLOCKBERRY_MAX_PAGES=1000` (~100k tokens, ~40 mins) 
- **Maximum**: `BLOCKBERRY_MAX_PAGES=2000` (All possible tokens, ~80 mins)

## Expected Output

After successful bootstrap:

```
📊 Total tokens in discovered list: 87,234
🆕 New tokens added: 87,155
⏱️  Total time: 1,847s
📄 Discovery rate: 2,835 tokens/minute
```

Files created:
- `data/discovered-tokens.csv` - All discovered tokens (large file)
- `dist/all.json` - All valid tokens (excluding banned)
- `dist/strict.json` - Only verified tokens (initially empty)

## Troubleshooting

### API Key Issues
```
❌ Bootstrap failed: Error: BLOCKBERRY_API_KEY environment variable is required
```
**Solution**: Make sure your `.env` file has the correct API key.

### Rate Limiting
```
HTTP 429: Too Many Requests
```
**Solution**: Increase `RATE_LIMIT_MS` in your `.env` file to 500 or higher.

### Network Timeouts
**Solution**: The script will retry failed requests. If issues persist, run bootstrap in smaller batches.

### Large File Sizes
The `discovered-tokens.csv` file can become very large (50+ MB). This is normal for 100k tokens.

## Automation Setup

The GitHub Actions workflow will automatically:

1. **Discovery** (every 6 hours): Find new tokens
2. **Publishing** (on push to main): Build and deploy token lists

Regular discovery uses `BLOCKBERRY_MAX_PAGES=10` by default to stay within rate limits.

## Next Steps

After successful bootstrap:

1. **Review tokens**: Check `data/discovered-tokens.csv` 
2. **Mark verified tokens**: Edit CSV to set `verified=true` for trusted tokens
3. **Set up automation**: Commit your changes to trigger GitHub Actions
4. **Monitor regularly**: Check for new tokens and verification needs

The token list will be automatically published to GitHub Pages and available for integration by wallets, DEXs, and other dApps in the Sui ecosystem.
