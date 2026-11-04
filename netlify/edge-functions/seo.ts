// netlify/edge-functions/seo.ts
//
// Runs on every HTML page request to eplicant.com, BEFORE the SPA fallback.
// It replaces the old job-gone.ts and does four things:
//
//   1. Writes the page's own <title>, meta description, canonical, robots,
//      Open Graph and JSON-LD into index.html (for EVERY visitor), so no two
//      pages ever share a title or description — even without JavaScript.
//   2. Sends the right HTTP status: 200, 301 (legacy URLs), 404 (unknown
//      pages, no more "soft 404s") and 410 (expired/removed jobs).
//   3. For search-engine bots, also fills <div id="root"> with the page's real
//      content (job lists, job descriptions, guides, blog posts) so Bing and
//      Google can read it without running JavaScript. React replaces it as
//      soon as it loads, so people see the normal app.
//   4. Uses src/lib/seo.ts + src/lib/routes.ts + src/data/* directly, so the
//      HTML here and the tags React writes later can never disagree.

import {
  SITE_NAME,
  SITE_LOGO,
  SITE_URL,
  HUB_MIN_JOBS,
  absoluteUrl,
  applyQueryToMeta,
  breadcrumbJsonLd,
  buildMeta,
  clampDescription,
  faqJsonLd,
  isBot,
  jobIsIndexable,
  jobLocationLabel,
  jobMetaDescription,
  jobPath,
  jobPostingJsonLd,
  jobTitleTag,
  organizationJsonLd,
  stripHtml,
  websiteJsonLd,
  type PageMeta,
} from "../../src/lib/seo.ts";
import { STATIC_ROUTES, getStaticRoute } from "../../src/lib/routes.ts";
import {
  COUNTRY_HUBS,
  LEGACY_CITY_REDIRECTS,
  getCountryHubBySlug,
  hubHeading,
  type CountryHub,
} from "../../src/data/countryHubs.ts";
import { REMOTE_CATEGORIES, getRemoteCategory, type RemoteCategory } from "../../src/data/remoteCategories.ts";
import { GUIDES, getGuide } from "../../src/data/guides.ts";
import { HOME_FAQS } from "../../src/data/homeFaqs.ts";
import {
  esc,
  liveJobParams,
  markdownToHtml,
  rest,
  safeJson,
  sanitizeHtml,
  today,
} from "../shared/eplicant.ts";

type Context = { next: () => Promise<Response> };

const PAGE_SIZE = 24;

/* ------------------------------------------------------------------ types */

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
  category: string | null;
  salary: string | null;
  posted_at: string | null;
  created_at: string | null;
  apply_before_date: string | null;
  apply_url: string | null;
  url: string | null;
  clean_description: string | null;
  description: string | null;
  archived_at: string | null;
  listing_type: string | null;
}

interface ListRow {
  id: string;
  slug: string | null;
  title: string;
  company: string;
  location: string | null;
  salary: string | null;
  posted_at: string | null;
}

interface PostRow {
  slug: string;
  title: string;
  seo_title: string | null;
  meta_description: string | null;
  excerpt: string | null;
  content_html: string | null;
  content_markdown: string | null;
  author: string | null;
  published_at: string | null;
}

const JOB_COLS =
  "id,slug,title,company,company_logo,location,is_remote,job_type,employment_type,category,salary,posted_at,created_at,apply_before_date,apply_url,url,clean_description,description,archived_at,listing_type";
const LIST_COLS = "id,slug,title,company,location,salary,posted_at";
const POST_COLS = "slug,title,seo_title,meta_description,excerpt,content_html,content_markdown,author,published_at";

/** What a route resolves to. */
type Resolved =
  | { kind: "redirect"; to: string }
  | { kind: "gone"; path: string }
  | {
      kind: "page";
      status: 200 | 404;
      meta: PageMeta;
      jsonLd: unknown[];
      /** Builds the crawler body. Only called for bots. */
      body?: () => Promise<string>;
    };

/* ------------------------------------------------------------ data access */

