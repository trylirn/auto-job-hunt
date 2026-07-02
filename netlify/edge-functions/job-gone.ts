// Returns 410 Gone for /job/* URLs whose row is missing or archived.
// Runs at the edge before the SPA fallback so Google stops re-crawling dead URLs.

const SUPABASE_URL = "https://wmfwpviizgvohgadumgp.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZndwdmlpemd2b2hnYWR1bWdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNTc2MjYsImV4cCI6MjA4NzkzMzYyNn0.J4y5DPvChJjXdvEF1U_JU0dehXGe7FSQ6go8qZDurgE";

function goneHtml(path: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex">
<title>Listing no longer available — Eplicant</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#fafafa;color:#111;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px}
  .card{max-width:480px;text-align:center}
  h1{font-size:22px;margin:0 0 12px}
  p{color:#555;line-height:1.5;margin:0 0 20px}
  a{display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:500}
</style>
</head>
<body>
  <div class="card">
    <h1>This listing is no longer available</h1>
    <p>The role at <code>${path.replace(/[<>&"]/g, "")}</code> has been closed or removed. Browse current openings on Eplicant.</p>
    <a href="/">Back to all jobs</a>
  </div>
</body>
</html>`;
}

export default async (request: Request, context: { next: () => Promise<Response> }) => {
  try {
    const url = new URL(request.url);
    // Only intercept GET/HEAD page navigations
    if (request.method !== "GET" && request.method !== "HEAD") return context.next();

    const parts = url.pathname.split("/").filter(Boolean); // ["job", ...]
    if (parts[0] !== "job" || parts.length < 2) return context.next();

    const isIdRoute = parts[1] === "id";
    const key = isIdRoute ? parts[2] : parts[1];
    if (!key) return context.next();

    const column = isIdRoute ? "id" : "slug";
    const apiUrl = `${SUPABASE_URL}/rest/v1/jobs?${column}=eq.${encodeURIComponent(
      key
    )}&select=id,archived_at,apply_before_date&limit=1`;

    const res = await fetch(apiUrl, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    });

    // Slug-uuid pattern: <words>-<8hex> ; our generated job slugs always end this way.
    const slugLooksReal = /-[0-9a-f]{8}$/i.test(key);

    if (!res.ok) {
      // Fail-closed for well-formed slugs: better to 410 than to keep serving 200 shell.
      if (!isIdRoute && slugLooksReal) {
        return new Response(goneHtml(url.pathname), {
          status: 410,
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "public, max-age=300",
            "x-robots-tag": "noindex",
          },
        });
      }
      return context.next();
    }

    const rows = (await res.json()) as Array<{
      id: string;
      archived_at: string | null;
      apply_before_date: string | null;
    }>;
    const today = new Date().toISOString().slice(0, 10);
    const expired =
      rows?.length && rows[0].apply_before_date && rows[0].apply_before_date < today;
    const gone = !rows?.length || rows[0].archived_at !== null || expired;

    if (!gone) return context.next();

    return new Response(goneHtml(url.pathname), {
      status: 410,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=300",
        "x-robots-tag": "noindex",
      },
    });
  } catch (_e) {
    return context.next(); // fail open on any edge error
  }
};

export const config = { path: "/job/*" };
