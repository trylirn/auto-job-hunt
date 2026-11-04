// "Is this job really remote?" — office-attendance phrases that disqualify a
// listing even when its text also says "remote".
//
// KEEP IN SYNC with OFFICE_REQUIRED_PATTERNS in src/lib/seo.ts (Supabase
// functions can't import files from src/).

export const OFFICE_REQUIRED_PATTERNS: RegExp[] = [
  // "2 days a week in our London office", "three days per week on-site"
  /\b(?:\d|one|two|three|four)\+?\s*(?:or more\s+)?days?\s+(?:a|per|each|every)\s+week\b[^.]{0,60}\b(?:offices?|on[- ]?site|in[- ]person)\b/i,
  // "in the office 3 days a week"
  /\b(?:offices?|on[- ]?site|in[- ]person)\b[^.]{0,40}\b(?:\d|one|two|three|four)\+?\s*days?\s+(?:a|per|each|every)\s+week\b/i,
  // "at least 2 days ... office"
  /\bat least\s+(?:\d|one|two|three|four)\s+days?\b[^.]{0,60}\boffice/i,
  // "this is a hybrid role", "the position is on-site" — the ROLE's mode, not a company perk
  /\b(?:this|the)\s+(?:role|position|job)\s+is\s+(?:a\s+)?(?:hybrid|on[- ]?site|in[- ]office|office[- ]based)\b/i,
  /\b(?:is|as)\s+a\s+hybrid\s+(?:role|position|job)\b/i,
  // "you must work from our Berlin office"
  /\b(?:must|required to|expected to|need to)\s+(?:be\s+able\s+to\s+)?(?:work|commute|be)\s+(?:from|in|into|at)\s+(?:the|our)\s+[^.]{0,30}\boffices?\b/i,
  /\bin[- ]office\s+(?:\d|one|two|three|four)\s+days\b/i,
];

/** A match preceded by "not", "no", "never", "don't"… is the opposite ("you don't need to be in the office"). */
const NEGATION_BEFORE = /\b(?:not|no|never|don't|dont|doesn't|won't|isn't|without)\s+(?:\w+\s+){0,2}$/i;

/** The phrase that marks the role as office-based, or null. Useful for logging why a job was flagged. */
export function officeRequiredMatch(text: string | null | undefined): string | null {
  if (!text) return null;
  for (const re of OFFICE_REQUIRED_PATTERNS) {
    const global = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
    for (const m of text.matchAll(global)) {
      const before = text.slice(Math.max(0, (m.index ?? 0) - 30), m.index ?? 0);
      if (!NEGATION_BEFORE.test(before)) return m[0];
    }
  }
  return null;
}

function toText(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type JobText = {
  title?: string | null;
  location?: string | null;
  description?: string | null;
  clean_description?: string | null;
};

/** The phrase that makes the listing office-based (for logs), or null. */
export function officeRequiredReason(job: JobText): string | null {
  return officeRequiredMatch(`${job.location ?? ""} ${toText(job.clean_description || job.description)}`);
}

/** True when the listing needs office days / is a hybrid role / is on-site. */
export function isOfficeRequired(job: JobText): boolean {
  return officeRequiredReason(job) !== null;
}
