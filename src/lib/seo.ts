/**
 * Single source of truth for page metadata.
 *
 * Every route builds its head tags through `buildMeta()` so nothing can drift.
 * The Netlify edge function (netlify/edge-functions/seo.ts) imports THIS FILE
 * directly, so the HTML a crawler receives and the tags React writes after it
 * loads are always identical.
 *
 * IMPORTANT: keep this file free of imports. Deno (Netlify edge) and Vite
 * (the app) must both be able to load it as-is.
 */

export const SITE_URL = "https://eplicant.com";
export const SITE_NAME = "Eplicant";
export const SITE_LOGO = `${SITE_URL}/logo.png`;

export interface PageMeta {
  title: string;
  description: string;
  canonical: string;
  /** Absolute image URL for social cards. */
  image?: string;
  /** Omit from search indexes (404s, gone listings). */
  noindex?: boolean;
  type?: "website" | "article";
}

export interface BuildMetaInput {
  title: string;
  description: string;
  /** Root-relative path, e.g. "/opportunities". */
  path: string;
  image?: string;
  noindex?: boolean;
  type?: "website" | "article";
  /** Skip the " — Eplicant" suffix when the title already carries the brand. */
  rawTitle?: boolean;
}

export function absoluteUrl(path: string): string {
  if (!path.startsWith("/")) return `${SITE_URL}/${path}`;
  return `${SITE_URL}${path}`;
}

/** Bing flags titles over 70 characters; Google shows about 60. Stay under both limits where possible. */
export const MAX_TITLE_CHARS = 68;

/** Cut to `max` characters at a word boundary, adding "…". */
function cutWords(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.5 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–—-]+$/, "")}…`;
}

export function clampTitle(title: string): string {
  return cutWords(title, MAX_TITLE_CHARS);
}

/** "Page title — Eplicant", dropping the brand (then shortening) if that would be too long. */
export function brandTitle(title: string): string {
  const full = `${title} — ${SITE_NAME}`;
  return full.length <= MAX_TITLE_CHARS ? full : clampTitle(title);
}

/** Trim to a length search engines actually display, without cutting a word. */
export function clampDescription(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 60 ? lastSpace : max).trimEnd()}…`;
}

export function buildMeta({
  title,
  description,
  path,
  image = SITE_LOGO,
  noindex = false,
  type = "website",
  rawTitle = false,
}: BuildMetaInput): PageMeta {
  return {
    title: rawTitle ? clampTitle(title) : brandTitle(title),
    description: clampDescription(description),
    canonical: absoluteUrl(path),
    image,
    noindex,
    type,
  };
}

/* ---------------------------------------------------------------- JSON-LD */

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: SITE_LOGO,
  description:
    "A remote-only job board — fully remote jobs across every industry, in one place.",
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

export function itemListJsonLd(
  name: string,
  items: { name: string; path: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      url: absoluteUrl(it.path),
    })),
  };
}

export function faqJsonLd(entries: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((e) => ({
      "@type": "Question",
      name: e.question,
      acceptedAnswer: { "@type": "Answer", text: e.answer },
    })),
  };
}

/* ------------------------------------------------------- JobPosting JSON-LD */

/** Region names emitted by the location pipeline → representative countries. */
export const REGION_TO_COUNTRIES: Record<string, string[]> = {
  "Sub-Saharan Africa": ["Nigeria", "Kenya", "South Africa", "Ghana", "Ethiopia"],
  "East Africa": ["Kenya", "Tanzania", "Uganda", "Rwanda", "Ethiopia"],
  "West Africa": ["Nigeria", "Ghana", "Senegal", "Côte d'Ivoire"],
  "Southern Africa": ["South Africa", "Botswana", "Zambia", "Zimbabwe"],
  "North Africa": ["Egypt", "Morocco", "Tunisia", "Algeria"],
  MENA: ["Egypt", "United Arab Emirates", "Saudi Arabia", "Jordan", "Morocco"],
  "Middle East": ["United Arab Emirates", "Saudi Arabia", "Jordan", "Qatar"],
  Europe: ["Germany", "France", "United Kingdom", "Netherlands", "Spain"],
  "Western Europe": ["Germany", "France", "United Kingdom", "Netherlands"],
  "Eastern Europe": ["Poland", "Romania", "Czech Republic", "Hungary"],
  "Latin America": ["Brazil", "Mexico", "Argentina", "Colombia", "Chile"],
  Caribbean: ["Jamaica", "Dominican Republic", "Trinidad and Tobago"],
  "South Asia": ["India", "Pakistan", "Bangladesh", "Sri Lanka"],
  "Southeast Asia": ["Indonesia", "Philippines", "Vietnam", "Thailand", "Malaysia"],
  "East Asia": ["China", "Japan", "South Korea"],
  "Central Asia": ["Kazakhstan", "Uzbekistan"],
  Oceania: ["Australia", "New Zealand"],
  "North America": ["United States", "Canada", "Mexico"],
};

