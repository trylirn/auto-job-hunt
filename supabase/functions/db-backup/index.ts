import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireCronAuth } from "../_shared/require-cron.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-token",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  const authFail = requireCronAuth(req);
  if (authFail) return authFail;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch all jobs
  const allJobs: any[] = [];
  let offset = 0;
  const limit = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    allJobs.push(...(data || []));
    if (!data || data.length < limit) break;
    offset += limit;
  }

  const escapeSql = (val: string) => val.replace(/'/g, "''");

  const sqlLines: string[] = [
    "-- Database backup generated on " + new Date().toISOString(),
    "-- Total records: " + allJobs.length,
    "",
    "-- Schema",
    `CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  company text NOT NULL,
  location text,
  job_type text,
  category text,
  description text,
  clean_description text,
  apply_url text,
  url text NOT NULL,
  source text,
  external_id text,
  posted_at timestamptz,
  salary text,
  tags text[],
  company_logo text,
  is_remote boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  listing_type text,
  slug text,
  updated_at timestamptz NOT NULL DEFAULT now()
);`,
    "",
    "-- Data",
  ];

  for (const job of allJobs) {
    const vals = [
      `'${escapeSql(job.id)}'`,
      `'${escapeSql(job.title)}'`,
      `'${escapeSql(job.company)}'`,
      job.location ? `'${escapeSql(job.location)}'` : "NULL",
      job.job_type ? `'${escapeSql(job.job_type)}'` : "NULL",
      job.category ? `'${escapeSql(job.category)}'` : "NULL",
      job.description ? `'${escapeSql(job.description)}'` : "NULL",
      job.clean_description ? `'${escapeSql(job.clean_description)}'` : "NULL",
      job.apply_url ? `'${escapeSql(job.apply_url)}'` : "NULL",
      `'${escapeSql(job.url)}'`,
      job.source ? `'${escapeSql(job.source)}'` : "NULL",
      job.external_id ? `'${escapeSql(job.external_id)}'` : "NULL",
      job.posted_at ? `'${job.posted_at}'` : "NULL",
      job.salary ? `'${escapeSql(job.salary)}'` : "NULL",
      job.tags ? `ARRAY[${job.tags.map((t: string) => `'${escapeSql(t)}'`).join(",")}]` : "NULL",
      job.company_logo ? `'${escapeSql(job.company_logo)}'` : "NULL",
      job.is_remote ? "true" : "false",
      `'${job.created_at}'`,
      job.listing_type ? `'${escapeSql(job.listing_type)}'` : "NULL",
      job.slug ? `'${escapeSql(job.slug)}'` : "NULL",
      `'${job.updated_at}'`,
    ];
    sqlLines.push(
      `INSERT INTO public.jobs (id, title, company, location, job_type, category, description, clean_description, apply_url, url, source, external_id, posted_at, salary, tags, company_logo, is_remote, created_at, listing_type, slug, updated_at) VALUES (${vals.join(", ")}) ON CONFLICT (id) DO NOTHING;`
    );
  }

  const sql = sqlLines.join("\n");

  return new Response(sql, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/sql",
      "Content-Disposition": `attachment; filename="jobs_backup_${new Date().toISOString().slice(0, 10)}.sql"`,
    },
  });
});
