
-- Create jobs table for aggregated job listings
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  job_type TEXT, -- full-time, part-time, contract, remote
  category TEXT,
  description TEXT,
  url TEXT NOT NULL,
  source TEXT, -- remotive, arbeitnow, firecrawl, etc.
  external_id TEXT, -- ID from the source to avoid duplicates
  posted_at TIMESTAMP WITH TIME ZONE,
  salary TEXT,
  tags TEXT[],
  company_logo TEXT,
  is_remote BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(source, external_id)
);

-- Enable RLS (public read, no public write)
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Jobs are publicly readable"
ON public.jobs
FOR SELECT
USING (true);

-- Create indexes for search/filter performance
CREATE INDEX idx_jobs_title ON public.jobs USING gin(to_tsvector('english', title));
CREATE INDEX idx_jobs_company ON public.jobs USING gin(to_tsvector('english', company));
CREATE INDEX idx_jobs_job_type ON public.jobs(job_type);
CREATE INDEX idx_jobs_category ON public.jobs(category);
CREATE INDEX idx_jobs_is_remote ON public.jobs(is_remote);
CREATE INDEX idx_jobs_posted_at ON public.jobs(posted_at DESC);
CREATE INDEX idx_jobs_tags ON public.jobs USING GIN(tags);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
