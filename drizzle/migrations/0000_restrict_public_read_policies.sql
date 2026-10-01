DROP POLICY IF EXISTS "Jobs are publicly readable" ON public.jobs;
CREATE POLICY "Live jobs are publicly readable" ON public.jobs FOR SELECT TO anon, authenticated USING (archived_at IS NULL);
DROP POLICY IF EXISTS "Newsletters are publicly readable" ON public.newsletters;
CREATE POLICY "Current newsletters are publicly readable" ON public.newsletters FOR SELECT TO anon, authenticated USING (expires_at >= now());