function applicantLocationRequirements(location: string | null) {
  const v = location?.toLowerCase();
  if (!location || v === "global" || v === "anywhere") {
    return { "@type": "Country", name: "Anywhere" };
  }
  const region = REGION_TO_COUNTRIES[location];
  if (region) return region.map((name) => ({ "@type": "Country", name }));
  return { "@type": "Country", name: location };
}

function safeHostname(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export interface JobPostingInput {
  id: string;
  title: string;
  company: string;
  location?: string | null;
  salary?: string | null;
  posted_at?: string | null;
  is_remote?: boolean | null;
  job_type?: string | null;
  clean_description?: string | null;
  description?: string | null;
  apply_url?: string | null;
  slug?: string | null;
  apply_before_date?: string | null;
}

/**
 * Google JobPosting structured data.
 * - `description` must be the FULL description (Google wants HTML), not an excerpt.
 * - No `directApply`: people apply on the employer's site, not on Eplicant.
 * - `TELECOMMUTE` only for roles that don't require office days.
 */
export function jobPostingJsonLd(
  job: JobPostingInput,
  opts: { descriptionHtml?: string; canonicalPath?: string } = {}
) {
  const plainDescription = stripHtml(job.clean_description || job.description || "");

  const jobPath = job.slug || job.id;
  const datePosted = job.posted_at || new Date().toISOString();

  let validThrough: string;
  if (job.apply_before_date) {
    validThrough = new Date(job.apply_before_date).toISOString();
  } else {
    const d = new Date(datePosted);
    d.setDate(d.getDate() + 30);
    validThrough = d.toISOString();
  }

  const host = safeHostname(job.apply_url);

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: opts.descriptionHtml || plainDescription,
    identifier: {
      "@type": "PropertyValue",
      name: SITE_NAME,
      value: job.id,
    },
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
      ...(host ? { sameAs: `https://${host}` } : {}),
    },
    datePosted,
    validThrough,
    url: `${SITE_URL}${opts.canonicalPath || `/job/${jobPath}`}`,
  };

  const officeRequired = isOfficeRequired(`${job.location ?? ""} ${plainDescription}`);
  const isRegion = job.location ? job.location in REGION_TO_COUNTRIES : false;
  const isGlobal = job.location?.toLowerCase() === "global";

  if (job.location && !isRegion && !isGlobal && !job.is_remote) {
    jsonLd.jobLocation = {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressLocality: job.location },
    };
  }

  if ((job.is_remote || isGlobal || isRegion) && !officeRequired) {
    jsonLd.jobLocationType = "TELECOMMUTE";
    jsonLd.applicantLocationRequirements = applicantLocationRequirements(
      job.location ?? null
    );
    if (!jsonLd.jobLocation && job.location && !isGlobal) {
      const country = isRegion ? REGION_TO_COUNTRIES[job.location][0] : job.location;
      jsonLd.jobLocation = {
        "@type": "Place",
        address: { "@type": "PostalAddress", addressCountry: country },
      };
    }
  }

  if (job.job_type) {
    const typeMap: Record<string, string> = {
      "Full-time": "FULL_TIME",
      "Part-time": "PART_TIME",
      Contract: "CONTRACTOR",
      Internship: "INTERN",
      Freelance: "TEMPORARY",
      Volunteer: "VOLUNTEER",
    };
    jsonLd.employmentType = typeMap[job.job_type] || job.job_type;
  }

  if (job.salary) {
    const salary = parseSalary(job.salary);
    if (salary) jsonLd.baseSalary = salary;
  }

  return jsonLd;
}

/* ------------------------------------------------------ Shared text helpers */

