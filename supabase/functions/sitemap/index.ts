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
];

Deno.serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date().toISOString().slice(0, 10);

    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("id, slug, updated_at, created_at, apply_before_date")
      .is("archived_at", null)
      .or(`apply_before_date.is.null,apply_before_date.gte.${today}`)
      .order("updated_at", { ascending: false })
      .limit(45000);

    if (error) {
      console.error("sitemap query error:", error.message);
      // Never return 5xx — Google flags this in Search Console
      return new Response(buildXml(STATIC_PAGES), {
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

    return new Response(buildXml([...STATIC_PAGES, ...jobEntries]), {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
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