async function listJobs(opts: {
  page: number;
  location?: string;
  titleAny?: string[];
  limit?: number;
  withRows: boolean;
}) {
  const limit = opts.limit ?? PAGE_SIZE;
  const params: [string, string][] = [
    ["select", LIST_COLS],
    ...liveJobParams(),
    ["order", "is_featured.desc,posted_at.desc.nullslast"],
    ["limit", String(opts.withRows ? limit : 0)],
    ["offset", String((opts.page - 1) * limit)],
  ];
  if (opts.location) params.push(["location", `ilike.*${opts.location}*`]);
  if (opts.titleAny?.length) {
    params.push(["or", `(${opts.titleAny.map((t) => `title.ilike.*${t}*`).join(",")})`]);
  }
  const { rows, count } = await rest<ListRow>("jobs", params, { count: true });
  const total = count ?? rows.length;
  return { rows, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

async function getJob(column: "id" | "slug", value: string): Promise<JobRow | null> {
  const { rows } = await rest<JobRow>("jobs", [
    ["select", JOB_COLS],
    [column, `eq.${value}`],
    ["limit", "1"],
  ]);
  return rows[0] ?? null;
}

/** Oldest live copy of the same company + title (same rule as usePrimaryJob). */
async function getPrimaryJob(job: JobRow): Promise<{ id: string; slug: string | null } | null> {
  const { rows } = await rest<{ id: string; slug: string | null }>("jobs", [
    ["select", "id,slug"],
    ["company", `eq.${job.company}`],
    ["title", `eq.${job.title}`],
    ...liveJobParams({ excludeExpired: true }),
    ["order", "created_at.asc,id.asc"],
    ["limit", "1"],
  ]);
  return rows[0] ?? null;
}

async function getSimilarJobs(job: JobRow): Promise<ListRow[]> {
  const params: [string, string][] = [
    ["select", LIST_COLS],
    ["id", `neq.${job.id}`],
    ...liveJobParams(),
    ["order", "posted_at.desc.nullslast"],
    ["limit", "6"],
  ];
  const cat = categoryForTitle(job.title);
  if (cat) params.push(["or", `(${cat.titleTerms.map((t) => `title.ilike.*${t}*`).join(",")})`]);
  return (await rest<ListRow>("jobs", params)).rows;
}

async function getPost(slug: string): Promise<PostRow | null> {
  const { rows } = await rest<PostRow>("posts", [
    ["select", POST_COLS],
    ["slug", `eq.${slug}`],
    ["limit", "1"],
  ]);
  return rows[0] ?? null;
}

async function listPosts(limit = 50): Promise<PostRow[]> {
  return (
    await rest<PostRow>("posts", [
      ["select", "slug,title,excerpt,published_at,seo_title,meta_description,author,content_html,content_markdown"],
      ["published_at", `lte.${new Date().toISOString()}`],
      ["order", "published_at.desc"],
      ["limit", String(limit)],
    ])
  ).rows;
}

function isGone(job: JobRow | null): boolean {
  if (!job) return true;
  if (job.archived_at) return true;
  if (job.apply_before_date && job.apply_before_date < today()) return true;
  return false;
}

function categoryForTitle(title: string): RemoteCategory | undefined {
  const t = title.toLowerCase();
  return REMOTE_CATEGORIES.find((c) => c.titleTerms.some((term) => t.includes(term.toLowerCase())));
}

function hubForLocation(location: string | null): CountryHub | undefined {
  if (!location) return undefined;
  const l = location.toLowerCase();
  return COUNTRY_HUBS.find((h) => l.includes(h.locationQuery.toLowerCase()));
}

/* ----------------------------------------------------------- HTML pieces */

function headHtml(meta: PageMeta, jsonLd: unknown[]): string {
  const title = esc(meta.title);
  const desc = esc(meta.description);
  const url = esc(meta.canonical);
  const image = esc(meta.image || SITE_LOGO);
  const robots = meta.noindex ? "noindex, follow" : "index, follow, max-image-preview:large";
  // data-rh="true" lets react-helmet-async replace these once React loads,
  // so the page never ends up with two descriptions or two canonicals.
  return [
    `<title data-rh="true">${title}</title>`,
    `<meta data-rh="true" name="description" content="${desc}">`,
    `<link data-rh="true" rel="canonical" href="${url}">`,
    `<meta data-rh="true" name="robots" content="${robots}">`,
    `<meta data-rh="true" property="og:site_name" content="${SITE_NAME}">`,
    `<meta data-rh="true" property="og:title" content="${title}">`,
    `<meta data-rh="true" property="og:description" content="${desc}">`,
    `<meta data-rh="true" property="og:type" content="${meta.type || "website"}">`,
    `<meta data-rh="true" property="og:url" content="${url}">`,
    `<meta data-rh="true" property="og:image" content="${image}">`,
    `<meta data-rh="true" name="twitter:card" content="summary_large_image">`,
    `<meta data-rh="true" name="twitter:title" content="${title}">`,
    `<meta data-rh="true" name="twitter:description" content="${desc}">`,
    `<meta data-rh="true" name="twitter:image" content="${image}">`,
    ...jsonLd.map((b) => `<script data-rh="true" type="application/ld+json">${safeJson(b)}</script>`),
  ].join("\n    ");
}

const NAV = [
  ["/", "Jobs"],
  ["/jobs/in", "Remote jobs by country"],
  ["/remote-jobs", "Remote jobs by type"],
  ["/tools", "Salary tools"],
  ["/blog", "Career advice"],
  ["/submit", "Post a remote job"],
];

function shell(main: string): string {
  const topHubs = ["united-states", "usa-global", "united-kingdom", "canada", "germany", "india", "nigeria", "kenya", "europe"]
    .map((s) => getCountryHubBySlug(s))
    .filter(Boolean) as CountryHub[];
  return `<div class="ssr" style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:960px;margin:0 auto;padding:16px;line-height:1.55;color:#111">
<header><nav aria-label="Main"><a href="/"><strong>Eplicant</strong></a> · ${NAV.map(([h, l]) => `<a href="${h}">${esc(l)}</a>`).join(" · ")}</nav></header>
<main>
${main}
</main>
<footer style="margin-top:40px;border-top:1px solid #ddd;padding-top:16px;font-size:14px">
<nav aria-label="Remote jobs by type"><strong>Remote jobs by type:</strong> ${REMOTE_CATEGORIES.map((c) => `<a href="/remote-jobs/${c.slug}">${esc(c.name)}</a>`).join(" · ")}</nav>
<nav aria-label="Remote jobs by country"><strong>By country:</strong> ${topHubs.map((h) => `<a href="/jobs/in/${h.slug}">${esc(h.name)}</a>`).join(" · ")}</nav>
<nav aria-label="Guides"><strong>Guides:</strong> ${GUIDES.map((g) => `<a href="/guides/${g.slug}">${esc(g.title)}</a>`).join(" · ")}</nav>
<nav aria-label="Company"><a href="/about">About</a> · <a href="/contact">Contact</a> · <a href="/newsletter">Newsletter</a> · <a href="/terms">Terms</a> · <a href="/privacy">Privacy</a></nav>
<p>© ${new Date().getUTCFullYear()} ${SITE_NAME}</p>
</footer>
</div>`;
}

function crumbs(items: [string, string][]): string {
  return `<nav aria-label="Breadcrumb">${items
    .map(([href, label], i) => (i === items.length - 1 ? esc(label) : `<a href="${href}">${esc(label)}</a>`))
    .join(" / ")}</nav>`;
}

function jobList(rows: ListRow[]): string {
  if (!rows.length) return "<p>No live roles right now — new remote jobs are added every day.</p>";
  return `<ul>${rows
    .map((j) => {
      const loc = jobLocationLabel(j.location);
      const bits = [esc(j.company), loc ? esc(loc) : "Remote", j.salary ? esc(j.salary) : ""].filter(Boolean);
      return `<li><a href="${jobPath(j)}">${esc(j.title)}</a> — ${bits.join(" · ")}</li>`;
    })
    .join("\n")}</ul>`;
}

function pager(basePath: string, page: number, totalPages: number): string {
  if (totalPages <= 1) return "";
  const href = (p: number) => (p <= 1 ? basePath : `${basePath}?page=${p}`);
  const links: string[] = [];
  if (page > 1) links.push(`<a href="${href(page - 1)}" rel="prev">← Previous</a>`);
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let p = start; p <= end; p++) {
    links.push(p === page ? `<strong>${p}</strong>` : `<a href="${href(p)}">${p}</a>`);
  }
  if (page < totalPages) links.push(`<a href="${href(page + 1)}" rel="next">Next →</a>`);
  return `<nav aria-label="Pagination">Page ${page} of ${totalPages}: ${links.join(" ")}</nav>`;
}

function faqHtml(faqs: { question: string; answer: string }[]): string {
  if (!faqs.length) return "";
  return `<h2>Frequently asked questions</h2><dl>${faqs
    .map((f) => `<dt><strong>${esc(f.question)}</strong></dt><dd>${esc(f.answer)}</dd>`)
    .join("")}</dl>`;
}

function goneHtml(path: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex">
<title>Listing no longer available — Eplicant</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#fafafa;color:#111;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px}.card{max-width:520px;text-align:center}h1{font-size:22px;margin:0 0 12px}p{color:#555;line-height:1.5;margin:0 0 20px}a.btn{display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:500;margin:4px}</style>
</head><body><div class="card"><h1>This listing is no longer available</h1>
<p>The role at <code>${esc(path)}</code> has been closed or removed. Browse current openings on Eplicant.</p>
<a class="btn" href="/">All remote jobs</a> <a class="btn" href="/remote-jobs">Jobs by type</a> <a class="btn" href="/jobs/in">Jobs by country</a></div></body></html>`;
}

/* ----------------------------------------------------------------- routes */

function notFound(path: string): Resolved {
  return {
    kind: "page",
    status: 404,
    meta: {
      title: `Page not found — ${SITE_NAME}`,
      description: "This page doesn't exist. Browse current fully remote jobs on Eplicant.",
      canonical: absoluteUrl(path),
      noindex: true,
    },
    jsonLd: [],
    body: async () =>
      shell(`<h1>Page not found</h1><p>This page doesn't exist.</p><p><a href="/">Browse all remote jobs</a></p>`),
  };
}

