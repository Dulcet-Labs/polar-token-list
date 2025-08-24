import "dotenv/config";
import path from "path";
import { writeDiscoveredCsv, toTokenRows } from "../discovery/provider";
import { BlockberryProvider } from "../discovery/blockberry";

async function main() {
  const root = path.resolve(__dirname, "../..");
  const dataDir = path.join(root, "data");
  const outCsv = path.join(dataDir, "discovered-tokens.csv");

  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  const providerName = "blockberry";
  const provider = new BlockberryProvider();
  const coins = await provider.discover();
  const tokens = toTokenRows(coins, now);
  await writeDiscoveredCsv(outCsv, tokens);

  console.log(
    `Discovery complete via ${providerName}: ${tokens.length} tokens -> ${outCsv}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
