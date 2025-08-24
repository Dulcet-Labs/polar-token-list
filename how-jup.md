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

## Repository File-by-File Reference

This section documents every relevant file and directory with its role in the token list system.

### Root files

- `validated-tokens.csv`
  - Canonical community/registry token list edited via PRs.
  - Columns: `Name, Symbol, Mint, Decimals, LogoURI, Community Validated`.
  - Used by `src/main.ts` and `src/logic.ts` during validation.
- `banned-tokens.csv`
  - Mint addresses to exclude from UI/SDK/API. Not directly enforced in validation rules, but part of the product surface.
- `README.md`
  - Deprecation notice pointing to Jupiter Verify V3.
- `README-developers.md`
  - Developer-oriented overview of All vs Strict lists, partner feeds, and where data lives.
- `README-archive.md`
  - Additional archival notes about the old token list process.
- `HOW-JUP-DID-IT.md`
  - This document; end-to-end explanation of architecture and pipeline.
- `pull_request_template.md`
  - Standard PR checklist/messages for contributors submitting token additions/changes.
- `package.json`
  - Scripts:
    - `validate-PR`: `yarn build && node dist/main.js` (CI entrypoint)
    - `build`: `tsc`
    - `update-partners`: builds then runs partner scripts to refresh `src/partners/data/*.csv`
    - `get-wormhole`, `get-solana-fm`, `check-wormhole`, plus `lint`, `format`, `test`
  - Dependencies: Solana Web3, SPL Token + metadata, csv libs, node-fetch, GitHub Actions toolings, downloader helper.
- `tsconfig.json`
  - `rootDir: src`, `outDir: dist`, strict TS settings, ES module interop.
- `.mocharc.json`
  - Mocha config for TypeScript test running (historical; tests use Vitest in `src/utils/*.spec.ts`).
- `.gitignore`, `yarn.lock`
  - Standard project hygiene and lockfile; Yarn is the package manager.
- `token-list/`
  - Empty directory in this snapshot; reserved for built token list artifacts in some historical flows.
- `examples/`
  - `README_tags_submission.md`, `sample_tags.csv`, `sample_token_tags.png` — example partner/tagging payloads and visuals.

### CI workflows (`.github/workflows/`)

- `validate-PR.yml`
  - On: `pull_request`, `workflow_dispatch`.
  - Steps: checkout (depth 0), setup Node, `yarn install`, run `yarn validate-PR` and append output to `$GITHUB_STEP_SUMMARY`.
- `update-partners.yml`
  - On: schedule weekly (Mon 00:00 UTC) + manual dispatch.
  - Steps: checkout, `yarn install`, `yarn run update-partners`, commit CSV changes, compute diff count, auto-create PR using `peter-evans/create-pull-request` if changes exist. Uses `secrets.PAT`.
- `clear-stale-PRs.yml`
  - On: daily schedule + manual dispatch.
  - Uses `actions/stale@v9` to mark and close stale PRs (labels, messages configurable). Uses `secrets.PAT`.

### Source tree (`src/`)

- `src/main.ts`
  - GitHub Actions entrypoint. Validates `validated-tokens.csv` and fails the Action on errors using `@actions/core`.
- `src/cli.ts`
  - Local CLI entrypoint. Accepts a CSV path and runs the same validation flow as CI.
- `src/logic.ts`
  - Orchestration: reads current CSV and prior CSV from git (`git show origin/main:validated-tokens.csv`), parses rows, builds a Solana `Connection`, and runs all validation rules. Aggregates errors into the process exit code. Logs exception baselines counts.

#### Utilities (`src/utils/`)

