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

async function fetchRemotiveJobs(): Promise<NormalizedJob[]> {
  try {
    const res = await fetch("https://remotive.com/api/remote-jobs?limit=50");
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs || []).map((j: any) => ({
      title: j.title,
      company: j.company_name,
      location: j.candidate_required_location || null,
      job_type: j.job_type?.toLowerCase().replace("_", "-") || null,
      category: j.category?.toLowerCase() || null,
      description: (j.description || "").replace(/<[^>]*>/g, "").slice(0, 2000),
      url: j.url,
      source: "remotive",
      external_id: String(j.id),
      posted_at: j.publication_date || null,
      salary: j.salary || null,
      tags: j.tags || null,
      company_logo: j.company_logo || null,
      is_remote: true,
    }));
  } catch (e) {
    console.error("Remotive fetch error:", e);
    return [];
  }
}

async function fetchArbeitnowJobs(): Promise<NormalizedJob[]> {
  try {
    const res = await fetch("https://www.arbeitnow.com/api/job-board-api");
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).map((j: any) => ({
      title: j.title,
      company: j.company_name,
      location: j.location || null,
      job_type: j.remote ? "remote" : "full-time",
      category: j.tags?.[0]?.toLowerCase() || null,
      description: (j.description || "").replace(/<[^>]*>/g, "").slice(0, 2000),
      url: j.url,
      source: "arbeitnow",
      external_id: String(j.slug),
      posted_at: j.created_at ? new Date(j.created_at * 1000).toISOString() : null,
      salary: null,
      tags: j.tags || null,
      company_logo: null,
      is_remote: !!j.remote,
    }));
  } catch (e) {
    console.error("Arbeitnow fetch error:", e);
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

    console.log("Fetching jobs from APIs...");
    const [remotiveJobs, arbeitnowJobs] = await Promise.all([
      fetchRemotiveJobs(),
      fetchArbeitnowJobs(),
    ]);

    const allJobs = [...remotiveJobs, ...arbeitnowJobs];
    console.log(`Fetched ${allJobs.length} total jobs`);

    let inserted = 0;
    let skipped = 0;

    // Upsert in batches
    const batchSize = 50;
    for (let i = 0; i < allJobs.length; i += batchSize) {
      const batch = allJobs.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from("jobs")
        .upsert(batch, { onConflict: "source,external_id", ignoreDuplicates: true });

      if (error) {
        console.error("Upsert error:", error);
        skipped += batch.length;
      } else {
        inserted += batch.length;
      }
    }

    console.log(`Done: ${inserted} processed, ${skipped} skipped`);

    return new Response(
      JSON.stringify({ success: true, fetched: allJobs.length, inserted, skipped }),
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
