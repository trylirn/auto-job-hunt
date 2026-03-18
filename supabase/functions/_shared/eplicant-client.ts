import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export function getEplicantClient() {
  const url = Deno.env.get("EPLICANT_SUPABASE_URL");
  const key = Deno.env.get("EPLICANT_SUPABASE_KEY");
  if (!url || !key) {
    console.warn("Eplicant credentials not configured, skipping mirror");
    return null;
  }
  return createClient(url, key);
}

export async function mirrorUpsert(
  tableName: string,
  data: Record<string, unknown>[],
  onConflict: string
) {
  const client = getEplicantClient();
  if (!client) return;

  try {
    const { error } = await client
      .from(tableName)
      .upsert(data, { onConflict, ignoreDuplicates: false });
    if (error) {
      console.error(`Eplicant mirror upsert error (${tableName}):`, error.message);
    } else {
      console.log(`Mirrored ${data.length} rows to Eplicant ${tableName}`);
    }
  } catch (e) {
    console.error(`Eplicant mirror exception (${tableName}):`, e);
  }
}

export async function mirrorUpdate(
  tableName: string,
  id: string,
  data: Record<string, unknown>
) {
  const client = getEplicantClient();
  if (!client) return;

  try {
    const { error } = await client
      .from(tableName)
      .update(data)
      .eq("id", id);
    if (error) {
      console.error(`Eplicant mirror update error (${tableName}):`, error.message);
    }
  } catch (e) {
    console.error(`Eplicant mirror update exception (${tableName}):`, e);
  }
}
