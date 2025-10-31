# Polar Token List Refactor Plan

## Current Problem
- Massive 50MB+ CSV file with all SUI tokens (wrong approach)
- Following Jupiter's model but implemented incorrectly
- Need to switch from "scan everything" to "curated + on-demand search"

## Goal
Build a Jupiter-style token list system for SUI with:
- Small curated verified token list
- On-demand token discovery API
- Clean JSON outputs (not massive CSVs)

---

## Phase 1: Cleanup & Foundation (Priority 1)

### 1.1 Clean Current Data Structure
- [ ] Delete the massive `data/discovered-tokens.csv` (50MB+)
- [ ] Keep `data/banned-tokens.csv` and `data/banned.json` (these are useful)
- [ ] Review and clean `data/tokens.json` if it exists

### 1.2 Create Curated Seed List
- [ ] Research and identify 20-30 major SUI tokens (SUI, USDC, USDT, major DeFi tokens)
- [ ] Create `data/verified-tokens.json` with proper schema
- [ ] Include essential fields: name, symbol, decimals, objectId, verified: true

### 1.3 Update Project Structure
- [ ] Update `.gitignore` to exclude large CSV files
- [ ] Clean up any references to the old CSV approach in code

---

## Phase 2: Token Discovery System (Priority 2)

### 2.1 On-Chain Token Discovery
- [ ] Build SUI RPC integration for token metadata lookup
- [ ] Create function to fetch token info by objectId on-demand
- [ ] Add validation for token metadata (name, symbol, decimals)

### 2.2 Search & Discovery API
- [ ] Create endpoint/function to search tokens by symbol/name
- [ ] Implement caching for frequently searched tokens
- [ ] Add rate limiting and error handling

---

## Phase 3: List Generation (Priority 3)

### 3.1 Generate Jupiter-Style JSON Lists
- [ ] Create `all.json` generator (verified + auto-discovered - banned)
- [ ] Create `strict.json` generator (verified only)
- [ ] Implement proper JSON schema validation

### 3.2 Validation Pipeline
- [ ] Port Jupiter's validation rules to SUI (objectId format, etc.)
- [ ] Add duplicate detection by objectId
- [ ] Validate logo URLs and metadata

---

## Phase 4: Integration & Publishing (Priority 4)

### 4.1 Build Pipeline
- [ ] Create build scripts to generate final JSON files
- [ ] Add CI/CD for automatic list updates
- [ ] Implement proper versioning and timestamps

### 4.2 API Endpoints
- [ ] Host `all.json` and `strict.json` files
- [ ] Add ETag and caching headers
- [ ] Create token search endpoint

---

## Phase 5: Security & Maintenance (Priority 5)

### 5.1 Security Features
- [ ] Implement banned token filtering
- [ ] Add phishing/scam token detection
- [ ] Logo validation and security checks

### 5.2 Monitoring & Updates
- [ ] Set up monitoring for list health
- [ ] Create admin tools for token verification
- [ ] Implement rollback procedures

---

## Immediate Next Steps (Today)

1. **Clean the mess**: Delete massive CSV, clean data directory
2. **Seed verified list**: Create initial 20-30 verified SUI tokens
3. **Basic structure**: Set up proper JSON generation
4. **Test**: Ensure we can generate clean `all.json` and `strict.json`

---

## Success Metrics

- [ ] Token lists under 1MB each (vs current 50MB+)
- [ ] Sub-second token search response times
- [ ] Clean JSON format matching Jupiter's approach
- [ ] Easy to add new verified tokens via PR process
- [ ] On-demand discovery for any SUI token

---

## Files to Create/Update

### New Files
- `data/verified-tokens.json` (curated list)
- `src/generators/all-list.ts` (generate all.json)
- `src/generators/strict-list.ts` (generate strict.json)
- `src/discovery/sui-rpc.ts` (on-chain token lookup)
- `src/api/search.ts` (token search functionality)

### Files to Update
- `package.json` (new scripts)
- `.gitignore` (exclude large files)
- `README.md` (updated usage)

### Files to Delete
- `data/discovered-tokens.csv` (the 50MB monster)