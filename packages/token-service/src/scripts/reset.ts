import { promises as fs } from "fs";
import path from "path";

async function ensureDir(p: string) {
  await fs.mkdir(path.dirname(p), { recursive: true });
}

async function writeDiscoveredHeaderOnly(filePath: string) {
  const header = [
    "name",
    "symbol",
    "decimals",
    "objectId",
    "coinType",
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
  ].join(",");
  await ensureDir(filePath);
  await fs.writeFile(filePath, header + "\n", "utf8");
}

async function writeEmptyTokensJson(filePath: string) {
  await ensureDir(filePath);
  await fs.writeFile(filePath, "[]\n", "utf8");
}

async function removeIfExists(filePath: string) {
  try {
    await fs.unlink(filePath);
  } catch (e: any) {
    if (e && e.code !== "ENOENT") throw e;
  }
}

async function main() {
  const root = path.resolve(__dirname, "../..");
  const dataDir = path.join(root, "data");

  const discoveredCsv = path.join(dataDir, "discovered-tokens.csv");
  const validatedCsv = path.join(dataDir, "validated-tokens.csv");
  const tokensJson = path.join(dataDir, "tokens.json");
  const blockberryCheckpoint = path.join(dataDir, ".blockberry-checkpoint.json");

  // 1) Reset discovered-tokens.csv to header only
  await writeDiscoveredHeaderOnly(discoveredCsv);

  // 2) Remove validated-tokens.csv if present (fresh validation run will recreate)
  await removeIfExists(validatedCsv);

  // 3) Reset tokens.json to empty array
  await writeEmptyTokensJson(tokensJson);

  // 4) Remove pagination checkpoint so discovery starts from page 1
  await removeIfExists(blockberryCheckpoint);

  console.log(
    "Data reset complete: discovered-tokens.csv header only (with coinType), tokens.json cleared, validated-tokens.csv removed if existed, Blockberry checkpoint cleared."
  );
}

main().catch((err) => {
  console.error("Reset script failed:", err);
  process.exit(1);
});
