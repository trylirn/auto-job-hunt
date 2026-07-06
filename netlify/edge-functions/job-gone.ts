// Edge function on /job/*. Three jobs:
//   1. Legacy /job/id/:uuid  → real 301 to /job/:slug (or 410 if gone).
//   2. /job/:slug + bot UA + live row → fully-rendered HTML with title,
//      canonical, JobPosting JSON-LD, and visible content. Fixes Google
//      "Duplicate without user-selected canonical".
//   3. Archived / expired / missing → 410 Gone.
// Human requests to a live /job/:slug fall through to the React SPA.

const SUPABASE_URL = "https://wmfwpviizgvohgadumgp.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZndwdmlpemd2b2hnYWR1bWdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNTc2MjYsImV4cCI6MjA4NzkzMzYyNn0.J4y5DPvChJjXdvEF1U_JU0dehXGe7FSQ6go8qZDurgE";

const SITE_ORIGIN = "https://eplicant.com";

const BOT_UA_RE =
  /(googlebot|bingbot|slurp|duckduckbot|baiduspider|yandex(bot)?|facebookexternalhit|twitterbot|linkedinbot|ahrefsbot|semrushbot|applebot|petalbot|gptbot|claudebot|perplexitybot|mj12bot|rogerbot|discordbot|whatsapp|telegrambot|embedly|redditbot|pinterest)/i;

function isBot(ua: string | null): boolean {
  if (!ua) return false;
  return BOT_UA_RE.test(ua);
}

function esc(s: unknown): string {
  const v = s == null ? "" : String(s);
  return v.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;"
  );
}

function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Ported from src/pages/JobDetail.tsx — keep in sync.
const REGION_TO_COUNTRIES: Record<string, string[]> = {
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

function buildApplicantLocationRequirements(loc: string | null) {
  if (!loc || loc.toLowerCase() === "global" || loc.toLowerCase() === "anywhere") {
    return { "@type": "Country", name: "Anywhere" };
  }
  const r = REGION_TO_COUNTRIES[loc];
  if (r) return r.map((name) => ({ "@type": "Country", name }));
  return { "@type": "Country", name: loc };
}

function safeHostname(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

interface JobRow {
  id: string;
  slug: string | null;
  title: string;
  company: string;
  company_logo: string | null;
  location: string | null;
  is_remote: boolean | null;
  job_type: string | null;
  employment_type: string | null;
  salary: string | null;
  posted_at: string | null;
  apply_before_date: string | null;
  apply_url: string | null;
  clean_description: string | null;
  description: string | null;
  archived_at: string | null;
}

function buildJobPostingJsonLd(job: JobRow, canonicalUrl: string) {
  const plain = stripHtml(job.clean_description || job.description).slice(0, 500);
  const datePosted = job.posted_at || new Date().toISOString();
  let validThrough: string;
  if (job.apply_before_date) {
    validThrough = new Date(job.apply_before_date).toISOString();
  } else {
    const d = new Date(datePosted);
    d.setDate(d.getDate() + 30);
    validThrough = d.toISOString();
  }
  const sameAs = safeHostname(job.apply_url);
  const isRegion = job.location ? job.location in REGION_TO_COUNTRIES : false;
  const isGlobal = job.location?.toLowerCase() === "global";

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: plain,
    identifier: { "@type": "PropertyValue", name: "Eplicant", value: job.id },
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
      ...(sameAs ? { sameAs: `https://${sameAs}` } : {}),
    },
    datePosted,
    validThrough,
    url: canonicalUrl,
  };

  if (job.location && !isRegion && !isGlobal && !job.is_remote) {
    jsonLd.jobLocation = {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressLocality: job.location },
    };
  }
  if (job.is_remote || isGlobal || isRegion) {
    jsonLd.jobLocationType = "TELECOMMUTE";
    jsonLd.applicantLocationRequirements = buildApplicantLocationRequirements(job.location);
    if (!jsonLd.jobLocation && job.location && !isGlobal) {
      const country = isRegion ? REGION_TO_COUNTRIES[job.location][0] : job.location;
      jsonLd.jobLocation = {
        "@type": "Place",
        address: { "@type": "PostalAddress", addressCountry: country },
      };
    }
  }
  if (job.job_type) {
    const map: Record<string, string> = {
      "Full-time": "FULL_TIME",
      "Part-time": "PART_TIME",
      Contract: "CONTRACTOR",
      Internship: "INTERN",
      Freelance: "TEMPORARY",
    };
    jsonLd.employmentType = map[job.job_type] || job.job_type;
  }
  if (job.apply_url) jsonLd.directApply = true;
  return jsonLd;
}

