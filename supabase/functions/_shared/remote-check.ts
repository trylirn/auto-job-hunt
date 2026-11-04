// "Is this job really remote?" — office-attendance phrases that disqualify a
// listing even when its text also says "remote".
//
// KEEP IN SYNC with OFFICE_REQUIRED_PATTERNS in src/lib/seo.ts (Supabase
// functions can't import files from src/).

export const OFFICE_REQUIRED_PATTERNS: RegExp[] = [
  /\b(?:\d|one|two|three|four)\+?\s*(?:or more\s+)?days?\s+(?:a|per|each|every)\s+week\b[^.]{0,60}\b(?:offices?|on[- ]?site|in[- ]person)\b/i,
  /\b(?:offices?|on[- ]?site|in[- ]person)\b[^.]{0,40}\b(?:\d|one|two|three|four)\+?\s*days?\s+(?:a|per|each|every)\s+week\b/i,
  /\bat least\s+(?:\d|one|two|three|four)\s+days?\b[^.]{0,60}\boffice/i,
  /\bhybrid\s+(?:role|position|working|work\s+model|model|schedule|arrangement)\b/i,
  /\b(?:this|the)\s+(?:role|position|job)\s+is\s+(?:a\s+)?(?:hybrid|on[- ]?site|in[- ]office|office[- ]based)\b/i,
  /\b(?:must|required to|expected to|need to)\s+(?:be\s+able\s+to\s+)?(?:work|commute|be)\s+(?:from|in|into|at)\s+(?:the|our)\s+[^.]{0,30}\boffices?\b/i,
  /\bin[- ]office\s+(?:\d|one|two|three|four)\s+days\b/i,
];

function toText(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** True when the listing needs office days / is hybrid / is on-site. */
export function isOfficeRequired(job: {
  title?: string | null;
  location?: string | null;
  description?: string | null;
  clean_description?: string | null;
}): boolean {
  const text = `${job.title ?? ""} ${job.location ?? ""} ${toText(job.clean_description || job.description)}`;
  return OFFICE_REQUIRED_PATTERNS.some((re) => re.test(text));
}
