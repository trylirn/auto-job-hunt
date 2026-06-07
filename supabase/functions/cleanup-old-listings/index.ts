import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getEplicantClient } from "../_shared/eplicant-client.ts";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 1.5 months = ~45 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 45);
  const cutoffISO = cutoff.toISOString();
  const todayISO = new Date().toISOString().slice(0, 10);

  console.log(`Deleting expired listings (cutoff ${cutoffISO}, today ${todayISO})`);

  // Two passes: (1) anything older than 45 days, (2) anything whose deadline
  // has already passed. Separate calls because PostgREST's .or() on .delete()
  // chokes on ISO timestamps with colons.
  const [{ data: byAge, error: ageErr }, { data: byDeadline, error: dlErr }] =
    await Promise.all([
      supabase.from("jobs").delete().lt("created_at", cutoffISO).select("id"),
      supabase.from("jobs").delete().lt("apply_before_date", todayISO).select("id"),
    ]);
  const error = ageErr || dlErr;

  if (error) {
    console.error("Primary delete error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const ageIds = (byAge ?? []).map((r: { id: string }) => r.id);
  const dlIds = (byDeadline ?? []).map((r: { id: string }) => r.id);
  const deletedIds = Array.from(new Set([...ageIds, ...dlIds]));
  const count = deletedIds.length;
  console.log(
    `Deleted ${count} old listings from primary DB (${ageIds.length} by age, ${dlIds.length} by deadline)`
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

  return new Response(JSON.stringify({ deleted: count }), {
    headers: { "Content-Type": "application/json" },
  });
});
