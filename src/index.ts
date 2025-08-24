import { promises as fs } from "fs";
import path from "path";

type Token = {
  name: string;
  symbol: string;
  decimals: number;
  objectId: string;
  logoURI?: string;
  verified: boolean;
  verifiedBy?: string;
  addedAt: string;
  tags?: string[];
  extensions?: Record<string, unknown>;
  signature?: Record<string, unknown>;
  version?: number;
};

type BannedList = {
  name: string;
  chain: string;
  updatedAt: string;
  banned: { objectId: string; reason?: string; addedAt?: string }[];
};

type OutputList = {
  name: string;
  chain: string;
  updatedAt: string;
  tokens: Token[];
  filters?: string[];
};

function isHexLower(s: string): boolean {
  return /^0x[a-f0-9]+$/.test(s);
}

function isIsoDate(s: string): boolean {
  // Basic ISO-8601 check
  return /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/.test(s);
}

function validateToken(t: Token): string[] {
  const errs: string[] = [];
  if (!t.name || t.name.trim().length === 0) errs.push("name required");
  if (!t.symbol || t.symbol.trim().length === 0) errs.push("symbol required");
  if (!Number.isInteger(t.decimals) || t.decimals < 0 || t.decimals > 18) errs.push("decimals 0-18");
  if (!isHexLower(t.objectId)) errs.push("objectId must be 0x-prefixed lowercase hex");
  if (!isIsoDate(t.addedAt)) errs.push("addedAt must be ISO-8601 UTC");
  if (typeof t.verified !== "boolean") errs.push("verified boolean required");
  if (t.logoURI && !t.logoURI.startsWith("https://")) errs.push("logoURI must be HTTPS");
  return errs;
}

async function readJson<T>(p: string): Promise<T> {
  const raw = await fs.readFile(p, "utf8");
  return JSON.parse(raw) as T;
}

