// Shared helpers for the Netlify edge functions (seo.ts and sitemap.ts).
// Lives outside netlify/edge-functions/ so Netlify doesn't treat it as a function.

export const SUPABASE_URL = "https://wmfwpviizgvohgadumgp.supabase.co";
// Public anon key (the same one the React app ships). Read-only via RLS.
export const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZndwdmlpemd2b2hnYWR1bWdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNTc2MjYsImV4cCI6MjA4NzkzMzYyNn0.J4y5DPvChJjXdvEF1U_JU0dehXGe7FSQ6go8qZDurgE";

/** Same as HIDDEN_SOURCE_FILTER in src/hooks/useJobs.ts. */
export const HIDDEN_SOURCE_FILTER = "source.is.null,source.neq.himalayas";

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Filters every public job list uses (matches useJobs({ listingType: "jobs" })).
 * PostgREST ANDs repeated `or` params, exactly like supabase-js does.
 */
export function liveJobParams(opts: { excludeExpired?: boolean } = {}): [string, string][] {
  const p: [string, string][] = [
    ["archived_at", "is.null"],
    ["or", `(${HIDDEN_SOURCE_FILTER})`],
    ["or", "(listing_type.is.null,listing_type.neq.opportunity)"],
  ];
  if (opts.excludeExpired) {
    p.push(["or", `(apply_before_date.is.null,apply_before_date.gte.${today()})`]);
  }
  return p;
}

export interface RestResult<T> {
  rows: T[];
  count: number | null;
  ok: boolean;
}

/** Minimal PostgREST GET. `count: true` asks for an exact total. */
export async function rest<T>(
  table: string,
  params: [string, string][],
  opts: { count?: boolean } = {}
): Promise<RestResult<T>> {
  const qs = params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      ...(opts.count ? { Prefer: "count=exact" } : {}),
    },
  });
  if (!res.ok) {
    console.error(`supabase ${table} ${res.status}: ${await res.text()}`);
    return { rows: [], count: null, ok: false };
  }
  const rows = (await res.json()) as T[];
  let count: number | null = null;
  const range = res.headers.get("content-range"); // e.g. "0-23/1188"
  if (range && range.includes("/")) {
    const total = Number(range.split("/")[1]);
    if (Number.isFinite(total)) count = total;
  }
  return { rows, count, ok: true };
}

/* ------------------------------------------------------------- HTML utils */

export function esc(value: unknown): string {
  const v = value == null ? "" : String(value);
  return v.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;"
  );
}

/** JSON for inside <script type="application/ld+json"> (no "</script>" breakouts). */
export function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

const ALLOWED_TAGS = new Set([
  "p", "br", "ul", "ol", "li", "strong", "b", "em", "i", "u",
  "h2", "h3", "h4", "h5", "h6", "blockquote", "a", "hr", "code", "pre",
  "table", "thead", "tbody", "tr", "td", "th",
]);

/**
 * Allow-list sanitiser for job descriptions and blog HTML (no DOM in Deno).
 * Keeps basic formatting, strips every attribute except safe link hrefs.
 */
export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return "";
  let v = input.trim();
  // Double-escaped markup ("&lt;p&gt;") → real markup.
  if (/&lt;\/?[a-z]/i.test(v)) {
    v = v
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'").replace(/&amp;/g, "&");
  }
  // Plain text with blank lines → paragraphs.
  if (!/<\/?[a-z][^>]*>/i.test(v)) {
    return v
      .replace(/\r\n/g, "\n")
      .split(/\n{2,}/)
      .map((b) => b.trim())
      .filter(Boolean)
      .map((b) => `<p>${esc(b).replace(/\n/g, "<br>")}</p>`)
      .join("\n");
  }
  v = v
    .replace(/<(script|style|iframe|object|embed|form|noscript|svg|template|button|select|textarea)\b[\s\S]*?<\/\1>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");
  return v.replace(/<(\/?)([a-z][a-z0-9]*)\b([^>]*)>/gi, (_m, slash: string, rawTag: string, attrs: string) => {
    let tag = rawTag.toLowerCase();
    if (tag === "h1") tag = "h2"; // the page already has its own <h1>
    if (!ALLOWED_TAGS.has(tag)) return "";
    if (slash) return `</${tag}>`;
    if (tag === "a") {
      const href = /href\s*=\s*["']([^"']+)["']/i.exec(attrs)?.[1] ?? "";
      return /^(https?:|mailto:)/i.test(href)
        ? `<a href="${esc(href)}" rel="nofollow noopener">`
        : "<a>";
    }
    return `<${tag}>`;
  });
}

/** Very small markdown → HTML (headings, lists, paragraphs, links, bold). */
export function markdownToHtml(md: string | null | undefined): string {
  if (!md) return "";
  const inline = (s: string) =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" rel="noopener">$1</a>');
  return md
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => {
      const b = block.trim();
      if (!b) return "";
      const h = /^(#{1,6})\s+(.*)$/.exec(b);
      if (h) {
        const level = Math.min(6, Math.max(2, h[1].length));
        return `<h${level}>${inline(h[2])}</h${level}>`;
      }
      if (/^[-*]\s+/.test(b)) {
        const items = b.split(/\n/).map((l) => l.replace(/^[-*]\s+/, "").trim()).filter(Boolean);
        return `<ul>${items.map((i) => `<li>${inline(i)}</li>`).join("")}</ul>`;
      }
      if (/^\d+\.\s+/.test(b)) {
        const items = b.split(/\n/).map((l) => l.replace(/^\d+\.\s+/, "").trim()).filter(Boolean);
        return `<ol>${items.map((i) => `<li>${inline(i)}</li>`).join("")}</ol>`;
      }
      return `<p>${inline(b).replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n");
}
