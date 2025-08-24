import { Token } from "./types";

export const ALLOW_TAGS = new Set(["partner", "community", "original-registry"]);

export function isStrictEligible(t: Token): boolean {
  return t.verified || (t.tags || []).some((x) => ALLOW_TAGS.has(x));
}