- `src/utils/validate.ts`

  - Validation functions used by `src/logic.ts`:
    - `detectDuplicateMints(tokens)` — mint duplicates.
    - `detectDuplicateSymbol(prev, curr)` — regression-protected symbol duplicates against `allowedDuplicateSymbols`.
    - `canOnlyAddOneToken(prev, curr)` — enforces a single addition per PR.
    - `validMintAddress(tokens)` — base58 `PublicKey` parsing to ensure valid Solana mints.
    - `noEditsToPreviousLinesAllowed(prev, curr)` — prior rows immutable.
    - `isCommunityValidated(tokens)` — requires validation flag unless mint is in `allowedNotCommunityValidated`.
    - `findAddedTokens(prev, curr)` — computes newly added tokens.
    - `newTokensHaveMatchingOnchainMeta(connection, newTokens)` — resolves on-chain metadata and compares `Name`, `Symbol`, `Decimals`, and optionally `LogoURI` semantics (see metadata notes).
    - Optional rule (not enforced in exit code): `isSymbolConfusing()` for lookalike symbols.
  - Also contains helper functions used in tests around content types and JSON-logo resolution.

- `src/utils/metadata.ts`

  - On-chain metadata resolution for a list of mints in priority order:
    1. Token-2022 embedded metadata via SPL extensions and metadata pointer; 2) Metaplex MPL Token Metadata PDA; 3) Community metadata program (`META4s4f...`).
  - Exposes `findMetadata(connection, mints)` returning metadata objects and an error count used by `newTokensHaveMatchingOnchainMeta()`.

- `src/utils/get-jup-strict.ts`

  - `getValidated()` fetches `https://token.jup.ag/strict` and returns `ValidatedSet` of names/symbols/mints/logoURIs for reference/dedupe.

- `src/utils/duplicate-symbols.ts`

  - Exception registries:
    - `allowedDuplicateSymbols`: allowed (Symbol, Mint) pairs to tolerate symbol duplication.
    - `allowedNotCommunityValidated`: mints allowed without community validation.
  - These lists guard regressions: new PRs must update these lists to introduce new exceptions.

- `src/utils/validate.spec.ts`

  - Vitest tests for `findAddedTokens()` and `newTokensHaveMatchingOnchainMeta()` using real mainnet mints. Documents expected mismatch behaviors and JSON-logo resolution path.

- `src/utils/metadata.spec.ts`

  - Vitest test verifying metadata resolution across Token-2022, Metaplex, and Community sources. Snapshot files under `src/utils/__snapshots__/`.

- `src/utils/__snapshots__/`
  - `validate.spec.ts.snap`, `metadata.spec.ts.snap` — golden snapshots for tests.

#### Types (`src/types/`)

- `src/types/types.ts`
  - Core types:
    - `ValidatedTokensData` row shape with `Line` number.
    - `ValidationError` message templates.
    - Partner types (`SolanaFmToken`, `SolanaFmResult`, `SolanaFmData`, `WormholeData`).
    - `AllowedException`, `ValidatedSet` utility types.

#### Partners (`src/partners/`)

- Data (`src/partners/data/`)

  - `wormhole.csv` — downloaded weekly from the Wormhole list.
  - `solana-fm.csv` — built by batching Jupiter All mints into SolanaFM API.

- Scripts (`src/partners/scripts/`)
  - `get-wormhole.ts` — downloads `by_dest.csv` into `data/wormhole.csv`.
  - `get-jup-all.ts` — fetches `https://token.jup.ag/all` and extracts mint addresses.
  - `get-solana-fm.ts` — POSTs batches (50) to `https://api.solana.fm/v0/tokens`, writes `data/solana-fm.csv` with headers `NAME,SYMBOL,ADDRESS,DECIMALS,LOGOURI,VERIFIED`.
  - `check-wormhole-with-verified.ts` — local comparison tool highlighting decimals/symbol/name/logo mismatches between `validated-tokens.csv` and `wormhole.csv`.

## Deprecation Note

This repository is archived. The process is superseded by **Jupiter Verify** (V3). Tokens are discovered and verified based on organic score and community smart likes on token pages (see `README.md`).
