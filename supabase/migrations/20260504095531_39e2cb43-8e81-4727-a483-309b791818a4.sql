-- Allow public users to submit jobs (free), but only with source='user_submission' and not featured
CREATE POLICY "Public can submit jobs"
ON public.jobs
FOR INSERT
TO anon, authenticated
WITH CHECK (
  source = 'user_submission'
  AND is_featured = false
  AND (featured_until IS NULL)
  AND (payment_status IS NULL OR payment_status = 'free')
);