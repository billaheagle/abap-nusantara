/**
 * Display names a public commenter may not use.
 *
 * The blog's own identity ("ABAP Nusantara") and common authority words are
 * reserved so nobody can post a comment while impersonating the owner or a
 * moderator. Matching is done on a normalised form — lowercased with every
 * non-alphanumeric character stripped — so "ABAP-Nusantara", "abap nusantara"
 * and "A B A P Nusantara" all resolve to the same reserved token.
 */

const RESERVED_EXACT = new Set([
  "admin",
  "administrator",
  "moderator",
  "mod",
  "owner",
  "staff",
  "team",
  "official",
  "support",
  "webmaster",
  "root",
  "system",
  "nusantara",
]);

const RESERVED_SUBSTRINGS = ["abapnusantara"];

function normalise(name: string): string {
  return name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "");
}

export function isReservedAuthorName(name: string): boolean {
  const normalised = normalise(name);
  if (!normalised) return false;
  if (RESERVED_EXACT.has(normalised)) return true;
  return RESERVED_SUBSTRINGS.some((needle) => normalised.includes(needle));
}
