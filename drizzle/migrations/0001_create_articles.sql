CREATE TABLE public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  excerpt text,
  content_markdown text NOT NULL,
  seo_title text,
  meta_description text,
  cover_image_prompt text,
  cover_image_url text,
  author_name text DEFAULT 'Editorial Team',
  category text DEFAULT 'Career Advice',
  tags text[] DEFAULT '{}',
  citations jsonb DEFAULT '[]'::jsonb,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.articles TO anon, authenticated;
GRANT ALL ON public.articles TO service_role;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published articles are public" ON public.articles FOR SELECT TO anon, authenticated USING (published_at <= now());
CREATE INDEX articles_published_at_idx ON public.articles (published_at DESC);