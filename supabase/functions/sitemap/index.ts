import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = "https://eplicant.com";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("id, slug, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    return new Response(`Error fetching jobs: ${error.message}`, { status: 500 });
  }

  const staticPages = [
    { loc: `${SITE_URL}/`, changefreq: "daily", priority: "1.0" },
    { loc: `${SITE_URL}/opportunities`, changefreq: "daily", priority: "0.9" },
  ];

  const jobEntries = (jobs || []).map((job) => ({
    loc: `${SITE_URL}/job/${job.slug || job.id}`,
    lastmod: job.updated_at ? job.updated_at.split("T")[0] : undefined,
    changefreq: "weekly",
    priority: "0.7",
  }));

  const allEntries = [...staticPages, ...jobEntries];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allEntries
  .map(
    (e) => `  <url>
    <loc>${e.loc}</loc>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ""}
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
