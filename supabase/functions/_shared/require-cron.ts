import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Shared helper: require a valid private cron token for internal/cron-only
// edge functions. Returns a Response on failure, or null when authorized.
async function getStoredCronToken(): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) return "";

  try {
    const supabase = createClient(supabaseUrl, serviceRole);
    const { data } = await supabase
      .from("app_secrets")
      .select("value")
      .eq("key", "cron_token")
      .maybeSingle();
    return data?.value || "";
  } catch (error) {
    console.error("cron token lookup failed", error);
    return "";
  }
}

export async function requireCronAuth(req: Request): Promise<Response | null> {
  const expected = Deno.env.get("CRON_TOKEN") || Deno.env.get("CRON_SECRET") || "";

  const auth = req.headers.get("authorization") ?? "";
  const bearer = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : "";
  const headerToken = req.headers.get("x-cron-token") ?? "";
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  // Accept either the shared cron token OR the service-role key
  // (so trusted backend-to-backend calls keep working).
  const suppliedToken = headerToken || bearer;
  const storedCronToken = await getStoredCronToken();
  if (!expected && !storedCronToken) {
    // Fail closed if no private cron token is configured anywhere.
    return new Response(JSON.stringify({ error: "server_misconfigured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const ok =
    (expected && suppliedToken === expected) ||
    (storedCronToken && suppliedToken === storedCronToken) ||
    (bearer && serviceRole && bearer === serviceRole);

  if (!ok) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}
