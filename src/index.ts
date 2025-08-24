import path from "path";
import { Token, BannedList, OutputList } from "./types";
import { readJson, writeJson, fileExists, readTokensFromCsv, readBannedFromCsv } from "./io";
import { validateToken } from "./validate";
import { isStrictEligible } from "./compose";

async function main() {
  const root = path.resolve(__dirname, "..");
  const dataDir = path.join(root, "data");
  const distDir = path.join(root, "dist");

  const tokensPathJson = path.join(dataDir, "tokens.json");
  const bannedPathJson = path.join(dataDir, "banned.json");
  const tokensPathCsv = path.join(dataDir, "validated-tokens.csv");
  const bannedPathCsv = path.join(dataDir, "banned-tokens.csv");

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
  const strictTokens = allTokens.filter((t) => isStrictEligible(t));

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
    filters: ["verified", "partner", "community", "original-registry"],
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
