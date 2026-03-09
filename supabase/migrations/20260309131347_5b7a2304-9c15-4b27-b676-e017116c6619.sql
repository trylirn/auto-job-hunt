-- Add slug column
ALTER TABLE public.jobs ADD COLUMN slug text;

-- Backfill existing jobs with slugs from title + first 8 chars of UUID
UPDATE public.jobs
SET slug = trim(both '-' from regexp_replace(lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g')), '-+', '-', 'g')) || '-' || left(id::text, 8);

-- Unique index
CREATE UNIQUE INDEX jobs_slug_unique ON public.jobs(slug);

-- Trigger function to auto-generate slug on insert/update
CREATE OR REPLACE FUNCTION public.generate_job_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := trim(both '-' from regexp_replace(lower(regexp_replace(NEW.title, '[^a-zA-Z0-9]+', '-', 'g')), '-+', '-', 'g')) || '-' || left(NEW.id::text, 8);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER set_job_slug
  BEFORE INSERT OR UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_job_slug();