# Polar Token List – Task Plan

## Phase 1: Research & Decisions

- [x] Research Jupiter token list practices (schema, hosting, versioning, curation, signatures)
- [x] Decide JSON schema (required/optional fields, signature, version info)
- [x] Choose hosting & distribution (CDN vs GitHub Pages vs API) + canonical URL
- [x] Define versioning and changelog policy
- [x] Define publishing & caching (ETag, Cache-Control, update cadence)

## Phase 2: Auto-Discovery (Unverified)

- [ ] Specify Sui RPC queries for token discovery (rules, rate limits, dedupe)
- [ ] Define minimal metadata to auto-add (name, symbol, decimals, objectId, addedAt)
- [ ] Establish safeguards (spam filtering, denylist/allowlist)

## Phase 3: Verification Workflow (Ice ❄️)

- Current (MVP): Manual verification only
  - Admin sets `verified: true` and `verifiedBy` in CSV/JSON for tokens we trust
  - `strict.json` = verified-only
- Future: Community Assistant Verification (CAV)
  - Verification driven by organic score + smart likes + on-chain activity
  - Define thresholds and evidence; retain admin override for emergencies/partners
- [ ] Specify submission form fields (objectId, logo, website, socials, audit)
- [ ] Review checklist and evidence requirements
- [ ] Badge logic and audit trail fields (verified, verifiedBy, verifiedAt/addedAt)
- [ ] Admin/auth model and logging

## Phase 4: Security

- [ ] Domain/logo validation (HTTPS, file type, size)
- [ ] Phishing protection (name collisions, lookalikes)
- [ ] Policy for disputed tokens and takedowns

## Phase 5: Integration

- [ ] DEX UI display rules (badges, sorting, search)
- [ ] Third-party integration guidelines (fetch examples, error handling)
- [ ] Optional signature verification flow

## Phase 6: Ops & Monitoring

- [ ] Monitoring & alerts for malformed entries, pipeline failures
- [ ] Rollback procedure for bad releases
- [ ] SLA for updates and verification turnaround

## Phase 7: Business & Comms

- [ ] Verification cost model (free, priority paid)
- [ ] Public docs/readme explaining trust model and update process

## Decisions (Jupiter-inspired)

- **List tiers**: Maintain three artifacts
  - `all` — union of auto-discovered tokens and verified tokens, minus banned
  - `strict` — verified-only (MVP); later may incorporate CAV thresholds
  - `banned` — explicit denylist of objectIds excluded from composition
- **Tagging**: Add `tags` per token to indicate provenance (e.g., `auto`, `verified`, `partner`, `community`).
- **Verification/badge**: `verified: boolean`, `verifiedBy`, and ice ❄️ badge in UI for `verified == true`.
- **Hosting**: Start with CDN or GitHub Pages for `all.json` and `strict.json`; can evolve to API.
- **Versioning & changelog**: Include per-token `version` (optional) and publish a changelog (added/removed/updated). Consider top-level list version in release notes.
- **Caching**: ETag + Cache-Control (All: 5–10m; Strict: 15–30m). Support stale-while-revalidate.
- **Security**: HTTPS-only `logoURI`, validate content type/size, deny data: URIs, handle name collisions/lookalikes, and keep a `banned` list.

### Deliverables

- `all.json`, `strict.json`, and `banned.(json|csv)` artifacts
- `Schema.md` documenting fields and validation rules
- Integration notes in `README.md` for DEX/wallets
