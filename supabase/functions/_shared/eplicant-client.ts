import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Optional mirror to a secondary Supabase project. If the host is unreachable
 * (deleted/paused project), the mirror disables itself for the rest of the run
 * and reports a single warning instead of one error per batch.
 */
let disabledReason: string | null = null;
let warned = false;

function markDisabled(reason: string) {
  disabledReason = reason;
  if (!warned) {
    warned = true;
    console.warn(`Eplicant mirror disabled for this run: ${reason}`);
  }
}

export function getEplicantClient() {
  if (disabledReason) return null;
  const url = Deno.env.get("EPLICANT_SUPABASE_URL");
  const key = Deno.env.get("EPLICANT_SUPABASE_KEY");
  if (!url || !key) {
    markDisabled("credentials not configured");
    return null;
  }
  return createClient(url, key);
}

function isUnreachable(message: string): boolean {
  return /dns error|failed to lookup address|Connect|error sending request|fetch failed/i
    .test(message);
}

export async function mirrorUpsert(
  tableName: string,
  data: Record<string, unknown>[],
  onConflict: string,
) {
  const client = getEplicantClient();
  if (!client) return;

  try {
    const { error } = await client
      .from(tableName)
      .upsert(data, { onConflict, ignoreDuplicates: false });
    if (error) {
      if (isUnreachable(error.message)) markDisabled(error.message.slice(0, 120));
      else console.error(`Eplicant mirror upsert error (${tableName}):`, error.message);
    }
  } catch (e) {
    const msg = String(e);
    if (isUnreachable(msg)) markDisabled(msg.slice(0, 120));
    else console.error(`Eplicant mirror exception (${tableName}):`, msg);
  }
}

export async function mirrorUpdate(
  tableName: string,
  id: string,
  data: Record<string, unknown>,
) {
  const client = getEplicantClient();
  if (!client) return;

  try {
    const { error } = await client.from(tableName).update(data).eq("id", id);
    if (error) {
      if (isUnreachable(error.message)) markDisabled(error.message.slice(0, 120));
      else console.error(`Eplicant mirror update error (${tableName}):`, error.message);
    }
  } catch (e) {
    const msg = String(e);
    if (isUnreachable(msg)) markDisabled(msg.slice(0, 120));
    else console.error(`Eplicant mirror update exception (${tableName}):`, msg);
  }
}
