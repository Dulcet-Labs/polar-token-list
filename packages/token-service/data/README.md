# Data Directory

This directory contains the source data files for the Polar Token Lists.

## 📁 File Structure

### **Source Files (Team Managed)**
- `strict-tokens.json` - Manually curated tokens for the strict list (empty by default)
- `banned.json` - Manually managed list of banned/blocked tokens

### **Generated Files (Auto-Updated)**
- `all-verified-tokens.json` - All verified tokens from BlockBerry API (updated weekly)
- `verified-tokens.json` - Copy of all verified tokens used for list generation
- `tokens.json` - Legacy file, same as verified-tokens.json

### **Backup Files**
- `verified-tokens-backup.json` - Temporary backup during sync operations

## 🔄 Workflow

### **Manual Curation (Team)**
1. Edit `strict-tokens.json` to add/remove tokens from strict list
2. Edit `banned.json` to add/remove banned tokens
3. Commit changes → GitHub Actions automatically regenerates lists

### **Automatic Updates**
1. **Weekly**: BlockBerry sync updates `all-verified-tokens.json`
2. **On changes**: List generation updates `dist/*.json` files

## 📋 File Formats

### strict-tokens.json
```json
[
  {
    "name": "Sui",
    "symbol": "SUI", 
    "decimals": 9,
    "coinType": "0x2::sui::SUI",
    "objectId": "0x...",
    "logoURI": "https://...",
    "verified": true,
    "verifiedBy": "blockberry",
    "addedAt": "2025-10-29T10:00:00Z",
    "tags": ["verified", "blockberry"],
    "extensions": { ... }
  }
]
```

### banned.json
```json
{
  "name": "Polar Banned Tokens",
  "chain": "sui", 
  "updatedAt": "2025-10-29T10:00:00Z",
  "banned": [
    {
      "objectId": "0x...",
      "reason": "Scam token",
      "addedAt": "2025-10-29T10:00:00Z"
    }
  ]
}
```

## ⚠️ Important Notes

- **DO NOT** manually edit `all-verified-tokens.json` - it's auto-generated
- **DO NOT** edit `verified-tokens.json` directly - it's copied from all-verified-tokens.json
- **ALWAYS** validate JSON syntax before committing
- **BACKUP** important changes before major updates

## 🔍 Validation

Run validation before committing:
```bash
yarn validate
```

This checks:
- JSON syntax validity
- Required fields presence
- No duplicate tokens
- Security checks (suspicious URLs)