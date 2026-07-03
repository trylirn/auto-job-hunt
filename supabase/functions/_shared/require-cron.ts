// Shared helper: require a valid CRON_TOKEN bearer for internal/cron-only
// edge functions. Returns a Response on failure, or null when authorized.
export function requireCronAuth(req: Request): Response | null {
  const expected = Deno.env.get("CRON_TOKEN");
  if (!expected) {
    // Fail closed if the secret isn't configured.
    return new Response(JSON.stringify({ error: "server_misconfigured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const auth = req.headers.get("authorization") ?? "";
  const bearer = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : "";
  const headerToken = req.headers.get("x-cron-token") ?? "";
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  // Accept either the shared cron token OR the service-role key
  // (so trusted backend-to-backend calls keep working).
  const ok =
    (bearer && (bearer === expected || (serviceRole && bearer === serviceRole))) ||
    headerToken === expected;

  if (!ok) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}
