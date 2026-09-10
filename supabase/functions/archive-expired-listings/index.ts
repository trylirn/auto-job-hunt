import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireCronAuth } from "../_shared/require-cron.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-token",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const authFail = await requireCronAuth(req);
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
    .select("id, slug");

  if (archErr) {
    console.error("archive error:", archErr.message);
    return new Response(JSON.stringify({ error: archErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // These URLs start returning 410 Gone right away (see job-gone.ts), so tell
  // IndexNow + Google now instead of waiting for the later hard-delete pass
  // in cleanup-old-listings. One request per URL ("streaming"), same pattern
  // as cleanup-old-listings.
  if (archived && archived.length > 0) {
    try {
      const urlList = archived.map(
        (j: { id: string; slug: string | null }) => `https://eplicant.com/job/${j.slug || j.id}`
      );
      const indexNowKey = "8aac24519bd55434079e97180d8a080d";
      await Promise.allSettled([
        ...urlList.map((url) =>
          fetch(
            `https://api.indexnow.org/indexnow?url=${encodeURIComponent(url)}&key=${indexNowKey}`
          )
        ),
        fetch(
          "https://www.google.com/ping?sitemap=" +
            encodeURIComponent("https://eplicant.com/sitemap.xml")
        ),
      ]);
      console.log(`Pinged IndexNow (streaming) + Google for ${urlList.length} newly-archived URLs`);
    } catch (e) {
      console.warn("IndexNow/Google ping failed:", e);
    }
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
