import { promises as fs } from "fs";
import path from "path";
import { BannedList, Token } from "./types";

export async function readJson<T>(p: string): Promise<T> {
  const raw = await fs.readFile(p, "utf8");
  return JSON.parse(raw) as T;
}

export async function writeJson(p: string, data: unknown): Promise<void> {
  const json = JSON.stringify(data, null, 2) + "\n";
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, json, "utf8");
}

export async function fileExists(p: string): Promise<boolean> {
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

export async function readCsv(p: string): Promise<string[][]> {
  const raw = await fs.readFile(p, "utf8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  return lines.map(parseCsvLine);
}

export async function readTokensFromCsv(p: string): Promise<Token[]> {
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

export async function readBannedFromCsv(p: string): Promise<BannedList> {
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
