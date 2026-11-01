import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Citation {
  title?: string;
  url?: string;
  source?: string;
  [k: string]: unknown;
}

export interface Post {
  id: string;
  source_id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content_html: string | null;
  content_markdown: string | null;
  seo_title: string | null;
  meta_description: string | null;
  cover_image_prompt: string | null;
  author: string | null;
  category: string | null;
  tags: string[] | null;
  citations: unknown;
  published_at: string | null;
}

const COLS =
  "id,source_id,slug,title,excerpt,content_html,content_markdown,seo_title,meta_description,cover_image_prompt,author,category,tags,citations,published_at";

export function readingTime(post: Pick<Post, "content_markdown" | "content_html">): number {
  const text =
    post.content_markdown?.replace(/[#>*_`[\]()!-]/g, " ") ??
    (post.content_html ?? "").replace(/<[^>]*>/g, " ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function usePosts() {
  return useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(COLS)
        .order("published_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Post[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePost(slug: string) {
  return useQuery({
    queryKey: ["post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(COLS)
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as Post | null;
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
