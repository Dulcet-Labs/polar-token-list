import { Token } from "./types";

export const ALLOW_TAGS = new Set([
  "auto",
  "partner",
  "community",
  "original-registry",
  "verified",
]);

export function isStrictEligible(t: Token): boolean {
  // Verified-only strict policy
  return t.verified === true;
}
