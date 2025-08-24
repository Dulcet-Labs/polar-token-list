# How Jupiter Built the Token List

This document explains how this repo constructed and validated Jupiter's token lists, including data sources, validation rules, partner feeds, CI, and local usage. File paths below reference this repository.

## What Got Produced

- **All list**: Every token known to Jupiter (plus partner metadata).
- **Strict list**: Safety-focused subset derived from All using provenance tags: "wormhole", "original-registry", "community".

Context: The repo is archived and replaced by Jupiter Verify (see `README.md`). This file documents the previous system.

## Key Inputs and Where They Live

- **Community/Registry CSV**
  - `validated-tokens.csv`: Canonical list of validated tokens maintained via PRs.
  - Fields: `Name, Symbol, Mint, Decimals, LogoURI, Community Validated`.
- **Banned Tokens**
  - `banned-tokens.csv`: Tokens hidden from UI/SDK/API.
- **Partner Feeds** (generated into `src/partners/data/`)
  - `wormhole.csv`: Pulled weekly from Wormhole’s token list.
  - `solana-fm.csv`: Tokens with SolanaFM metadata (includes a `VERIFIED` column).

## High-Level Data Flow

1. Community/registry tokens are proposed in PRs by editing `validated-tokens.csv`.
2. Partner scripts fetch data and write CSVs into `src/partners/data/`.
3. Jupiter’s backend assembled the API:
   - All list: union of tokens plus partner tags.
   - Strict list: filter from All using tags: wormhole, original-registry, community.
   - See `README-developers.md` for the All vs Strict rules.

## Validation on Pull Requests

- Workflow: `.github/workflows/validate-PR.yml`
  - Runs on PRs and manual dispatch.
  - Installs deps, builds, and runs `yarn validate-PR`.
- Entrypoints
  - GitHub Actions: `src/main.ts` (validates `validated-tokens.csv`).
  - Local CLI: `src/cli.ts` (accepts a path to a CSV to validate).
- Orchestration: `src/logic.ts`
  - Reads current CSV and previous revision (`git show origin/main:validated-tokens.csv`).
  - Applies all checks from `src/utils/validate.ts`.
  - For newly added tokens, double-checks against on-chain metadata via `src/utils/metadata.ts`.
  - Logs counts and exits non-zero on failures.

### Validation Rules (`src/utils/validate.ts`)

- **Duplicate mints**: `detectDuplicateMints()`.
- **Duplicate symbols (regression-protected)**: `detectDuplicateSymbol()`
  - Baseline of allowed duplicate symbol/mint pairs lives in `src/utils/duplicate-symbols.ts` (`allowedDuplicateSymbols`).
  - PR fails if the total duplicates exceed the allowed baseline.
- **Only one token per PR**: `canOnlyAddOneToken()`.
- **Mint address validity**: `validMintAddress()` uses `@solana/web3.js` `PublicKey`.
- **No edits to existing tokens**: `noEditsToPreviousLinesAllowed()` prevents changing prior rows.
- **Community flag required**: `isCommunityValidated()` requires `"Community Validated": true` unless the mint is in `allowedNotCommunityValidated`.
- **On-chain metadata match for new tokens**: `newTokensHaveMatchingOnchainMeta()` checks Name, Symbol, Mint, and Decimals against on-chain.
- Optional (disabled in pipeline): `isSymbolConfusing()` for non-alphanumeric/lookalike symbols.

### On-Chain Metadata Sources (`src/utils/metadata.ts`)

Order of attempts to fetch metadata for a mint:

1. **Token-2022 embedded metadata**
   - `@solana/spl-token` + `@solana/spl-token-metadata` (embedded, pointer must reference mint account).
2. **Metaplex MPL Token Metadata** (standard)
   - PDA: `['metadata', programId, mint]` using Metaplex program ID.
3. **Community metadata program** (Fluxbeam deployment)
   - Program ID: `META4s4fSmpkTbZoUsgC1oBnWB31vQcmnN8giPw51Zu`.

The first source to return a valid `name/symbol/uri/decimals` is used to validate the new row.

## Partner Data Pipelines (`src/partners/scripts/`)

- **Wormhole** — `get-wormhole.ts`
  - Downloads `by_dest.csv` from `certusone/wormhole-token-list` into `src/partners/data/wormhole.csv` via `node-downloader-helper`.
- **SolanaFM** — `get-solana-fm.ts`
  - Gets Jupiter All mints via `get-jup-all.ts` (reads `https://token.jup.ag/all`).
  - Batches 50 mints per POST to `https://api.solana.fm/v0/tokens`.
  - Maps to `{ name, symbol, address, decimals, logoURI, verified }`.
  - Writes to `src/partners/data/solana-fm.csv` with headers: `NAME, SYMBOL, ADDRESS, DECIMALS, LOGOURI, VERIFIED`.
- **Reference Strict set** — `src/utils/get-jup-strict.ts`
  - Fetches `https://token.jup.ag/strict` to build sets (names/symbols/mints/logoURIs) for dedupe/reference.
- **Utilities** — `check-wormhole-with-verified.ts`
  - Cross-check helper for Wormhole vs verified lists.

## Exceptions Lists (`src/utils/duplicate-symbols.ts`)

- `allowedDuplicateSymbols`: Known (Symbol, Mint) pairs that are allowed to duplicate symbols.
- `allowedNotCommunityValidated`: Known tokens allowed with `Community Validated = false`.

PRs adding new duplicates or new not-community-validated tokens require the exception list to be updated first, otherwise validation fails.

## Scripts and Local Usage (`package.json`)

- Build TypeScript: `yarn build`
- Validate current CSV (same as CI): `yarn validate-PR`
- Update partner data: `yarn update-partners`
  - Or separately: `yarn get-wormhole`, `yarn get-solana-fm`
- Lint/Format/Test: `yarn lint`, `yarn format`, `yarn test`

Local CLI (after `yarn build`):

```bash
node dist/cli.js validated-tokens.csv
node dist/cli.js path/to/another.csv
```

## All vs Strict Lists

- **All**: union of all tokens with partner metadata.
- **Strict**: filtered subset from All with provenance tags: "wormhole", "original-registry", "community".
- See `README-developers.md` for details and links to API docs.

## File Map (for quick reference)

- Core: `src/main.ts`, `src/cli.ts`, `src/logic.ts`
- Validation: `src/utils/validate.ts`, `src/utils/metadata.ts`, `src/utils/get-jup-strict.ts`, `src/utils/duplicate-symbols.ts`
- Types: `src/types/types.ts`
- Partner data: `src/partners/data/`
- Partner scripts: `src/partners/scripts/`
- CSVs: `validated-tokens.csv`, `banned-tokens.csv`
- CI: `.github/workflows/*.yml`

## Deprecation Note

This repository is archived. The process is superseded by **Jupiter Verify** (V3). Tokens are discovered and verified based on organic score and community smart likes on token pages (see `README.md`).
