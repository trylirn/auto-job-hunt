import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getEplicantClient } from "../_shared/eplicant-client.ts";
import { requireCronAuth } from "../_shared/require-cron.ts";

Deno.serve(async (req) => {
  const authFail = await requireCronAuth(req);
  if (authFail) return authFail;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Listings are hard-deleted after 15 days.
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 15);
  const cutoffISO = cutoff.toISOString();
  const todayISO = new Date().toISOString().slice(0, 10);

  console.log(`Deleting expired listings (cutoff ${cutoffISO}, today ${todayISO})`);

  // Three passes: (1) anything older than 15 days, (2) anything whose deadline
  // has already passed, (3) anything posted more than 30 days ago (stale ATS
  // imports). Separate calls because PostgREST's .or() on .delete()
  // chokes on ISO timestamps with colons.
  const staleCutoff = new Date();
  staleCutoff.setDate(staleCutoff.getDate() - 30);
  const staleISO = staleCutoff.toISOString();

  const [
    { data: byAge, error: ageErr },
    { data: byDeadline, error: dlErr },
    { data: byPosted, error: postedErr },
  ] = await Promise.all([
    supabase.from("jobs").delete().lt("created_at", cutoffISO).is("apply_before_date", null).select("id, slug"),
    supabase.from("jobs").delete().lt("apply_before_date", todayISO).select("id, slug"),
    supabase.from("jobs").delete().lt("posted_at", staleISO).is("apply_before_date", null).select("id, slug"),
  ]);
  const error = ageErr || dlErr || postedErr;


  if (error) {
    console.error("Primary delete error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const ageIds = (byAge ?? []).map((r: { id: string }) => r.id);
  const dlIds = (byDeadline ?? []).map((r: { id: string }) => r.id);
  const postedIds = (byPosted ?? []).map((r: { id: string }) => r.id);
  const deletedIds = Array.from(new Set([...ageIds, ...dlIds, ...postedIds]));
  const count = deletedIds.length;
  const slugById = new Map<string, string | null>();
  for (const r of [...(byAge ?? []), ...(byDeadline ?? []), ...(byPosted ?? [])] as {
    id: string;
    slug: string | null;
  }[]) {
    slugById.set(r.id, r.slug ?? null);
  }
  console.log(
    `Deleted ${count} old listings from primary DB (${ageIds.length} by age, ${dlIds.length} by deadline, ${postedIds.length} by posted date)`
  );


  // Mirror delete to Eplicant
  if (count > 0) {
    const eplicant = getEplicantClient();
    if (eplicant) {
      const { error: mirrorErr } = await eplicant
        .from("jobs")
        .delete()
        .in("id", deletedIds);
      if (mirrorErr) {
        console.error("Eplicant mirror delete error:", mirrorErr.message);
      } else {
        console.log(`Mirrored deletion of ${count} listings to Eplicant`);
      }
    }
  }

  // Ping IndexNow + Google so search engines drop the dead URLs quickly.
  if (deletedIds.length > 0) {
    try {
      const urlList = deletedIds.map((id) => `https://eplicant.com/job/${slugById.get(id) || id}`);
      // Best-effort; do not block on failures.
      await Promise.allSettled([
        fetch("https://api.indexnow.org/indexnow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            host: "eplicant.com",
            key: "8aac24519bd55434079e97180d8a080d",
            keyLocation:
              "https://eplicant.com/8aac24519bd55434079e97180d8a080d.txt",
            urlList,
          }),
        }),
        fetch(
          "https://www.google.com/ping?sitemap=" +
            encodeURIComponent("https://eplicant.com/sitemap.xml")
        ),
      ]);
      console.log(`Pinged IndexNow + Google for ${urlList.length} URLs`);
    } catch (e) {
      console.warn("IndexNow/Google ping failed:", e);
    }
  }

  return new Response(JSON.stringify({ deleted: count }), {
    headers: { "Content-Type": "application/json" },
  });
});
