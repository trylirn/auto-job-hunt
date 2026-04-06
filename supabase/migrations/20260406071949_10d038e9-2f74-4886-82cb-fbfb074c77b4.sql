ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS apply_before text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS skills text[];
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS employment_type text;