async function writeJson(p: string, data: unknown): Promise<void> {
  const json = JSON.stringify(data, null, 2) + "\n";
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, json, "utf8");
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const dataDir = path.join(root, "data");
  const distDir = path.join(root, "dist");

  const tokensPathJson = path.join(dataDir, "tokens.json");
  const bannedPathJson = path.join(dataDir, "banned.json");
  const tokensPathCsv = path.join(dataDir, "validated-tokens.csv");
  const bannedPathCsv = path.join(dataDir, "banned-tokens.csv");

  async function fileExists(p: string): Promise<boolean> {
    try {
      await fs.access(p);
      return true;
    } catch {
      return false;
    }
  }

  function parseCsvLine(line: string): string[] {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out.map((s) => s.trim());
  }

  async function readCsv(p: string): Promise<string[][]> {
    const raw = await fs.readFile(p, "utf8");
    const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
    return lines.map(parseCsvLine);
  }

  async function readTokensFromCsv(p: string): Promise<Token[]> {
    const rows = await readCsv(p);
    const [header, ...data] = rows;
    const idx = (name: string) => header.indexOf(name);
    const reqCols = [
      "name",
      "symbol",
      "decimals",
      "objectId",
      "logoURI",
      "verified",
      "verifiedBy",
      "addedAt",
      "tags",
      "website",
      "twitter",
      "github",
      "discord",
      "telegram",
      "description",
      "version",
    ];
    for (const c of reqCols) {
      if (idx(c) === -1) throw new Error(`CSV missing column: ${c}`);
    }
    const tokens: Token[] = [];
    for (const row of data) {
      if (row.length === 0) continue;
      const tagsStr = row[idx("tags")];
      const tags = tagsStr ? tagsStr.split(/\s*,\s*/).filter(Boolean) : [];
      const exts: Record<string, unknown> = {};
      const website = row[idx("website")];
      const twitter = row[idx("twitter")];
      const github = row[idx("github")];
      const discord = row[idx("discord")];
      const telegram = row[idx("telegram")];
      const description = row[idx("description")];
      if (website) exts.website = website;
      if (twitter) exts.twitter = twitter;
      if (github) exts.github = github;
      if (discord) exts.discord = discord;
      if (telegram) exts.telegram = telegram;
      if (description) exts.description = description;
      const decimalsStr = row[idx("decimals")];
      const versionStr = row[idx("version")];
      const t: Token = {
        name: row[idx("name")],
        symbol: row[idx("symbol")],
        decimals: decimalsStr ? Number(decimalsStr) : 0,
        objectId: row[idx("objectId")]?.toLowerCase(),
        logoURI: row[idx("logoURI")] || undefined,
        verified: /^true$/i.test(row[idx("verified")]),
        verifiedBy: row[idx("verifiedBy")] || undefined,
        addedAt: row[idx("addedAt")],
        tags,
        extensions: Object.keys(exts).length ? exts : undefined,
        version: versionStr ? Number(versionStr) : undefined,
      };
      tokens.push(t);
    }
    return tokens;
  }

  async function readBannedFromCsv(p: string): Promise<BannedList> {
    const rows = await readCsv(p);
    const [header, ...data] = rows;
    const idx = (name: string) => header.indexOf(name);
    for (const c of ["objectId", "reason", "addedAt"]) {
      if (idx(c) === -1) throw new Error(`CSV missing column: ${c}`);
    }
    const banned = data.map((row) => ({
      objectId: row[idx("objectId")]?.toLowerCase(),
      reason: row[idx("reason")] || undefined,
      addedAt: row[idx("addedAt")] || undefined,
    }));
    const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
    return { name: "Polar Banned Tokens", chain: "sui", updatedAt: now, banned };
  }

  let tokens: Token[];
  if (await fileExists(tokensPathCsv)) {
    tokens = (await readTokensFromCsv(tokensPathCsv)).map((t) => ({
      ...t,
      name: t.name?.trim(),
      symbol: t.symbol?.trim(),
      objectId: t.objectId?.toLowerCase(),
    }));
  } else if (await fileExists(tokensPathJson)) {
    tokens = (await readJson<Token[]>(tokensPathJson)).map((t) => ({
      ...t,
      name: t.name?.trim(),
      symbol: t.symbol?.trim(),
      objectId: t.objectId?.toLowerCase(),
    }));
  } else {
    tokens = [];
  }

  // Validate tokens and filter out invalid with warnings
  const validTokens: Token[] = [];
  for (const t of tokens) {
    const errs = validateToken(t);
    if (errs.length > 0) {
      console.warn(`Skipping token ${t.symbol || t.objectId}: ${errs.join(", ")}`);
      continue;
    }
    validTokens.push(t);
  }

  // Dedupe by objectId (last write wins)
  const byId = new Map<string, Token>();
  for (const t of validTokens) byId.set(t.objectId, t);
  const deduped = Array.from(byId.values());

  // Load banned list (CSV preferred)
  let banned: BannedList;
  if (await fileExists(bannedPathCsv)) {
    banned = await readBannedFromCsv(bannedPathCsv);
  } else if (await fileExists(bannedPathJson)) {
    banned = await readJson<BannedList>(bannedPathJson);
  } else {
    const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
    banned = { name: "Polar Banned Tokens", chain: "sui", updatedAt: now, banned: [] };
  }
  const bannedSet = new Set<string>(banned.banned.map((b) => b.objectId.toLowerCase()));

  // all = tokens - banned
  const allTokens = deduped.filter((t) => !bannedSet.has(t.objectId));

  // strict: verified OR allowlisted tags
  const allowTags = new Set(["partner", "community", "wormhole", "original-registry"]);
  const strictTokens = allTokens.filter((t) => t.verified || (t.tags || []).some((x) => allowTags.has(x)));

  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const allList: OutputList = {
    name: "Polar All Tokens",
    chain: "sui",
    updatedAt: now,
    tokens: allTokens,
  };

  const strictList: OutputList = {
    name: "Polar Strict Tokens",
    chain: "sui",
    updatedAt: now,
    filters: ["verified", "partner", "community"],
    tokens: strictTokens,
  };

  await writeJson(path.join(distDir, "all.json"), allList);
  await writeJson(path.join(distDir, "strict.json"), strictList);
  await writeJson(path.join(distDir, "banned.json"), banned);

  console.log(`Wrote ${allTokens.length} tokens to all.json, ${strictTokens.length} to strict.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
