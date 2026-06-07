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
  // has already passed. Run separately because PostgREST's .or() filter on
  // .delete() chokes on ISO timestamps with colons.
  const [{ data: byAge, error: ageErr }, { data: byDeadline, error: dlErr }] =
    await Promise.all([
      supabase
        .from("jobs")
        .delete()
        .lt("created_at", cutoffISO)
        .select("id"),
      supabase
        .from("jobs")
        .delete()
        .lt("apply_before_date", todayISO)
        .select("id"),
    ]);
  const error = ageErr || dlErr;
  const deleted = [
    ...(byAge ?? []),
    ...(byDeadline ?? []).filter(
      (r) => !(byAge ?? []).some((a) => a.id === r.id)
    ),
  ];

  if (error) {
    console.error("Primary delete error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const count = deleted?.length ?? 0;
  console.log(`Deleted ${count} old listings from primary DB`);

  // Mirror delete to Eplicant
  if (count > 0) {
    const eplicant = getEplicantClient();
    if (eplicant) {
      const ids = deleted!.map((r: { id: string }) => r.id);
      const { error: mirrorErr } = await eplicant
        .from("jobs")
        .delete()
        .in("id", ids);
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
