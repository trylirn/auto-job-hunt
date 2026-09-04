CREATE TABLE IF NOT EXISTS public.job_social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  platform text NOT NULL DEFAULT 'linkedin',
  external_post_id text,
  status text NOT NULL DEFAULT 'sent',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS job_social_posts_job_platform_idx
  ON public.job_social_posts (job_id, platform);

GRANT ALL ON public.job_social_posts TO service_role;

ALTER TABLE public.job_social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_social_posts_service_role_only"
  ON public.job_social_posts FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);