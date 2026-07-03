
-- 1. Hide sensitive job columns from public/anon/authenticated readers.
REVOKE SELECT (submitter_email, payment_id, payment_status) ON public.jobs FROM anon;
REVOKE SELECT (submitter_email, payment_id, payment_status) ON public.jobs FROM authenticated;
REVOKE SELECT (submitter_email, payment_id, payment_status) ON public.jobs FROM PUBLIC;
GRANT SELECT (submitter_email, payment_id, payment_status) ON public.jobs TO service_role;
REVOKE INSERT (submitter_email, payment_id, payment_status) ON public.jobs FROM anon, authenticated;

-- 2. Lock down helper functions in public schema.
REVOKE EXECUTE ON FUNCTION public.notify_new_job_to_socials() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_job_slug() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.notify_new_job_to_socials() TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_job_slug() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;

-- 3. Storage: only the backend service role may list/upload/manage company-logo files.
--    Public reads through the public bucket CDN URL still work; this only affects the storage API.
DROP POLICY IF EXISTS "Public read company logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload company logos" ON storage.objects;

CREATE POLICY "Service role manages company logos"
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'company-logos')
  WITH CHECK (bucket_id = 'company-logos');

-- 4. Private secrets table used by SECURITY DEFINER triggers.
CREATE TABLE IF NOT EXISTS public.app_secrets (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.app_secrets TO service_role;
ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_secrets_service_role_only"
  ON public.app_secrets
  FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

INSERT INTO public.app_secrets (key, value)
VALUES ('social_webhook_token', '9a752f15253ed735eb09aeb0b04ab61a640f2a20f24f7bd21721eb17f5079eb9')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- 5. Trigger now reads the token from app_secrets (as SECURITY DEFINER,
--    running as owner it can read the table) and re-sends only the job id.
CREATE OR REPLACE FUNCTION public.notify_new_job_to_socials()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  webhook_token text;
BEGIN
  IF OLD.clean_description IS NOT NULL OR NEW.clean_description IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT value INTO webhook_token
  FROM public.app_secrets
  WHERE key = 'social_webhook_token';

  IF webhook_token IS NULL OR webhook_token = '' THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := 'https://wmfwpviizgvohgadumgp.supabase.co/functions/v1/post-to-socials',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', webhook_token
    ),
    body := jsonb_build_object(
      'record', jsonb_build_object('id', NEW.id)
    )
  );

  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.notify_new_job_to_socials() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.notify_new_job_to_socials() TO service_role;