/** Decode the handful of HTML entities job feeds actually use. */
export function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

/** HTML (possibly entity-escaped) → one line of plain text. */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  let v = html;
  // Some feeds double-escape markup ("&lt;p&gt;") — decode it first.
  if (/&lt;\/?[a-z]/i.test(v)) v = decodeEntities(v);
  return decodeEntities(
    v
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();
}

/* ------------------------------------------------------ Remote-only checks */

/**
 * Phrases that mean a role needs office attendance, even if the listing also
 * says "remote" somewhere. Kept in sync with
 * supabase/functions/_shared/remote-check.ts (Supabase can't import from src/).
 */
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

export function isOfficeRequired(text: string | null | undefined): boolean {
  return officeRequiredMatch(text) !== null;
}

/* -------------------------------------------------------------- Job pages */

/** Job pages with less plain text than this are noindexed as too thin
 * (fetch-jobs already rejects descriptions under ~200 characters of HTML). */
export const MIN_JOB_DESCRIPTION_CHARS = 150;

export interface JobSeoInput {
  id: string;
  slug?: string | null;
  title: string;
  company: string;
  location?: string | null;
  is_remote?: boolean | null;
  clean_description?: string | null;
  description?: string | null;
}

export function jobPath(job: { id: string; slug?: string | null }): string {
  return `/job/${job.slug || job.id}`;
}

/** "United Kingdom", "Worldwide", or "" when we only know it's remote. */
export function jobLocationLabel(location: string | null | undefined): string {
  const v = (location || "").trim();
  if (!v || /^remote$/i.test(v)) return "";
  if (/^(global|anywhere|worldwide)$/i.test(v)) return "Worldwide";
  return v;
}

/** Keep long multi-country locations short: "United States, Canada, Mexico" → "United States +2". */
function shortLocation(loc: string): string {
  if (loc.length <= 24) return loc;
  const parts = loc.split(/\s*(?:,|;|\||\/|\s-\s)\s*/).filter(Boolean);
  if (parts.length > 1 && parts[0].length <= 24) return `${parts[0]} +${parts.length - 1}`;
  return cutWords(loc, 24);
}

/**
 * <title> for a job page, at most MAX_TITLE_CHARS long. Always keeps the
 * location so the same role posted for several countries never shares a title.
 * Tries, in order:
 *   "Staff Product Designer at Kraken (Remote, United Kingdom) — Eplicant"
 *   "Staff Product Designer at Kraken (Remote, United Kingdom)"
 *   "Staff Product Designer at Kraken (United Kingdom)"
 *   "Very Long Job Title Shortened… at Kraken (United Kingdom)"
 */
export function jobTitleTag(job: JobSeoInput): string {
  const t = job.title.replace(/\s+/g, " ").trim();
  const c = job.company.replace(/\s+/g, " ").trim();
  const loc = shortLocation(jobLocationLabel(job.location));
  const candidates = [
    `${t} at ${c} (Remote${loc ? `, ${loc}` : ""}) — ${SITE_NAME}`,
    `${t} at ${c} (Remote${loc ? `, ${loc}` : ""})`,
    `${t} at ${c}${loc ? ` (${loc})` : " (Remote)"}`,
  ];
  for (const candidate of candidates) {
    if (candidate.length <= MAX_TITLE_CHARS) return candidate;
  }
  const tail = ` at ${c}${loc ? ` (${loc})` : ""}`;
  const room = MAX_TITLE_CHARS - tail.length;
  if (room >= 20) return `${cutWords(t, room)}${tail}`;
  return cutWords(`${t}${loc ? ` (${loc})` : ""}`, MAX_TITLE_CHARS);
}

/** Meta description for a job page — unique per listing. */
export function jobMetaDescription(job: JobSeoInput): string {
  const loc = jobLocationLabel(job.location);
  const plain = stripHtml(job.clean_description || job.description);
  const lead = `${job.company} is hiring a remote ${job.title}${loc ? ` (${loc})` : ""}.`;
  return clampDescription(plain ? `${lead} ${plain}` : `${lead} Read the full role and apply on the employer's site.`);
}

/** Should search engines index this job page? */
export function jobIsIndexable(job: JobSeoInput): boolean {
  const plain = stripHtml(job.clean_description || job.description);
  if (plain.length < MIN_JOB_DESCRIPTION_CHARS) return false;
  if (isOfficeRequired(`${job.location ?? ""} ${plain}`)) return false;
  return true;
}

