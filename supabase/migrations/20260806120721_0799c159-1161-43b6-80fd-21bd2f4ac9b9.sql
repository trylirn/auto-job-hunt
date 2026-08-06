REVOKE ALL ON public.jobs FROM anon, authenticated;

GRANT SELECT (
  id,title,company,location,job_type,category,description,url,source,external_id,
  posted_at,salary,tags,company_logo,is_remote,created_at,updated_at,clean_description,
  apply_url,listing_type,slug,apply_before,skills,employment_type,apply_before_date,
  archived_at,is_featured,featured_until
) ON public.jobs TO anon, authenticated;

GRANT INSERT (
  title,company,location,job_type,category,description,url,source,external_id,
  posted_at,salary,tags,company_logo,is_remote,clean_description,apply_url,
  listing_type,slug,apply_before,skills,employment_type,apply_before_date,
  is_featured,featured_until,submitter_email,payment_status
) ON public.jobs TO anon, authenticated;

GRANT ALL ON public.jobs TO service_role;

-- Explicitly deny client-side writes to the company-logos bucket; only
-- server-side (service_role) code may upload or modify logo objects.
DROP POLICY IF EXISTS "No public uploads to company logos" ON storage.objects;
CREATE POLICY "No public uploads to company logos"
ON storage.objects
AS RESTRICTIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id <> 'company-logos');

DROP POLICY IF EXISTS "No public updates to company logos" ON storage.objects;
CREATE POLICY "No public updates to company logos"
ON storage.objects
AS RESTRICTIVE
FOR UPDATE
TO anon, authenticated
USING (bucket_id <> 'company-logos');

DROP POLICY IF EXISTS "No public deletes of company logos" ON storage.objects;
CREATE POLICY "No public deletes of company logos"
ON storage.objects
AS RESTRICTIVE
FOR DELETE
TO anon, authenticated
USING (bucket_id <> 'company-logos');