// Display + filter helpers for job locations.
//
// We deliberately do NOT rewrite the DB. The string "Global" stays as-is in
// `jobs.location`; it is rendered as "USA / Global" everywhere and counts as
// a US-region match for the region filter. This targets U.S. SEO while
// keeping the underlying data reversible.

export function formatLocation(loc: string | null | undefined): string {
  if (!loc) return "";
  const v = loc.trim();
  if (!v) return "";
  if (v.toLowerCase() === "global") return "USA / Global";
  return v;
}

const US_TOKENS = ["united states", "usa", "u.s.a", "u.s.", "global"];

export function isUsRegion(loc: string | null | undefined): boolean {
  if (!loc) return false;
  const v = loc.toLowerCase();
  return US_TOKENS.some((t) => v.includes(t));
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
