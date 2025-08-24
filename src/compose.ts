import { Token } from "./types";

export const ALLOW_TAGS = new Set([
  "partner",
  "community",
  "original-registry",
]);

export function isStrictEligible(t: Token): boolean {
  // Verified-only strict policy
  return t.verified === true;
}
