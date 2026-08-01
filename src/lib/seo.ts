/**
 * Single source of truth for page metadata.
 *
 * Every route builds its head tags through `buildMeta()` so nothing can drift.
 * The Netlify edge prerenderer imports the same shapes when it renders HTML
 * for crawlers, which keeps bot HTML and client HTML identical.
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
  const full = rawTitle ? title : `${title} — ${SITE_NAME}`;
  return {
    title: full.length > 62 ? `${full.slice(0, 59).trimEnd()}…` : full,
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
    "A job board for international development professionals — roles, fellowships, scholarships and grants in one place.",
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

export function jobPostingJsonLd(job: JobPostingInput) {
  const plainDescription = (job.clean_description || job.description || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 900);

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
    description: plainDescription,
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
    url: `${SITE_URL}/job/${jobPath}`,
  };

  const isRegion = job.location ? job.location in REGION_TO_COUNTRIES : false;
  const isGlobal = job.location?.toLowerCase() === "global";

  if (job.location && !isRegion && !isGlobal && !job.is_remote) {
    jsonLd.jobLocation = {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressLocality: job.location },
    };
  }

  if (job.is_remote || isGlobal || isRegion) {
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

  if (job.apply_url) jsonLd.directApply = true;

  return jsonLd;
}
