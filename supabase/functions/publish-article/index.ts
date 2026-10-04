import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-api-key, authorization, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

function safeEqual(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  if (ea.length !== eb.length) return false;
  let diff = 0;
  for (let i = 0; i < ea.length; i++) diff |= ea[i] ^ eb[i];
  return diff === 0;
}

const Body = z.object({
  article: z.object({
    title: z.string().trim().min(1).max(300),
    slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(200),
    content_markdown: z.string().min(1).max(200_000),
    excerpt: z.string().max(1000).optional(),
    seo_title: z.string().max(300).optional(),
    meta_description: z.string().max(500).optional(),
    cover_image_prompt: z.string().max(2000).optional(),
    cover_image_url: z.string().url().max(2000).optional(),
    category: z.string().max(100).optional(),
    author_name: z.string().max(120).optional(),
    tags: z.array(z.string().max(60)).max(30).optional(),
    citations: z.array(z.any()).max(200).optional(),
  }),
  site: z
    .object({
      default_author: z.string().max(120).optional(),
      default_category: z.string().max(100).optional(),
    })
    .optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const expected = Deno.env.get("PUBLISH_SECRET_KEY") ?? "";
  const supplied = req.headers.get("x-api-key") ?? "";
  if (!expected || !supplied || !safeEqual(supplied, expected)) {
    return json({ error: "Unauthorized" }, 401);
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
    // --- Normalize the incoming payload so different senders work ---
  const asObj = (v: unknown): Record<string, unknown> =>
    v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  const top = asObj(raw);
  console.log("publish-article received top-level keys:", Object.keys(top));

  let candidate: unknown = top.article ?? top.post ?? top.data ?? top.payload;
  if (typeof candidate === "string") {
    try { candidate = JSON.parse(candidate); } catch { /* ignore */ }
  }
  let art = asObj(candidate);
  if (Object.keys(art).length === 0) art = { ...top };

  const pick = (...keys: string[]): string | undefined => {
    for (const k of keys) {
      const v = art[k];
      if (typeof v === "string" && v.trim() !== "") return v;
    }
    return undefined;
  };
  const slugify = (s: string) =>
    s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim()
      .replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 200);

  const title = pick("title", "headline", "name");
  let tags: unknown = art.tags;
  if (typeof tags === "string") {
    tags = tags.split(",").map((t) => t.trim()).filter(Boolean);
  }

  const normalized = {
    article: {
      title,
      slug: pick("slug") ?? (title ? slugify(title) : undefined),
      content_markdown: pick("content_markdown", "content", "markdown", "body", "text"),
      excerpt: pick("excerpt", "summary", "description"),
      seo_title: pick("seo_title", "meta_title"),
      meta_description: pick("meta_description"),
      cover_image_prompt: pick("cover_image_prompt", "image_prompt"),
      cover_image_url: pick("cover_image_url", "cover_image", "image_url", "featured_image"),
      category: pick("category"),
      author_name: pick("author_name", "author"),
      tags: Array.isArray(tags) ? tags : undefined,
      citations: Array.isArray(art.citations) ? art.citations : undefined,
    },
    site: top.site,
  };

  const parsed = Body.safeParse(normalized);
  if (!parsed.success) {
    return json({ error: parsed.error.flatten(), received_keys: Object.keys(top) }, 400);
  }
  const { article: a, site } = parsed.data;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const row: Record<string, unknown> = {
    slug: a.slug,
    title: a.title,
    content_markdown: a.content_markdown,
    excerpt: a.excerpt ?? null,
    seo_title: a.seo_title ?? null,
    meta_description: a.meta_description ?? null,
    cover_image_prompt: a.cover_image_prompt ?? null,
    author_name: a.author_name || site?.default_author || "Editorial Team",
    category: a.category || site?.default_category || "Career Advice",
    tags: a.tags ?? [],
    citations: a.citations ?? [],
  };
  if (a.cover_image_url) row.cover_image_url = a.cover_image_url;

  const { error } = await supabase.from("articles").upsert(row, { onConflict: "slug" });
  if (error) {
    console.error("publish-article upsert failed", error);
    return json({ error: "database_error", details: error.message }, 500);
  }
  return json({ success: true, slug: a.slug });
});
