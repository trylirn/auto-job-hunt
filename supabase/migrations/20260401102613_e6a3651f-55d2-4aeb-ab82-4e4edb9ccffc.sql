
CREATE POLICY "Service role can delete jobs"
ON public.jobs
FOR DELETE
TO service_role
USING (true);
