
REVOKE EXECUTE ON FUNCTION public.notify_new_job_to_socials() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_job_slug() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;
