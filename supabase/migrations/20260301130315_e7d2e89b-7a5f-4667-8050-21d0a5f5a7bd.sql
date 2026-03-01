
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS clean_description text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS apply_url text;
