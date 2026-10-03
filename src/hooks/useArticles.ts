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
  seo_title: string | null;
  meta_description: string | null;
  cover_image_url: string | null;
  author_name: string | null;
  category: string | null;
  tags: string[] | null;
  citations: unknown;
  published_at: string | null;
}

const COLS =
  "id,slug,title,excerpt,content_markdown,seo_title,meta_description,cover_image_url,author_name,category,tags,citations,published_at";

export function readingTime(md: string): number {
  const words = md.replace(/[#>*_`[\]()!-]/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function useArticles() {
  return useQuery({
    queryKey: ["articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select(COLS)
        .order("published_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Article[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useArticle(slug: string) {
  return useQuery({
    queryKey: ["article", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select(COLS)
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as Article | null;
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
