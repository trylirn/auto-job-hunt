import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey",
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

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim()
    .replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 200);

const PostBody = z
  .object({
    source_id: z.string().trim().min(1).max(255),
    title: z.string().trim().min(1).max(300),
    slug: z.string().trim().toLowerCase().max(200).optional(),
    content_html: z.string().max(500_000).optional(),
    content_markdown: z.string().max(200_000).optional(),
    excerpt: z.string().max(1000).optional(),
    seo_title: z.string().max(300).optional(),
    meta_description: z.string().max(500).optional(),
    cover_image_prompt: z.string().max(2000).optional(),
    author: z.string().max(120).optional(),
    category: z.string().max(100).optional(),
    published_at: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
    tags: z.array(z.string().max(60)).max(30).optional(),
    citations: z.array(z.any()).max(200).optional(),
  })
  .refine((p) => !!p.content_html || !!p.content_markdown, {
    message: "content_html or content_markdown is required",
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const expected = Deno.env.get("BLOG_PUBLISH_KEY") ?? "";
  const auth = req.headers.get("authorization") ?? "";
  const supplied = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!expected || !supplied || !safeEqual(supplied, expected)) {
    return json({ error: "Unauthorized" }, 401);
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  // Accept the post at the top level or nested under a common key.
  const top = (raw && typeof raw === "object" && !Array.isArray(raw)) ? raw as Record<string, unknown> : {};
  const candidate = (top.post ?? top.article ?? top.data ?? top) as unknown;
  const obj = (candidate && typeof candidate === "object" && !Array.isArray(candidate))
    ? candidate as Record<string, unknown> : {};

  const pick = (...keys: string[]): string | undefined => {
    for (const k of keys) {
      const v = obj[k];
      if (typeof v === "string" && v.trim() !== "") return v.trim();
    }
    return undefined;
  };
  let tags: unknown = obj.tags;
  if (typeof tags === "string") tags = tags.split(",").map((t: string) => t.trim()).filter(Boolean);

  const title = pick("title", "headline", "name");
  const normalized = {
    source_id: pick("source_id", "id", "external_id", "guid"),
    title,
    slug: pick("slug") ?? (title ? slugify(title) : undefined),
    content_html: pick("content_html", "html", "content"),
    content_markdown: pick("content_markdown", "markdown", "body", "text"),
    excerpt: pick("excerpt", "summary", "description"),
    seo_title: pick("seo_title", "meta_title"),
    meta_description: pick("meta_description"),
    cover_image_prompt: pick("cover_image_prompt", "image_prompt"),
    author: pick("author", "author_name", "byline"),
    category: pick("category"),
    published_at: pick("published_at", "date", "date_published"),
    tags: Array.isArray(tags) ? tags : undefined,
    citations: Array.isArray(obj.citations) ? obj.citations : undefined,
  };

  const parsed = PostBody.safeParse(normalized);
  if (!parsed.success) {
    return json({ error: "validation_failed", details: parsed.error.flatten() }, 400);
  }
  const p = parsed.data;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const row: Record<string, unknown> = {
    source_id: p.source_id,
    title: p.title,
    slug: p.slug,
    content_html: p.content_html ?? null,
    content_markdown: p.content_markdown ?? null,
    excerpt: p.excerpt ?? null,
    seo_title: p.seo_title ?? null,
    meta_description: p.meta_description ?? null,
    cover_image_prompt: p.cover_image_prompt ?? null,
    author: p.author ?? "Editorial Team",
    category: p.category ?? "Career Advice",
    tags: p.tags ?? [],
    citations: p.citations ?? [],
  };
  if (p.published_at) row.published_at = p.published_at;

  const { error } = await supabase.from("posts").upsert(row, { onConflict: "source_id" });
  if (error) {
    console.error("publish-post upsert failed", error);
    return json({ error: "database_error", details: error.message }, 500);
  }

  return json({ ok: true, url: `https://eplicant.com/blog/${p.slug}` });
});
