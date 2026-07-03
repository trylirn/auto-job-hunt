import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireCronAuth } from "../_shared/require-cron.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-token",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const authFail = requireCronAuth(req);
  if (authFail) return authFail;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const today = new Date().toISOString().slice(0, 10);

  // 1. Archive listings whose deadline has passed
  const { data: archived, error: archErr } = await supabase
    .from("jobs")
    .update({ archived_at: new Date().toISOString() })
    .lt("apply_before_date", today)
    .is("archived_at", null)
    .select("id");

  if (archErr) {
    console.error("archive error:", archErr.message);
    return new Response(JSON.stringify({ error: archErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 2. Clear is_featured when featured_until has passed
  const { data: unfeat, error: unfeatErr } = await supabase
    .from("jobs")
    .update({ is_featured: false })
    .lt("featured_until", new Date().toISOString())
    .eq("is_featured", true)
    .select("id");

  if (unfeatErr) console.error("unfeature error:", unfeatErr.message);

  return new Response(
    JSON.stringify({
      archived: archived?.length ?? 0,
      unfeatured: unfeat?.length ?? 0,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
