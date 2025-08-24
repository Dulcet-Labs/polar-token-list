# Polar Token List – Schema and Validation

## 1. Token JSON object

Required
- name: string (1–64 chars)
- symbol: string (1–16 chars)
- decimals: number (0–18 typical; Sui compatible)
- objectId: string (Sui object ID, 0x-prefixed lowercase hex)
- addedAt: string (ISO-8601 UTC, e.g. 2025-08-24T08:00:00Z)
- verified: boolean

Recommended
- logoURI: string (HTTPS URL only)
- verifiedBy: string (admin/user id or signer key id)
- tags: string[] (e.g., ["auto", "verified", "partner", "community"])
- extensions: object
  - website, twitter, github, discord, telegram: string (HTTPS URLs)
  - description: string (<= 512 chars)

Optional
- signature: object
  - algo: "ed25519" | "secp256k1"
  - signedAt: string (ISO-8601 UTC)
  - value: string (base64)
- version: number (>=1)

Example
```json
{
  "name": "PolarToken",
  "symbol": "POL",
  "decimals": 6,
  "objectId": "0x1234abcd...",
  "logoURI": "https://cdn.polar.io/pol.png",
  "verified": true,
  "verifiedBy": "adminID",
  "addedAt": "2025-08-24T08:00:00Z",
  "tags": ["auto", "community"],
  "extensions": {
    "website": "https://polar.io",
    "twitter": "https://x.com/polar"
  },
  "signature": {
    "algo": "ed25519",
    "signedAt": "2025-08-24T08:00:01Z",
    "value": "<base64>"
  },
  "version": 1
}
```

## 2. Lists
- all.json: all auto-discovered + verified tokens minus banned
- strict.json: filtered subset of `all` where `verified == true` or allowlisted tags
- banned.(json|csv): denylist of objectIds with optional reasons

Example top-level shapes
```json
{
  "name": "Polar All Tokens",
  "chain": "sui",
  "updatedAt": "2025-08-24T08:10:00Z",
  "tokens": [ /* Token objects */ ]
}
```

```json
{
  "name": "Polar Strict Tokens",
  "chain": "sui",
  "updatedAt": "2025-08-24T08:10:00Z",
  "filters": ["verified", "partner", "community"],
  "tokens": [ /* Token objects */ ]
}
```

```json
{
  "name": "Polar Banned Tokens",
  "chain": "sui",
  "updatedAt": "2025-08-24T08:10:00Z",
  "banned": [
    { "objectId": "0xdead...", "reason": "phishing" }
  ]
}
```

## 3. Validation rules
- name/symbol: non-empty; trim; block zero-width/emoji-only; no leading/trailing spaces
- decimals: integer 0–18
- objectId: must match /^0x[a-f0-9]+$/; dedupe by objectId (case-insensitive compare normalized to lowercase)
- logoURI: HTTPS only; content-type image/png|image/jpeg|image/svg+xml; size <= 256KB; no data: URIs
- links (extensions.*): HTTPS only; valid hostname; reject URL shorteners for official links
- addedAt/signedAt: valid ISO-8601 UTC
- tags: from controlled set: {"auto","verified","partner","community","wormhole","original-registry"} (extensible)
- signature: if present, value must verify against canonical token JSON (stable key order; exclude `signature`)
- banned merge: tokens in banned must be excluded from `all` and `strict`

## 4. Composition rules
- all = (auto + verified + partners + community) - banned
- strict = filter(all) by: verified == true OR tags ∈ allowlist({"partner","community","wormhole","original-registry"})
- sort: verified first, then by liquidity/usage (future), else alphabetically (symbol/name)

## 5. Publishing & caching
- ETag + Cache-Control
  - all.json: 5–10 minutes
  - strict.json: 15–30 minutes
- updatedAt set on every publish
- Optional top-level version field or changelog.md with adds/removals/edits

## 6. Security & integrity
- Denylist path for takedowns
- Collision handling: highlight verified token; mark lookalikes
- Logo fetcher with MIME sniffing and size caps
- Optional signing: sign strict.json and expose a public key for verification
