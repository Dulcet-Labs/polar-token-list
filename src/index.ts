import path from "path";
import { Token, BannedList, OutputList } from "./types";
import {
  readJson,
  writeJson,
  fileExists,
  readTokensFromCsv,
  readBannedFromCsv,
} from "./io";
import { validateToken } from "./validate";
import { isStrictEligible } from "./compose";

function cmpToken(a: Token, b: Token): number {
  if (a.verified !== b.verified) return a.verified ? -1 : 1;
  const sa = (a.symbol || a.name || "").toLowerCase();
  const sb = (b.symbol || b.name || "").toLowerCase();
  if (sa < sb) return -1;
  if (sa > sb) return 1;
  const na = (a.name || "").toLowerCase();
  const nb = (b.name || "").toLowerCase();
  return na.localeCompare(nb);
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const dataDir = path.join(root, "data");
  const distDir = path.join(root, "dist");

  const tokensPathJson = path.join(dataDir, "tokens.json");
  const bannedPathJson = path.join(dataDir, "banned.json");
  const tokensPathCsv = path.join(dataDir, "validated-tokens.csv");
  const discoveredPathCsv = path.join(dataDir, "discovered-tokens.csv");
  const bannedPathCsv = path.join(dataDir, "banned-tokens.csv");

  // Load discovered tokens (optional)
  let discovered: Token[] = [];
  if (await fileExists(discoveredPathCsv)) {
    discovered = (await readTokensFromCsv(discoveredPathCsv)).map((t) => ({
      ...t,
      name: t.name?.trim(),
      symbol: t.symbol?.trim(),
      objectId: t.objectId?.toLowerCase(),
    }));
  }

  // Load manual/validated tokens (CSV preferred, then JSON)
  let manual: Token[] = [];
  if (await fileExists(tokensPathCsv)) {
    manual = (await readTokensFromCsv(tokensPathCsv)).map((t) => ({
      ...t,
      name: t.name?.trim(),
      symbol: t.symbol?.trim(),
      objectId: t.objectId?.toLowerCase(),
    }));
  } else if (await fileExists(tokensPathJson)) {
    manual = (await readJson<Token[]>(tokensPathJson)).map((t) => ({
      ...t,
      name: t.name?.trim(),
      symbol: t.symbol?.trim(),
      objectId: t.objectId?.toLowerCase(),
    }));
  }

  // Merge with precedence: manual overrides discovered (last-write-wins in dedupe)
  const inputTokens: Token[] = [...discovered, ...manual];

  // Validate tokens and filter out invalid with warnings
  const validTokens: Token[] = [];
  for (const t of inputTokens) {
    const errs = validateToken(t);
    if (errs.length > 0) {
      console.warn(
        `Skipping token ${t.symbol || t.objectId}: ${errs.join(", ")}`
      );
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
    banned = {
      name: "Polar Banned Tokens",
      chain: "sui",
      updatedAt: now,
      banned: [],
    };
  }
  const bannedSet = new Set<string>(
    banned.banned.map((b) => b.objectId.toLowerCase())
  );

  // all = tokens - banned
  const allTokens = deduped.filter((t) => !bannedSet.has(t.objectId));

  // strict: verified-only policy
  const strictTokens = allTokens.filter((t) => isStrictEligible(t));

  // Sort outputs for stability
  const allTokensSorted = [...allTokens].sort(cmpToken);
  const strictTokensSorted = [...strictTokens].sort(cmpToken);

  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const allList: OutputList = {
    name: "Polar All Tokens",
    chain: "sui",
    updatedAt: now,
    tokens: allTokensSorted,
  };

  const strictList: OutputList = {
    name: "Polar Strict Tokens",
    chain: "sui",
    updatedAt: now,
    filters: ["verified"],
    tokens: strictTokensSorted,
  };

  await writeJson(path.join(distDir, "all.json"), allList);
  await writeJson(path.join(distDir, "strict.json"), strictList);
  await writeJson(path.join(distDir, "banned.json"), banned);

  console.log(
    `Wrote ${allTokens.length} tokens to all.json, ${strictTokens.length} to strict.json`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
