CREATE TABLE public.newsletters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Newsletters are publicly readable" ON public.newsletters FOR SELECT TO public USING (true);