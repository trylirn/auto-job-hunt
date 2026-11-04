import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireCronAuth } from "../_shared/require-cron.ts";
import { submitIndexNow, jobUrl } from "../_shared/indexnow.ts";
import { officeRequiredReason } from "../_shared/remote-check.ts";
import { mirrorUpdate } from "../_shared/eplicant-client.ts";

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

  // 1b. Remote-only board: archive live listings that actually need office
  // days (hybrid / on-site / "2 days a week in our office"). They slipped in
  // because their text also said "remote" somewhere.
  const nonRemote: { id: string; slug: string | null }[] = [];
  for (let from = 0; ; from += 500) {
    const { data: batch, error: scanErr } = await supabase
      .from("jobs")
      .select("id, slug, title, location, description, clean_description")
      .is("archived_at", null)
      .order("id", { ascending: true })
      .range(from, from + 499);
    if (scanErr) {
      console.error("non-remote scan error:", scanErr.message);
      break;
    }
    for (const j of batch ?? []) {
      const reason = officeRequiredReason(j);
      if (reason) {
        nonRemote.push({ id: j.id, slug: j.slug });
        // Shows up in the function logs so you can see exactly why a job was removed.
        console.log(`not remote: ${j.slug} — "${reason.slice(0, 120)}"`);
      }
    }
    if (!batch || batch.length < 500) break;
  }
  if (nonRemote.length) {
    const now = new Date().toISOString();
    const ids = nonRemote.map((j) => j.id);
    for (let i = 0; i < ids.length; i += 200) {
      const chunk = ids.slice(i, i + 200);
      const { error: nrErr } = await supabase.from("jobs").update({ archived_at: now }).in("id", chunk);
      if (nrErr) console.error("non-remote archive error:", nrErr.message);
    }
    for (const id of ids) mirrorUpdate("jobs", id, { archived_at: now }).catch(() => {});
    console.log(`Archived ${nonRemote.length} listings that require office attendance`);
  }

  // Archived URLs start returning 410 Gone right away (see
  // netlify/edge-functions/seo.ts), so tell Bing/IndexNow now. One POST per
  // batch. (The old google.com/ping sitemap endpoint was retired by Google in
  // 2023 and did nothing, so it's gone.)
  const goneUrls = [...(archived ?? []), ...nonRemote].map((j: { id: string; slug: string | null }) => jobUrl(j));
  if (goneUrls.length) await submitIndexNow(goneUrls);

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
      archived_not_remote: nonRemote.length,
      unfeatured: unfeat?.length ?? 0,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
