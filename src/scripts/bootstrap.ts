import "dotenv/config";
import path from "path";
import { toTokenRows, writeDiscoveredCsv } from "../discovery/provider";
import { BlockberryProvider } from "../discovery/blockberry";
import { fileExists, readBannedFromCsv, readTokensFromCsv } from "../io";
import { Token } from "../types";

/**
 * Bootstrap script for initial token discovery
 * This script will fetch ALL tokens from Sui network (100k+)
 * Use this once to populate the initial token list
 */
async function bootstrap() {
  console.log("🚀 Starting Polar Token List Bootstrap");
  console.log("This will fetch ALL tokens from the Sui network...");

  const root = path.resolve(__dirname, "../..");
  const dataDir = path.join(root, "data");
  
  const discoveredCsv = path.join(dataDir, "discovered-tokens.csv");
  const validatedCsv = path.join(dataDir, "validated-tokens.csv");
  const bannedCsv = path.join(dataDir, "banned-tokens.csv");

  // Check if we already have discovered tokens
  const existingDiscovered = (await fileExists(discoveredCsv))
    ? await readTokensFromCsv(discoveredCsv)
    : [];

  console.log(`📊 Found ${existingDiscovered.length} existing discovered tokens`);

  if (existingDiscovered.length > 1000) {
    console.log("⚠️  You already have many tokens discovered.");
    console.log("This bootstrap will add to existing tokens.");
    console.log("Consider backing up your data first!");
  }

  // 1. Read existing token IDs to avoid duplicates
  const knownObjectIds = new Set<string>();
  
  const [discovered, validated, banned] = await Promise.all([
    existingDiscovered,
    (async () =>
      (await fileExists(validatedCsv))
        ? readTokensFromCsv(validatedCsv)
        : [])(),
    (async () =>
      (await fileExists(bannedCsv))
        ? readBannedFromCsv(bannedCsv)
        : { banned: [] })(),
  ]);

  // Build set of known token IDs
  for (const token of [...discovered, ...validated]) {
    if (token.objectId) knownObjectIds.add(token.objectId.toLowerCase());
  }
  for (const ban of banned.banned) {
    if (ban.objectId) knownObjectIds.add(ban.objectId.toLowerCase());
  }

  console.log(`🔍 Known token IDs: ${knownObjectIds.size}`);

  // 2. Initialize Blockberry provider
  try {
    const provider = new BlockberryProvider();
    console.log(`✅ ${provider.name} provider initialized`);

    // For bootstrap, we want to get ALL tokens
    // Estimate: 100k tokens / 100 per page = 1000 pages minimum
    const maxPages = Number(process.env.BLOCKBERRY_MAX_PAGES) || 1000;
    console.log(`📄 Max pages to fetch: ${maxPages}`);

    // Show estimation
    const estimatedTokens = maxPages * 100;
    const estimatedTime = Math.ceil((maxPages * 200) / 1000 / 60); // Rate limit in minutes
    console.log(`⏱️  Estimated: ${estimatedTokens.toLocaleString()} tokens in ~${estimatedTime} minutes`);

    // Ask for confirmation if this seems like a big operation
    if (maxPages > 100) {
      console.log("\n🚨 This is a large operation that will:");
      console.log(`   • Make ${maxPages.toLocaleString()} API calls`);
      console.log(`   • Take approximately ${estimatedTime} minutes`);
      console.log(`   • Potentially discover 50k-100k+ tokens`);
      console.log("\nPress Ctrl+C to cancel, or wait 10 seconds to continue...");
      
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    console.log("🔄 Starting token discovery...");
    const startTime = Date.now();
    
    // 3. Discover new tokens
    const discoveredCoins = await provider.discover(maxPages);
    const discoveryTime = Math.round((Date.now() - startTime) / 1000);
    
    console.log(`✨ Discovery completed in ${discoveryTime}s`);
    console.log(`📦 Raw tokens found: ${discoveredCoins.length.toLocaleString()}`);

    // 4. Filter out known tokens
    const newCoins = discoveredCoins.filter(
      (coin) => !knownObjectIds.has(coin.objectId.toLowerCase())
    );

    console.log(`🆕 New tokens to add: ${newCoins.length.toLocaleString()}`);

    if (newCoins.length === 0) {
      console.log("✅ No new tokens to add. Bootstrap complete!");
      return;
    }

    // 5. Convert to Token format and write to CSV
    const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
    const newTokens = toTokenRows(newCoins, now);
    const allDiscoveredTokens: Token[] = [...discovered, ...newTokens];

    console.log("💾 Writing tokens to CSV...");
    await writeDiscoveredCsv(discoveredCsv, allDiscoveredTokens);

    // 6. Summary
    console.log("\n🎉 Bootstrap Complete!");
    console.log(`📊 Total tokens in discovered list: ${allDiscoveredTokens.length.toLocaleString()}`);
    console.log(`🆕 New tokens added: ${newTokens.length.toLocaleString()}`);
    console.log(`⏱️  Total time: ${Math.round((Date.now() - startTime) / 1000)}s`);
    console.log(`📄 Discovery rate: ${Math.round(discoveredCoins.length / (discoveryTime / 60))} tokens/minute`);
    
    console.log("\n📝 Next steps:");
    console.log("1. Review the discovered tokens in data/discovered-tokens.csv");
    console.log("2. Run 'yarn compose' to generate the token lists");
    console.log("3. Set up regular discovery with lower BLOCKBERRY_MAX_PAGES (10-50)");

  } catch (error) {
    console.error("❌ Bootstrap failed:", error);
    
    if (error instanceof Error && error.message.includes('BLOCKBERRY_API_KEY')) {
      console.log("\n💡 Make sure to:");
      console.log("1. Copy .env.example to .env");
      console.log("2. Add your Blockberry API key to .env");
      console.log("3. Get your API key from: https://blockberry.one/");
    }
    
    process.exit(1);
  }
}

// Run bootstrap
bootstrap().catch((err) => {
  console.error("💥 Bootstrap script crashed:", err);
  process.exit(1);
});