/**
 * Key used to spot the same role imported once per country. Exact match on
 * company + title, the same rule as usePrimaryJob() and the edge function.
 */
export function jobDuplicateKey(job: { company: string; title: string }): string {
  return `${job.company}\u0000${job.title}`;
}

/**
 * Very conservative salary parser for JobPosting.baseSalary. Only emits a
 * value for clear yearly ranges like "$120,000 – $150,000" or "USD 90k-110k";
 * anything ambiguous returns null (better no salary than a wrong one).
 */
export function parseSalary(raw: string): Record<string, unknown> | null {
  const text = raw.replace(/,/g, "");
  const currency =
    /€|\bEUR\b/i.test(text) ? "EUR" :
    /£|\bGBP\b/i.test(text) ? "GBP" :
    /\bCAD\b|C\$/i.test(text) ? "CAD" :
    /\bAUD\b|A\$/i.test(text) ? "AUD" :
    /\$|\bUSD\b/i.test(text) ? "USD" : null;
  if (!currency) return null;
  if (/\b(hour|hr|month|mo|week|day)\b/i.test(text)) return null;
  const nums = [...text.matchAll(/(\d+(?:\.\d+)?)\s*(k)?\b/gi)].map((m) =>
    Number(m[1]) * (m[2] ? 1000 : 1)
  ).filter((n) => n >= 10000 && n <= 2000000);
  if (!nums.length) return null;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  return {
    "@type": "MonetaryAmount",
    currency,
    value: {
      "@type": "QuantitativeValue",
      ...(min === max ? { value: min } : { minValue: min, maxValue: max }),
      unitText: "YEAR",
    },
  };
}

/* ------------------------------------------------- Pagination and filters */

/** Country hubs with fewer live jobs than this are noindexed + left out of the sitemap. */
export const HUB_MIN_JOBS = 5;

/** Tracking params that don't change page content (kept indexable). */
const TRACKING_PARAM = /^(utm_\w+|gclid|fbclid|msclkid|ref|source)$/i;

/**
 * Adjust a page's meta for the URL's query string:
 * - `?page=N` (N>1): own canonical, "Page N" in title + description.
 * - any filter/search param: noindex, canonical stays on the clean page.
 * Used by <Seo> in the browser AND by the edge function, so both agree.
 */
export function applyQueryToMeta(meta: PageMeta, search: string): PageMeta {
  const params = new URLSearchParams(search);
  const filterKeys = [...params.keys()].filter((k) => k !== "page" && !TRACKING_PARAM.test(k));
  if (filterKeys.length) return { ...meta, noindex: true };

  const page = parseInt(params.get("page") || "1", 10);
  if (!Number.isFinite(page) || page <= 1) return meta;

  const suffix = ` — ${SITE_NAME}`;
  const base = meta.title.endsWith(suffix) ? meta.title.slice(0, -suffix.length) : meta.title;
  const withBrand = `${base} (Page ${page})${suffix}`;
  return {
    ...meta,
    title: withBrand.length <= MAX_TITLE_CHARS ? withBrand : `${cutWords(base, MAX_TITLE_CHARS - 10)} (Page ${page})`,
    description: clampDescription(`Page ${page}. ${meta.description}`),
    canonical: `${meta.canonical}?page=${page}`,
  };
}

/* ------------------------------------------------------------------ Bots */

/** Crawlers that get fully rendered HTML from the edge function. */
export const BOT_UA_RE =
  /(googlebot|google-inspectiontool|googleother|storebot-google|adsbot-google|mediapartners-google|bingbot|bingpreview|msnbot|adidxbot|slurp|duckduckbot|duckassistbot|baiduspider|yandex(bot)?|applebot|petalbot|seznambot|facebookexternalhit|twitterbot|linkedinbot|slackbot|discordbot|whatsapp|telegrambot|pinterest|redditbot|embedly|ahrefsbot|semrushbot|mj12bot|rogerbot|gptbot|oai-searchbot|chatgpt-user|claudebot|claude-searchbot|perplexitybot|amazonbot|ccbot)/i;

export function isBot(userAgent: string | null | undefined): boolean {
  return !!userAgent && BOT_UA_RE.test(userAgent);
}