function goneHtml(path: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex">
<title>Listing no longer available — Eplicant</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#fafafa;color:#111;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px}.card{max-width:480px;text-align:center}h1{font-size:22px;margin:0 0 12px}p{color:#555;line-height:1.5;margin:0 0 20px}a{display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:500}</style>
</head><body><div class="card"><h1>This listing is no longer available</h1>
<p>The role at <code>${esc(path)}</code> has been closed or removed. Browse current openings on Eplicant.</p>
<a href="/">Back to all jobs</a></div></body></html>`;
}

function botHtml(job: JobRow, canonicalUrl: string): string {
  const loc = job.location || (job.is_remote ? "Remote" : "");
  const title = `${job.title} at ${job.company}${loc ? ` — ${loc}` : ""} | Eplicant`;
  const plain = stripHtml(job.clean_description || job.description);
  const description = (plain.slice(0, 155) || `${job.title} at ${job.company}. Apply now on Eplicant.`).replace(/\s+\S*$/, "") + "…";
  const bodyText = plain.slice(0, 3000);
  const jsonLd = buildJobPostingJsonLd(job, canonicalUrl);
  const ogImage = job.company_logo || `${SITE_ORIGIN}/logo.png`;
  const posted = job.posted_at ? new Date(job.posted_at).toISOString().slice(0, 10) : "";
  const deadline = job.apply_before_date || "";
  const applyHref = job.apply_url || canonicalUrl;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonicalUrl)}">
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(job.title)} at ${esc(job.company)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonicalUrl)}">
<meta property="og:image" content="${esc(ogImage)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(job.title)} at ${esc(job.company)}">
<meta name="twitter:description" content="${esc(description)}">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#111;max-width:760px;margin:0 auto;padding:24px;line-height:1.55}h1{font-size:26px;margin:0 0 8px}.meta{color:#555;font-size:14px;margin-bottom:20px}.meta span{margin-right:14px}.desc{white-space:pre-wrap}a.apply{display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:500;margin:20px 0}</style>
</head>
<body>
<header><a href="/">← Eplicant</a></header>
<main>
<h1>${esc(job.title)}</h1>
<p class="meta">
<span><strong>${esc(job.company)}</strong></span>
${loc ? `<span>📍 ${esc(loc)}</span>` : ""}
${job.employment_type || job.job_type ? `<span>💼 ${esc(job.employment_type || job.job_type)}</span>` : ""}
${job.salary ? `<span>💰 ${esc(job.salary)}</span>` : ""}
${posted ? `<span>🕒 Posted ${esc(posted)}</span>` : ""}
${deadline ? `<span>⏰ Apply before ${esc(deadline)}</span>` : ""}
</p>
<a class="apply" href="${esc(applyHref)}" rel="nofollow noopener">Apply now</a>
<div class="desc">${esc(bodyText)}</div>
<p style="margin-top:32px;color:#666;font-size:13px">Canonical listing: <a href="${esc(canonicalUrl)}">${esc(canonicalUrl)}</a></p>
</main>
</body>
</html>`;
}

const SELECT_COLS =
  "id,slug,title,company,company_logo,location,is_remote,job_type,employment_type,salary,posted_at,apply_before_date,apply_url,clean_description,description,archived_at";

async function fetchJob(column: "id" | "slug", value: string): Promise<JobRow | null> {
  const apiUrl = `${SUPABASE_URL}/rest/v1/jobs?${column}=eq.${encodeURIComponent(
    value
  )}&select=${SELECT_COLS}&limit=1`;
  const res = await fetch(apiUrl, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as JobRow[];
  return rows?.[0] ?? null;
}

function isGone(job: JobRow | null): boolean {
  if (!job) return true;
  if (job.archived_at) return true;
  const today = new Date().toISOString().slice(0, 10);
  if (job.apply_before_date && job.apply_before_date < today) return true;
  return false;
}

export default async (request: Request, context: { next: () => Promise<Response> }) => {
  try {
    const url = new URL(request.url);
    if (request.method !== "GET" && request.method !== "HEAD") return context.next();

    const parts = url.pathname.split("/").filter(Boolean); // ["job", ...]
    if (parts[0] !== "job" || parts.length < 2) return context.next();

    const ua = request.headers.get("user-agent");
    const bot = isBot(ua);
    const isIdRoute = parts[1] === "id";
    const key = isIdRoute ? parts[2] : parts[1];
    if (!key) return context.next();

    // Legacy /job/id/:uuid — always issue a real 3xx (301) to the slug URL for
    // everyone (bots and humans) when the row is live. This replaces the
    // client-side <Navigate> that Google can't follow.
    if (isIdRoute) {
      const job = await fetchJob("id", key);
      if (isGone(job)) {
        return new Response(goneHtml(url.pathname), {
          status: 410,
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "public, max-age=300",
            "x-robots-tag": "noindex",
          },
        });
      }
      const slug = job!.slug || job!.id;
      return new Response(null, {
        status: 301,
        headers: {
          location: `/job/${slug}`,
          "cache-control": "public, max-age=86400",
        },
      });
    }

    // /job/:slug
    const job = await fetchJob("slug", key);
    const slugLooksReal = /-[0-9a-f]{8}$/i.test(key);

    if (isGone(job)) {
      // Only 410 for well-formed slugs or when we confirmed the row is gone.
      // If neither, fall through so unknown routes stay as SPA 404s.
      if (job || slugLooksReal) {
        return new Response(goneHtml(url.pathname), {
          status: 410,
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "public, max-age=300",
            "x-robots-tag": "noindex",
          },
        });
      }
      return context.next();
    }

    // Live row.
    if (bot) {
      const canonical = `${SITE_ORIGIN}/job/${job!.slug || job!.id}`;
      return new Response(botHtml(job!, canonical), {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "public, max-age=3600, s-maxage=86400",
        },
      });
    }

    // Human on a live listing — let the SPA render normally.
    return context.next();
  } catch (_e) {
    return context.next(); // fail open
  }
};

export const config = { path: "/job/*" };
