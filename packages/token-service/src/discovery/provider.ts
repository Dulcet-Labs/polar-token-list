import { promises as fs } from "fs";
import path from "path";
import { Token } from "../types";

export type DiscoveredCoin = {
  name: string;
  symbol: string;
  decimals: number;
  objectId: string; // canonical ID we use (e.g., TreasuryCap object ID)
  coinType?: string; // Sui coin type (actual coin type)
  logoURI?: string;
  website?: string;
};

export interface DiscoveryProvider {
  name: string; // e.g., "suiscan"
  discover(maxPages?: number): Promise<DiscoveredCoin[]>;
}

export function toTokenRows(coins: DiscoveredCoin[], nowIso: string): Token[] {
  return coins.map((c) => ({
    name: c.name?.trim(),
    symbol: c.symbol?.trim(),
    decimals: Number(c.decimals) || 0,
    coinType: c.coinType,
    objectId: c.objectId?.toLowerCase(),
    logoURI: c.logoURI,
    verified: false,
    verifiedBy: undefined,
    addedAt: nowIso,
    tags: ["auto"],
    extensions: c.website ? { website: c.website } : undefined,
    version: 1,
  }));
}

export async function writeDiscoveredCsv(
  outPath: string,
  tokens: Token[]
): Promise<void> {
  const header = [
    "name",
    "symbol",
    "decimals",
    "coinType",
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
  ].join(",");

  const lines = tokens.map((t) => {
    const tags = t.tags?.join(",") || "auto";
    const ex = (t.extensions || {}) as Record<string, unknown>;
    const website = (ex["website"] as string) || "";
    const csv = [
      t.name || "",
      t.symbol || "",
      String(t.decimals ?? 0),
      t.coinType || "",
      t.objectId || "",
      t.logoURI || "",
      t.verified ? "true" : "false",
      t.verifiedBy || "",
      t.addedAt || "",
      tags,
      website,
      "",
      "",
      "",
      "",
      (ex["description"] as string) || "",
      String(t.version ?? 1),
    ];
    return csv
      .map((v) =>
        v && /[",\n]/.test(String(v))
          ? `"${String(v).replace(/"/g, '""')}"`
          : String(v)
      )
      .join(",");
  });

  const csv = header + "\n" + lines.join("\n") + "\n";
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, csv, "utf8");
}
