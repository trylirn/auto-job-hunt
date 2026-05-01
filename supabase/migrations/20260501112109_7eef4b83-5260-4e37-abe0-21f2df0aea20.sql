
-- 1. Extend jobs table
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS apply_before_date date,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_until timestamptz,
  ADD COLUMN IF NOT EXISTS submitter_email text,
  ADD COLUMN IF NOT EXISTS payment_status text,
  ADD COLUMN IF NOT EXISTS payment_id text;

CREATE INDEX IF NOT EXISTS jobs_apply_before_date_idx ON public.jobs (apply_before_date) WHERE apply_before_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS jobs_archived_at_idx ON public.jobs (archived_at) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS jobs_featured_idx ON public.jobs (is_featured, featured_until) WHERE is_featured = true;

-- 2. job_submissions staging table
CREATE TABLE IF NOT EXISTS public.job_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Listing fields
  listing_type text NOT NULL DEFAULT 'job',
  company text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  tags text[],
  location text NOT NULL,
  work_arrangement text, -- on-site / hybrid / remote
  salary_min numeric,
  salary_max numeric,
  salary_currency text,
  salary_period text,    -- year / month / hour
  company_logo text,
  apply_method text NOT NULL, -- 'url' or 'email'
  apply_url text,
  apply_email text,
  -- Submitter
  submitter_email text NOT NULL,
  -- Payment
  payment_status text NOT NULL DEFAULT 'pending', -- pending | paid | failed
  payment_id text,
  promoted_job_id uuid, -- set after promotion to public.jobs
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.job_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone may create a submission (paywalled by Stripe)
CREATE POLICY "Anyone can create a submission"
  ON public.job_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- No public read; only service role (which bypasses RLS) can read/update/delete.

CREATE TRIGGER trg_job_submissions_updated_at
BEFORE UPDATE ON public.job_submissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. company-logos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read company logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-logos');

CREATE POLICY "Anyone can upload company logos"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'company-logos');
