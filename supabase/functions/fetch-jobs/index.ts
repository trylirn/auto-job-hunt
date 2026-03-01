import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NormalizedJob {
  title: string;
  company: string;
  location: string | null;
  job_type: string | null;
  category: string | null;
  description: string | null;
  url: string;
  source: string;
  external_id: string;
  posted_at: string | null;
  salary: string | null;
  tags: string[] | null;
  company_logo: string | null;
  is_remote: boolean;
}

async function fetchYeshubJobs(): Promise<NormalizedJob[]> {
  try {
    // Fetch categories first to map IDs to names
    const catRes = await fetch("https://yeshub.ng/wp-json/wp/v2/categories?per_page=100");
    const categories: Record<number, string> = {};
    if (catRes.ok) {
      const cats = await catRes.json();
      for (const c of cats) {
        categories[c.id] = (c.name || "").toLowerCase();
      }
    }

    const res = await fetch("https://yeshub.ng/wp-json/wp/v2/posts?per_page=50&_embed");
    if (!res.ok) return [];
    const posts = await res.json();

    return posts.map((p: any) => {
      const catIds: number[] = p.categories || [];
      const catName = catIds.length > 0 ? categories[catIds[0]] || null : null;

      // Get featured image from _embedded
      const featuredMedia = p._embedded?.["wp:featuredmedia"]?.[0]?.source_url || null;

      const title = (p.title?.rendered || "").replace(/<[^>]*>/g, "").trim();
      
      // Use full content instead of excerpt
      const description = (p.content?.rendered || "").trim();

      // Extract company name from title patterns like "Job Title at Company" or "Job Title – Company"
      let company = "Unknown";
      const atMatch = title.match(/\bat\s+(.+)$/i);
      const dashMatch = title.match(/[–—-]\s*(.+)$/);
      if (atMatch) {
        company = atMatch[1].trim();
      } else if (dashMatch) {
        company = dashMatch[1].trim();
      }

      return {
        title,
        company,
        location: "Nigeria",
        job_type: catName || "opportunity",
        category: catName,
        description,
        url: p.link,
        source: "yeshub",
        external_id: String(p.id),
        posted_at: p.date || null,
        salary: null,
        tags: catIds.map((id: number) => categories[id]).filter(Boolean),
        company_logo: featuredMedia,
        is_remote: false,
      };
    });
  } catch (e) {
    console.error("YesHub fetch error:", e);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Clean up non-yeshub records
    const { error: deleteError } = await supabase
      .from("jobs")
      .delete()
      .neq("source", "yeshub");
    
    if (deleteError) {
      console.error("Error cleaning non-yeshub records:", deleteError);
    } else {
      console.log("Cleaned non-yeshub records");
    }

    console.log("Fetching jobs from YesHub...");
    const yeshubJobs = await fetchYeshubJobs();
    console.log(`Fetched ${yeshubJobs.length} jobs from YesHub`);

    let inserted = 0;
    let skipped = 0;

    const batchSize = 50;
    for (let i = 0; i < yeshubJobs.length; i += batchSize) {
      const batch = yeshubJobs.slice(i, i + batchSize);
      const { error } = await supabase
        .from("jobs")
        .upsert(batch, { onConflict: "source,external_id", ignoreDuplicates: false });

      if (error) {
        console.error("Upsert error:", error);
        skipped += batch.length;
      } else {
        inserted += batch.length;
      }
    }

    console.log(`Done: ${inserted} processed, ${skipped} skipped`);

    return new Response(
      JSON.stringify({ success: true, fetched: yeshubJobs.length, inserted, skipped }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
