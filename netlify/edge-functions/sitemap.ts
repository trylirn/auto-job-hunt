// netlify/edge-functions/sitemap.ts
//
// Serves the sitemaps from eplicant.com itself (no more Supabase proxy), with
// the correct Content-Type (application/xml):
//
//   /sitemap.xml        → sitemap index pointing at the three below
//   /sitemap-pages.xml  → static pages, /remote-jobs/*, /guides/*, country hubs with ≥ HUB_MIN_JOBS jobs
//   /sitemap-jobs.xml   → live, indexable, de-duplicated job pages
//   /sitemap-blog.xml   → published blog posts
//
// Splitting them lets you see in Search Console / Bing exactly which kind of
// page is or isn't getting indexed.

import { SITE_URL, HUB_MIN_JOBS, jobDuplicateKey, jobPath } from "../../src/lib/seo.ts";
import { STATIC_ROUTES } from "../../src/lib/routes.ts";
import { COUNTRY_HUBS } from "../../src/data/countryHubs.ts";
import { REMOTE_CATEGORIES } from "../../src/data/remoteCategories.ts";
import { GUIDES } from "../../src/data/guides.ts";
import { esc, liveJobParams, rest } from "../shared/eplicant.ts";

interface Entry {
  loc: string;
  lastmod?: string | null;
}

function urlset(entries: Entry[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map((e) => `  <url><loc>${esc(e.loc)}</loc>${e.lastmod ? `<lastmod>${e.lastmod.slice(0, 10)}</lastmod>` : ""}</url>`)
  .join("\n")}
</urlset>
`;
}

function sitemapIndex(names: string[]): string {
  const now = new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${names.map((n) => `  <sitemap><loc>${SITE_URL}/${n}</loc><lastmod>${now}</lastmod></sitemap>`).join("\n")}
</sitemapindex>
`;
}

async function pagesEntries(): Promise<Entry[]> {
  const statics: Entry[] = STATIC_ROUTES.filter((r) => r.indexable).map((r) => ({ loc: `${SITE_URL}${r.path === "/" ? "/" : r.path}` }));
  const categories: Entry[] = REMOTE_CATEGORIES.map((c) => ({ loc: `${SITE_URL}/remote-jobs/${c.slug}` }));
  const guides: Entry[] = GUIDES.map((g) => ({ loc: `${SITE_URL}/guides/${g.slug}` }));

  // Same count the hub page uses (live jobs whose location matches), so a hub
  // that is noindexed for being thin is never listed here.
  const hubCounts = await Promise.all(
    COUNTRY_HUBS.map(async (h) => {
      const { count } = await rest("jobs", [
        ["select", "id"],
        ...liveJobParams(),
        ["location", `ilike.*${h.locationQuery}*`],
        ["limit", "0"],
      ], { count: true });
      return { h, count: count ?? 0 };
    })
  );
  const hubs: Entry[] = hubCounts
    .filter((x) => x.count >= HUB_MIN_JOBS)
    .map((x) => ({ loc: `${SITE_URL}/jobs/in/${x.h.slug}` }));

  return [...statics, ...categories, ...guides, ...hubs];
}

interface SitemapJob {
  id: string;
  slug: string | null;
  title: string;
  company: string;
  updated_at: string | null;
  created_at: string | null;
}

async function jobEntries(): Promise<Entry[]> {
  const seen = new Set<string>();
  const out: Entry[] = [];
  const PAGE = 1000; // PostgREST returns at most 1000 rows per request
  for (let offset = 0; offset < 50000; offset += PAGE) {
    const { rows, ok } = await rest<SitemapJob>("jobs", [
      // No descriptions here: Netlify edge functions get ~50 ms of CPU, and
      // parsing thousands of descriptions would blow it. Office-based roles are
      // archived daily by archive-expired-listings, so they never reach this list.
      ["select", "id,slug,title,company,updated_at,created_at"],
      ...liveJobParams({ excludeExpired: true }),
      // Oldest first, so the first copy of a duplicated role is the canonical one
      // (same order as usePrimaryJob / the seo edge function).
      ["order", "created_at.asc,id.asc"],
      ["limit", String(PAGE)],
      ["offset", String(offset)],
    ]);
    if (!ok) break;
    for (const j of rows) {
      const key = jobDuplicateKey(j);
      if (seen.has(key)) continue; // a per-country copy: its canonical is the first one
      seen.add(key);
      out.push({ loc: `${SITE_URL}${jobPath(j)}`, lastmod: j.updated_at || j.created_at });
    }
    if (rows.length < PAGE) break;
  }
  return out;
}

async function blogEntries(): Promise<Entry[]> {
  const { rows } = await rest<{ slug: string; published_at: string | null }>("posts", [
    ["select", "slug,published_at"],
    ["published_at", `lte.${new Date().toISOString()}`],
    ["order", "published_at.desc"],
    ["limit", "5000"],
  ]);
  return rows.map((p) => ({ loc: `${SITE_URL}/blog/${p.slug}`, lastmod: p.published_at }));
}

function xml(body: string): Response {
  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      // Browsers re-check every time; Netlify's CDN keeps a copy for 1 hour.
      "cache-control": "public, max-age=0, must-revalidate",
      "netlify-cdn-cache-control": "public, s-maxage=3600, stale-while-revalidate=600",
    },
  });
}

export default async (request: Request) => {
  const { pathname } = new URL(request.url);
  try {
    switch (pathname) {
      case "/sitemap.xml":
        return xml(sitemapIndex(["sitemap-pages.xml", "sitemap-jobs.xml", "sitemap-blog.xml"]));
      case "/sitemap-pages.xml":
        return xml(urlset(await pagesEntries()));
      case "/sitemap-jobs.xml":
        return xml(urlset(await jobEntries()));
      case "/sitemap-blog.xml":
        return xml(urlset(await blogEntries()));
      default:
        return new Response("Not found", { status: 404 });
    }
  } catch (e) {
    console.error("sitemap failed:", e);
    return new Response("Sitemap temporarily unavailable", { status: 503, headers: { "retry-after": "600" } });
  }
};

export const config = {
  path: ["/sitemap.xml", "/sitemap-pages.xml", "/sitemap-jobs.xml", "/sitemap-blog.xml"],
  cache: "manual",
};
