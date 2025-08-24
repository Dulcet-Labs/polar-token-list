# Polar Token List

A curated registry of Sui tokens. We publish two artifacts for integrators:

- all.json — all known non-banned tokens
- strict.json — safer subset (verified-only)

See `Schema.md` for the full schema and validation rules.

## Current verification policy

- Strict = verified-only.
- You manually set `verified: true` for tokens you trust.
- Recommended to set `verifiedBy` with your admin/user id.

## How to mark tokens verified

You can edit either the CSV or JSON under `data/`.

- CSV: `data/validated-tokens.csv`
  - Set columns: `verified` = true, `verifiedBy` = your_id
- JSON: `data/tokens.json`
  - Set fields: `"verified": true`, `"verifiedBy": "your_id"`

Example CSV row:

```csv
name,symbol,decimals,objectId,logoURI,verified,verifiedBy,addedAt,tags,website,twitter,github,discord,telegram,description,version
PolarToken,POL,6,0x1234...,https://cdn.polar.io/pol.png,true,adminID,2025-08-24T08:00:00Z,"verified,community",https://polar.io,,,,,,1
```

Example JSON snippet:

```json
{
  "name": "PolarToken",
  "symbol": "POL",
  "decimals": 6,
  "objectId": "0x1234...",
  "logoURI": "https://cdn.polar.io/pol.png",
  "verified": true,
  "verifiedBy": "adminID",
  "addedAt": "2025-08-24T08:00:00Z",
  "tags": ["verified", "community"],
  "version": 1
}
```

## Compose the lists

```bash
# Build TS and compose lists into dist/
yarn compose
```

Outputs in `dist/`:

- `all.json`: all non-banned tokens (deduped by `objectId`)
- `strict.json`: verified-only subset
- `banned.json`: denylist snapshot (from CSV or JSON)

## Validation

Basic and enhanced checks run during composition (see `src/validate.ts`):

- names/symbols sanity, decimals 0–18, lowercase hex `objectId`, ISO-8601 `addedAt`
- HTTPS `logoURI` and links; disallow common URL shorteners
- allowed tags only

Invalid tokens are skipped with a console warning.

## Integration examples

Fetch the lists from your canonical URL (to be hosted via GitHub Pages/CDN).

JavaScript:

```js
const ALL_URL = "https://<your-domain>/polar-token-list/all.json";
const STRICT_URL = "https://<your-domain>/polar-token-list/strict.json";

async function loadTokens(url) {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

(async () => {
  const strict = await loadTokens(STRICT_URL);
  // Prefer strict by default; allow users to opt into all
  console.log("strict tokens", strict.tokens.length);
})();
```

curl:

```bash
curl -sSL https://<your-domain>/polar-token-list/strict.json | jq '.tokens | length'
```

## Caching guidance

- Set `Cache-Control` for short TTLs (e.g., strict: 15–30m; all: 5–10m)
- Support `stale-while-revalidate` if served via CDN
- Each publish sets `updatedAt` in artifacts

## Roadmap

- Hosting via GitHub Pages + CI publish
- Community Assistant Verification (CAV): organic score + smart likes + on-chain activity (future)
- Optional signing for `strict.json`
