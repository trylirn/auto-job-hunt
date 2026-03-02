
-- Enable pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function that calls the post-to-socials edge function via pg_net
CREATE OR REPLACE FUNCTION public.notify_new_job_to_socials()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  supabase_url text;
  service_role_key text;
BEGIN
  -- Only fire when clean_description is set (transition from NULL to non-NULL)
  -- This means the job has been AI-processed and is ready to share
  IF OLD.clean_description IS NOT NULL OR NEW.clean_description IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get the Supabase URL and service role key from vault or env
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);

  -- If settings not available, try direct secrets
  IF supabase_url IS NULL OR service_role_key IS NULL THEN
    SELECT decrypted_secret INTO supabase_url FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1;
    SELECT decrypted_secret INTO service_role_key FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1;
  END IF;

  IF supabase_url IS NULL OR service_role_key IS NULL THEN
    RAISE LOG 'post-to-socials: Missing SUPABASE_URL or SERVICE_ROLE_KEY, skipping';
    RETURN NEW;
  END IF;

  -- Call the edge function via pg_net (non-blocking)
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/post-to-socials',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
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
$$;

-- Create trigger on jobs table for UPDATE (when clean_description gets set)
CREATE TRIGGER on_job_cleaned_post_to_socials
  AFTER UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_job_to_socials();
