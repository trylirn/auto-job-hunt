
-- Drop old trigger
DROP TRIGGER IF EXISTS trigger_notify_new_job_to_socials ON public.jobs;

-- Replace the function to hardcode the URL (vault not accessible from migrations)
CREATE OR REPLACE FUNCTION public.notify_new_job_to_socials()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only fire when clean_description transitions from NULL to non-NULL
  IF OLD.clean_description IS NOT NULL OR NEW.clean_description IS NULL THEN
    RETURN NEW;
  END IF;

  -- Call the edge function via pg_net (non-blocking) using hardcoded project URL
  PERFORM net.http_post(
    url := 'https://wmfwpviizgvohgadumgp.supabase.co/functions/v1/post-to-socials',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZndwdmlpemd2b2hnYWR1bWdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNTc2MjYsImV4cCI6MjA4NzkzMzYyNn0.J4y5DPvChJjXdvEF1U_JU0dehXGe7FSQ6go8qZDurgE'
    ),
    body := jsonb_build_object(
      'record', jsonb_build_object(
        'id', NEW.id,
        'title', NEW.title,
        'company', NEW.company,
        'location', NEW.location,
        'job_type', NEW.job_type,
        'listing_type', NEW.listing_type,
        'apply_url', NEW.apply_url
      )
    )
  );

  RETURN NEW;
END;
$function$;

-- Re-create the trigger
CREATE TRIGGER trigger_notify_new_job_to_socials
  AFTER UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_job_to_socials();
