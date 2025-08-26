import "dotenv/config";
import path from "path";
import { toTokenRows, writeDiscoveredCsv } from "../discovery/provider";
import { BlockberryProvider } from "../discovery/blockberry";
import { fileExists, readBannedFromCsv, readTokensFromCsv } from "../io";
import { Token } from "../types";

async function main() {
  const root = path.resolve(__dirname, "../..");
  const dataDir = path.join(root, "data");

  const discoveredCsv = path.join(dataDir, "discovered-tokens.csv");
  const validatedCsv = path.join(dataDir, "validated-tokens.csv");
  const bannedCsv = path.join(dataDir, "banned-tokens.csv");

  // 1. Read all existing token IDs to avoid duplicates.
  const knownObjectIds = new Set<string>();

  const [discovered, validated, banned] = await Promise.all([
    (async () =>
      (await fileExists(discoveredCsv))
        ? readTokensFromCsv(discoveredCsv)
        : [])(),
    (async () =>
      (await fileExists(validatedCsv))
        ? readTokensFromCsv(validatedCsv)
        : [])(),
    (async () =>
      (await fileExists(bannedCsv))
        ? readBannedFromCsv(bannedCsv)
        : { banned: [] })(),
  ]);

  for (const token of [...discovered, ...validated]) {
    if (token.objectId) knownObjectIds.add(token.objectId);
  }
  for (const ban of banned.banned) {
    if (ban.objectId) knownObjectIds.add(ban.objectId);
  }

  console.log(`Found ${knownObjectIds.size} existing token IDs.`);

  // 2. Discover new tokens using Blockberry only.
  // If BLOCKBERRY_MAX_PAGES is:
  //  - undefined, 'all', or '0' => fetch all pages
  //  - a positive number => fetch up to that many pages
  const maxPagesEnv = process.env.BLOCKBERRY_MAX_PAGES;
  const maxPages =
    maxPagesEnv === undefined || maxPagesEnv?.toLowerCase?.() === "all" || maxPagesEnv === "0"
      ? Number.POSITIVE_INFINITY
      : Math.max(1, Number(maxPagesEnv));
  const provider = new BlockberryProvider();
  const discoveredCoins = await provider.discover(maxPages);
  console.log(
    `Discovered ${discoveredCoins.length} coins via ${provider.name}.`
  );

  // 3. Filter out known tokens.
  const newCoins = discoveredCoins.filter(
    (coin) => !knownObjectIds.has(coin.objectId)
  );
  console.log(`Found ${newCoins.length} new tokens to add.`);

  if (newCoins.length === 0) {
    console.log("No new tokens to add. Exiting.");
    return;
  }

  // 4. Append new tokens to the discovered list.
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const newTokens = toTokenRows(newCoins, now);

  const allDiscoveredTokens: Token[] = [...discovered, ...newTokens];

  await writeDiscoveredCsv(discoveredCsv, allDiscoveredTokens);

  console.log(
    `Discovery complete: ${newTokens.length} new tokens added to ${discoveredCsv}`
  );
}

main().catch((err) => {
  console.error("Discovery script failed:", err);
  process.exit(1);
});
