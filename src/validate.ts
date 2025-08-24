import { Token } from "./types";

export function isHexLower(s: string): boolean {
  return /^0x[a-f0-9]+$/.test(s);
}

export function isIsoDate(s: string): boolean {
  // Basic ISO-8601 check
  return /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/.test(s);
}

export function validateToken(t: Token): string[] {
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
