import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Citation {
  title?: string;
  url?: string;
  source?: string;
  [k: string]: unknown;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content_markdown: string;
  content_html: string | null;
  seo_title: string | null;
  meta_description: string | null;
  cover_image_url: string | null;
  author_name: string | null;
  category: string | null;
  tags: string[] | null;
  citations: unknown;
  published_at: string | null;
}

// Blog posts live in the `posts` table (filled by the external publishing tool).
const COLS =
  "id,slug,title,excerpt,content_markdown,content_html,seo_title,meta_description,author,category,tags,citations,published_at";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toArticle = (p: any): Article => ({
  ...p,
  content_markdown: p.content_markdown ?? "",
  content_html: p.content_html ?? null,
  cover_image_url: null,
  author_name: p.author ?? null,
});

export function readingTime(md: string, html?: string | null): number {
  const src = md || (html ?? "").replace(/<[^>]*>/g, " ");
  const words = src.replace(/[#>*_`[\]()!-]/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function useArticles() {
  return useQuery({
    queryKey: ["articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(COLS)
        .order("published_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []).map(toArticle);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useArticle(slug: string) {
  return useQuery({
    queryKey: ["article", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(COLS)
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data ? toArticle(data) : null;
    },
    enabled: !!slug,
  });
}

export function normalizeCitations(raw: unknown): Citation[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c) => (typeof c === "string" ? { title: c, url: /^https?:\/\//.test(c) ? c : undefined } : c))
    .filter((c): c is Citation => !!c && typeof c === "object");
}
