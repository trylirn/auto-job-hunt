import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = "https://eplicant.com";

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq: string;
  priority: string;
}

function buildXml(entries: SitemapEntry[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) => `  <url>
    <loc>${e.loc}</loc>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ""}
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;
}

const STATIC_PAGES: SitemapEntry[] = [
  { loc: `${SITE_URL}/`, changefreq: "daily", priority: "1.0" },
  { loc: `${SITE_URL}/opportunities`, changefreq: "daily", priority: "0.9" },
  { loc: `${SITE_URL}/jobs/in`, changefreq: "daily", priority: "0.8" },
  { loc: `${SITE_URL}/newsletter`, changefreq: "weekly", priority: "0.7" },
  { loc: `${SITE_URL}/submit`, changefreq: "monthly", priority: "0.6" },
  { loc: `${SITE_URL}/about`, changefreq: "monthly", priority: "0.5" },
  { loc: `${SITE_URL}/contact`, changefreq: "monthly", priority: "0.5" },
];

// Country hubs — kept in sync with src/data/countryHubs.ts.
const COUNTRY_HUBS: { slug: string; query: string }[] = [
  { slug: "united-states", query: "United States" },
  { slug: "usa-global", query: "Global" },
  { slug: "nigeria", query: "Nigeria" },
  { slug: "united-kingdom", query: "United Kingdom" },
  { slug: "kenya", query: "Kenya" },
  { slug: "south-africa", query: "South Africa" },
  { slug: "germany", query: "Germany" },
  { slug: "canada", query: "Canada" },
  { slug: "india", query: "India" },
  { slug: "ghana", query: "Ghana" },
  { slug: "australia", query: "Australia" },
  { slug: "switzerland", query: "Switzerland" },
  { slug: "belgium", query: "Belgium" },
  { slug: "netherlands", query: "Netherlands" },
  { slug: "sweden", query: "Sweden" },
  { slug: "denmark", query: "Denmark" },
  { slug: "austria", query: "Austria" },
  { slug: "france", query: "France" },
  { slug: "ireland", query: "Ireland" },
  { slug: "ethiopia", query: "Ethiopia" },
  { slug: "uganda", query: "Uganda" },
  { slug: "senegal", query: "Senegal" },
  { slug: "egypt", query: "Egypt" },
  { slug: "jordan", query: "Jordan" },
  { slug: "bangladesh", query: "Bangladesh" },
  { slug: "philippines", query: "Philippines" },
  { slug: "singapore", query: "Singapore" },
  { slug: "thailand", query: "Thailand" },
  { slug: "japan", query: "Japan" },
  { slug: "south-korea", query: "South Korea" },
  { slug: "china", query: "China" },
  { slug: "sub-saharan-africa", query: "Sub-Saharan Africa" },
  { slug: "east-africa", query: "East Africa" },
  { slug: "west-africa", query: "West Africa" },
  { slug: "southern-africa", query: "Southern Africa" },
  { slug: "mena", query: "MENA" },
  { slug: "europe", query: "Europe" },
  { slug: "latin-america", query: "Latin America" },
  { slug: "asia-pacific", query: "Asia-Pacific" },
];

// City hubs — kept in sync with src/data/cityHubs.ts.
const CITY_HUBS: { slug: string; query: string }[] = [
  { slug: "nairobi", query: "Nairobi" },
  { slug: "new-york", query: "New York" },
  { slug: "geneva", query: "Geneva" },
  { slug: "washington-dc", query: "Washington" },
  { slug: "london", query: "London" },
  { slug: "addis-ababa", query: "Addis Ababa" },
  { slug: "bangkok", query: "Bangkok" },
  { slug: "dakar", query: "Dakar" },
  { slug: "lagos", query: "Lagos" },
  { slug: "abuja", query: "Abuja" },
  { slug: "brussels", query: "Brussels" },
  { slug: "rome", query: "Rome" },
  { slug: "vienna", query: "Vienna" },
  { slug: "copenhagen", query: "Copenhagen" },
  { slug: "kampala", query: "Kampala" },
  { slug: "amman", query: "Amman" },
  { slug: "manila", query: "Manila" },
  { slug: "delhi", query: "Delhi" },
  { slug: "berlin", query: "Berlin" },
  { slug: "bonn", query: "Bonn" },
  { slug: "paris", query: "Paris" },
];

async function hubsWithJobs(
  supabase: ReturnType<typeof createClient>,
  hubs: { slug: string; query: string }[],
  pathPrefix: string,
  today: string
): Promise<SitemapEntry[]> {
  const today_lm = new Date().toISOString().split("T")[0];
  const results = await Promise.all(
    hubs.map(async (h) => {
      const { count } = await supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .is("archived_at", null)
        .or(`apply_before_date.is.null,apply_before_date.gte.${today}`)
        .ilike("location", `%${h.query}%`);
      return { hub: h, count: count ?? 0 };
    })
  );
  return results
    .filter((r) => r.count > 0)
    .map((r) => ({
      loc: `${SITE_URL}${pathPrefix}/${r.hub.slug}`,
      lastmod: today_lm,
      changefreq: "daily",
      priority: "0.8",
    }));
}

Deno.serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date().toISOString().slice(0, 10);

    const [{ data: jobs, error }, countryEntries, cityEntries] = await Promise.all([
      supabase
        .from("jobs")
        .select("id, slug, updated_at, created_at, apply_before_date")
        .is("archived_at", null)
        .or(`apply_before_date.is.null,apply_before_date.gte.${today}`)
        .order("updated_at", { ascending: false })
        .limit(45000),
      hubsWithJobs(supabase, COUNTRY_HUBS, "/jobs/in", today),
      hubsWithJobs(supabase, CITY_HUBS, "/jobs/in/cities", today),
    ]);

    if (error) {
      console.error("sitemap query error:", error.message);
      return new Response(buildXml([...STATIC_PAGES, ...countryEntries, ...cityEntries]), {
        headers: {
          "Content-Type": "application/xml",
          "Cache-Control": "public, max-age=300",
        },
      });
    }

    const jobEntries: SitemapEntry[] = (jobs || []).map((job) => {
      const lm = job.updated_at || job.created_at;
      return {
        loc: `${SITE_URL}/job/${job.slug || job.id}`,
        lastmod: lm ? lm.split("T")[0] : undefined,
        changefreq: "weekly",
        priority: "0.7",
      };
    });

    return new Response(
      buildXml([...STATIC_PAGES, ...countryEntries, ...cityEntries, ...jobEntries]),
      {
        headers: {
          "Content-Type": "application/xml",
          "Cache-Control": "public, max-age=3600",
        },
      }
    );
  } catch (e) {
    console.error("sitemap fatal:", e);
    return new Response(buildXml(STATIC_PAGES), {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=300",
      },
    });
  }
});