async function resolve(url: URL, bot: boolean): Promise<Resolved> {
  const path = url.pathname;
  const parts = path.split("/").filter(Boolean);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);

  /* --- legacy redirects (were client-side <Navigate>, now real 301s) --- */
  if (path === "/opportunities" || parts[0] === "opportunity") return { kind: "redirect", to: "/" };
  if (path === "/guides/un-careers") return { kind: "redirect", to: "/" };
  if (parts[0] === "jobs" && parts[1] === "in" && parts[2] === "cities") {
    return { kind: "redirect", to: LEGACY_CITY_REDIRECTS[(parts[3] || "").toLowerCase()] || "/jobs/in" };
  }

  /* --- homepage --- */
  if (path === "/") {
    const route = getStaticRoute("/")!;
    const meta = buildMeta({ title: route.title, description: route.description, path: "/" });
    // Only the crawler body needs the rows; page 2+ needs the total for a 404 check.
    const needData = bot || page > 1;
    const data = needData ? await listJobs({ page, withRows: bot }) : null;
    if (data && page > data.totalPages) return notFound(path);
    return {
      kind: "page",
      status: 200,
      meta,
      jsonLd: [organizationJsonLd, websiteJsonLd, faqJsonLd(HOME_FAQS)],
      body: async () =>
        shell(`<h1>Remote jobs you can do from anywhere</h1>
<p>Engineering, design, marketing, support, operations, finance and more — fully remote roles only, updated daily. No commute, no relocation. ${data ? `${data.total.toLocaleString("en-US")} live remote jobs.` : ""}</p>
<h2>Latest remote jobs</h2>
${jobList(data?.rows ?? [])}
${pager("/", page, data?.totalPages ?? 1)}
<h2>Remote jobs by type</h2>
<ul>${REMOTE_CATEGORIES.map((c) => `<li><a href="/remote-jobs/${c.slug}">${esc(c.metaTitle)}</a></li>`).join("")}</ul>
<h2>Remote jobs by country</h2>
<ul>${COUNTRY_HUBS.map((h) => `<li><a href="/jobs/in/${h.slug}">${esc(hubHeading(h))}</a></li>`).join("")}</ul>
${faqHtml(HOME_FAQS)}`),
    };
  }

  /* --- /jobs/in and country hubs --- */
  if (parts[0] === "jobs" && parts[1] === "in") {
    if (parts.length === 2) {
      const route = getStaticRoute("/jobs/in")!;
      return {
        kind: "page",
        status: 200,
        meta: buildMeta({ title: route.title, description: route.description, path: "/jobs/in" }),
        jsonLd: [breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Remote jobs by country", path: "/jobs/in" }])],
        body: async () =>
          shell(`${crumbs([["/", "Home"], ["/jobs/in", "Remote jobs by country"]])}
<h1>${esc(route.title)}</h1><p>${esc(route.description)}</p>
<ul>${COUNTRY_HUBS.map((h) => `<li><a href="/jobs/in/${h.slug}">${esc(hubHeading(h))}</a></li>`).join("")}</ul>`),
      };
    }
    if (parts.length === 3) {
      const slug = parts[2].toLowerCase();
      const hub = getCountryHubBySlug(slug);
      if (!hub) return { kind: "redirect", to: LEGACY_CITY_REDIRECTS[slug] || "/jobs/in" };
      const hubPath = `/jobs/in/${hub.slug}`;
      const heading = hubHeading(hub);
      const data = await listJobs({ page, location: hub.locationQuery, withRows: bot });
      if (page > data.totalPages) return notFound(path);
      const meta = buildMeta({ title: heading, description: hub.blurb, path: hubPath, noindex: data.total < HUB_MIN_JOBS });
      return {
        kind: "page",
        status: 200,
        meta,
        jsonLd: [
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Remote jobs by country", path: "/jobs/in" },
            { name: hub.name, path: hubPath },
          ]),
        ],
        body: async () =>
          shell(`${crumbs([["/", "Home"], ["/jobs/in", "Remote jobs by country"], [hubPath, hub.name]])}
<h1>${esc(heading)}</h1><p>${esc(hub.blurb)}</p>
<p>${data.total.toLocaleString("en-US")} jobs found.</p>
${jobList(data.rows)}
${pager(hubPath, page, data.totalPages)}
<h2>Other locations</h2>
<ul>${COUNTRY_HUBS.filter((h) => h.slug !== hub.slug).slice(0, 12).map((h) => `<li><a href="/jobs/in/${h.slug}">${esc(h.name)}</a></li>`).join("")}</ul>`),
      };
    }
    return notFound(path);
  }

  /* --- /remote-jobs and categories --- */
  if (parts[0] === "remote-jobs") {
    if (parts.length === 1) {
      const route = getStaticRoute("/remote-jobs")!;
      return {
        kind: "page",
        status: 200,
        meta: buildMeta({ title: route.title, description: route.description, path: "/remote-jobs" }),
        jsonLd: [breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Remote jobs by type", path: "/remote-jobs" }])],
        body: async () =>
          shell(`${crumbs([["/", "Home"], ["/remote-jobs", "Remote jobs by type"]])}
<h1>Remote jobs by type</h1><p>Pick a field to see live remote roles, typical pay and advice on getting hired.</p>
<ul>${REMOTE_CATEGORIES.map((c) => `<li><a href="/remote-jobs/${c.slug}">Remote ${esc(c.name.toLowerCase())} jobs</a> — ${esc(c.metaDescription)}</li>`).join("")}</ul>`),
      };
    }
    const cat = parts.length === 2 ? getRemoteCategory(parts[1]) : undefined;
    if (!cat) return notFound(path);
    const catPath = `/remote-jobs/${cat.slug}`;
    return {
      kind: "page",
      status: 200,
      meta: buildMeta({ title: cat.metaTitle, description: cat.metaDescription, path: catPath }),
      jsonLd: [
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Remote jobs by type", path: "/remote-jobs" },
          { name: cat.name, path: catPath },
        ]),
        faqJsonLd(cat.faqs),
      ],
      body: async () => {
        const data = await listJobs({ page: 1, titleAny: cat.titleTerms, limit: 30, withRows: true });
        return shell(`${crumbs([["/", "Home"], ["/remote-jobs", "Remote jobs by type"], [catPath, cat.name]])}
<h1>${esc(cat.metaTitle)}</h1><p>${esc(cat.intro)}</p>
<h2>Live remote ${esc(cat.name.toLowerCase())} jobs</h2>
${jobList(data.rows)}
<h2>Common remote roles</h2>
<ul>${cat.roles.map((r) => `<li><strong>${esc(r.name)}</strong>: ${esc(r.summary)}</li>`).join("")}</ul>
<h2>Skills employers look for</h2>
<ul>${cat.skills.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
<h2>Tips for getting hired</h2>
<ul>${cat.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
${faqHtml(cat.faqs)}
<h2>Other fields</h2>
<ul>${REMOTE_CATEGORIES.filter((c) => c.slug !== cat.slug).map((c) => `<li><a href="/remote-jobs/${c.slug}">${esc(c.metaTitle)}</a></li>`).join("")}</ul>`);
      },
    };
  }

  /* --- guides --- */
  if (parts[0] === "guides") {
    const guide = parts.length === 2 ? getGuide(parts[1]) : undefined;
    if (!guide) return notFound(path);
    const gPath = `/guides/${guide.slug}`;
    const meta = buildMeta({ title: guide.metaTitle, description: guide.metaDescription, path: gPath, type: "article" });
    return {
      kind: "page",
      status: 200,
      meta,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: guide.title,
          description: meta.description,
          image: SITE_LOGO,
          author: { "@type": "Organization", name: SITE_NAME },
          publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: SITE_LOGO } },
          mainEntityOfPage: absoluteUrl(gPath),
        },
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/blog" },
          { name: guide.title, path: gPath },
        ]),
      ],
      body: async () =>
        shell(`${crumbs([["/", "Home"], ["/blog", "Guides"], [gPath, guide.title]])}
<article><h1>${esc(guide.title)}</h1><p>${esc(guide.intro)}</p>
${guide.sections
  .map(
    (sec) =>
      `<h2>${esc(sec.heading)}</h2>${sec.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}${
        sec.list ? `<ul>${sec.list.map((li) => `<li>${esc(li)}</li>`).join("")}</ul>` : ""
      }`
  )
  .join("\n")}
</article>
<h2>Related</h2><ul>${guide.related.map((r) => `<li><a href="${esc(r.to)}">${esc(r.label)}</a></li>`).join("")}</ul>`),
    };
  }

  /* --- blog --- */
  if (parts[0] === "blog") {
    if (parts.length === 1) {
      const route = getStaticRoute("/blog")!;
      return {
        kind: "page",
        status: 200,
        meta: buildMeta({ title: route.title, description: route.description, path: "/blog" }),
        jsonLd: [breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Career advice", path: "/blog" }])],
        body: async () => {
          const posts = await listPosts();
          return shell(`<h1>${esc(route.title)}</h1><p>${esc(route.description)}</p>
<ul>${posts.map((p) => `<li><a href="/blog/${esc(p.slug)}">${esc(p.title)}</a>${p.excerpt ? ` — ${esc(p.excerpt)}` : ""}</li>`).join("\n")}</ul>
<h2>Guides</h2><ul>${GUIDES.map((g) => `<li><a href="/guides/${g.slug}">${esc(g.title)}</a></li>`).join("")}</ul>`);
        },
      };
    }
    if (parts.length !== 2) return notFound(path);
    const post = await getPost(parts[1]);
    if (!post) return notFound(path);
    const pPath = `/blog/${post.slug}`;
    const bodyText = stripHtml(post.content_html) || (post.content_markdown || "").replace(/[#*_>`]/g, "");
    const description = post.meta_description || post.excerpt || clampDescription(bodyText);
    const meta = buildMeta({ title: post.seo_title || post.title, description, path: pPath, type: "article" });
    return {
      kind: "page",
      status: 200,
      meta,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: meta.description,
          image: SITE_LOGO,
          datePublished: post.published_at,
          author: { "@type": "Person", name: post.author || "Editorial Team" },
          publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: SITE_LOGO } },
          mainEntityOfPage: absoluteUrl(pPath),
        },
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Career advice", path: "/blog" },
          { name: post.title, path: pPath },
        ]),
      ],
      body: async () =>
        shell(`${crumbs([["/", "Home"], ["/blog", "Career advice"], [pPath, post.title]])}
<article><h1>${esc(post.title)}</h1>
<p>By ${esc(post.author || "Editorial Team")}${post.published_at ? ` · ${esc(post.published_at.slice(0, 10))}` : ""}</p>
${post.content_html ? sanitizeHtml(post.content_html) : markdownToHtml(post.content_markdown)}
</article>
<p><a href="/blog">More career advice</a> · <a href="/">Browse remote jobs</a></p>`),
    };
  }

  /* --- jobs --- */
  if (parts[0] === "job") {
    // Legacy /job/id/:uuid → real 301 to the slug URL (or 410 if gone).
    if (parts[1] === "id" && parts[2]) {
      const job = await getJob("id", parts[2]);
      if (isGone(job)) return { kind: "gone", path };
      return { kind: "redirect", to: jobPath(job!) };
    }
    if (parts.length !== 2) return notFound(path);
    const key = parts[1];
    const job = await getJob("slug", key);
    if (isGone(job)) {
      // 410 for real-looking slugs or confirmed-gone rows; anything else is a plain 404.
      if (job || /-[0-9a-f]{8}$/i.test(key)) return { kind: "gone", path };
      return notFound(path);
    }
    const live = job!;
    const primary = await getPrimaryJob(live);
    const canonicalPath = jobPath(primary ?? live);
    const descriptionHtml = sanitizeHtml(live.clean_description || live.description);
    const meta: PageMeta = {
      title: jobTitleTag(live),
      description: jobMetaDescription(live),
      canonical: absoluteUrl(canonicalPath),
      image: live.company_logo || SITE_LOGO,
      noindex: !jobIsIndexable(live),
    };
    return {
      kind: "page",
      status: 200,
      meta,
      jsonLd: [jobPostingJsonLd(live, { descriptionHtml })],
      body: async () => {
        const similar = await getSimilarJobs(live);
        const cat = categoryForTitle(live.title);
        const hub = hubForLocation(live.location);
        const loc = jobLocationLabel(live.location);
        const applyHref = live.apply_url || live.url || "";
        const facts = [
          `<li><strong>Company:</strong> ${esc(live.company)}</li>`,
          `<li><strong>Where you can work from:</strong> ${loc ? esc(loc) : "Anywhere (remote)"}</li>`,
          live.employment_type || live.job_type ? `<li><strong>Job type:</strong> ${esc(live.employment_type || live.job_type)}</li>` : "",
          live.salary ? `<li><strong>Salary:</strong> ${esc(live.salary)}</li>` : "",
          live.posted_at ? `<li><strong>Posted:</strong> ${esc(live.posted_at.slice(0, 10))}</li>` : "",
          live.apply_before_date ? `<li><strong>Apply before:</strong> ${esc(live.apply_before_date)}</li>` : "",
        ].join("");
        return shell(`${crumbs([
          ["/", "Home"],
          ...(cat ? [[`/remote-jobs/${cat.slug}`, cat.name] as [string, string]] : []),
          [jobPath(live), live.title],
        ])}
<article>
<h1>${esc(live.title)} @ ${esc(live.company)}</h1>
<p>${esc(live.company)} is hiring a remote ${esc(live.title)}${loc ? ` (${esc(loc)})` : ""}.</p>
<ul>${facts}</ul>
${/^(https?:|mailto:)/i.test(applyHref) ? `<p><a href="${esc(applyHref)}" rel="nofollow noopener">Apply on the employer's site</a></p>` : ""}
<h2>About the role</h2>
${descriptionHtml}
</article>
<h2>Similar remote jobs</h2>
${jobList(similar)}
<p>${cat ? `<a href="/remote-jobs/${cat.slug}">More remote ${esc(cat.name.toLowerCase())} jobs</a> · ` : ""}${hub ? `<a href="/jobs/in/${hub.slug}">${esc(hubHeading(hub))}</a> · ` : ""}<a href="/">All remote jobs</a></p>`);
      },
    };
  }

  /* --- other static pages (about, contact, terms, privacy, tools, newsletter, submit) --- */
  const route = STATIC_ROUTES.find((r) => r.path === path);
  if (route) {
    return {
      kind: "page",
      status: 200,
      meta: buildMeta({ title: route.title, description: route.description, path: route.path }),
      jsonLd: [],
      body: async () => shell(`<h1>${esc(route.title)}</h1><p>${esc(route.description)}</p>`),
    };
  }

  return notFound(path);
}

/* ---------------------------------------------------------------- handler */

const SKIP_PREFIXES = ["/assets/", "/api/", "/.netlify/", "/sitemap"];

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method !== "GET" && request.method !== "HEAD") return context.next();
  // Static files (/logo.png, /robots.txt, /8aac…txt, /sw.js …) and APIs pass straight through.
  if (/\.[a-z0-9]{2,8}$/i.test(path) || SKIP_PREFIXES.some((p) => path.startsWith(p))) {
    return context.next();
  }
  // One URL per page: strip trailing slashes ("/about/" → "/about").
  if (path.length > 1 && path.endsWith("/")) {
    return Response.redirect(`${SITE_URL}${path.replace(/\/+$/, "")}${url.search}`, 301);
  }

  try {
    const bot = isBot(request.headers.get("user-agent"));
    const r = await resolve(url, bot);

    if (r.kind === "redirect") {
      return new Response(null, {
        status: 301,
        headers: { location: r.to, "cache-control": "public, max-age=86400" },
      });
    }

    if (r.kind === "gone") {
      return new Response(request.method === "HEAD" ? null : goneHtml(r.path), {
        status: 410,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "public, max-age=300",
          "x-robots-tag": "noindex",
        },
      });
    }

    // Normal page: take index.html from the SPA fallback and fill it in.
    const meta = r.status === 404 ? r.meta : applyQueryToMeta(r.meta, url.search);
    const upstream = await context.next();
    let html = await upstream.text();
    const head = headHtml(meta, r.jsonLd);
    if (html.includes("<!--seo-head-->")) {
      html = html.replace(/<!--seo-head-->[\s\S]*?<!--\/seo-head-->/, head);
    } else {
      // Safety net if the markers were removed from index.html.
      html = html.replace(/<title>[\s\S]*?<\/title>/i, "").replace("</head>", `    ${head}\n  </head>`);
    }
    if (bot && r.body) {
      html = html.replace('<div id="root"></div>', `<div id="root">${await r.body()}</div>`);
    }

    const headers = new Headers(upstream.headers);
    headers.delete("content-length");
    headers.delete("content-encoding");
    headers.delete("etag");
    headers.set("content-type", "text/html; charset=utf-8");
    headers.set("vary", "User-Agent");
    headers.set("cache-control", "public, max-age=0, must-revalidate");
    if (r.status === 404 || meta.noindex) headers.set("x-robots-tag", "noindex");
    else headers.delete("x-robots-tag");

    return new Response(request.method === "HEAD" ? null : html, { status: r.status, headers });
  } catch (e) {
    console.error("seo edge function failed:", e);
    return context.next(); // fail open: the site keeps working
  }
};

export const config = {
  path: "/*",
  excludedPath: [
    "/assets/*", "/api/*", "/sitemap*", "/.netlify/*",
    "/*.js", "/*.css", "/*.png", "/*.jpg", "/*.webp", "/*.svg", "/*.ico",
    "/*.txt", "/*.xml", "/*.json", "/*.webmanifest", "/*.map",
  ],
};
