

## Plan: Remove Arbeitnow, AI Title/Company Fix, Weekly Newsletter Page

### 1. Remove Arbeitnow from job sources

**`supabase/functions/fetch-jobs/index.ts`:**
- Delete the `fetchArbeitnowUSJobs()` function (lines 252-287)
- Remove the arbeitnow call, logs, and references from the main handler (lines 458-460, 462, 503)
- Delete existing arbeitnow jobs from DB via SQL

### 2. AI-powered job title and company name extraction (OpenAI)

Create a new edge function `fix-job-titles` that:
- Queries jobs where titles look like raw WordPress blog titles (contain "Apply Now", source blog names, etc.)
- Sends title + description excerpt to OpenAI `gpt-4o-mini` with a prompt to extract the **clean job title** and **company name**
- Updates both `title` and `company` fields
- Runs via pg_cron every 30 minutes (batches of 10)

Also update the existing `fix-company-names` function prompt to additionally extract and fix the job title (combining both into one function instead of creating a new one — more efficient).

**Updated `supabase/functions/fix-company-names/index.ts`:**
- Rename conceptually to handle both title + company extraction
- Expand the OpenAI tool definition to include `clean_title` field
- Update the system prompt to instruct AI to also extract a clean, professional job title from the raw title (removing "Apply Now", source site names, excessive formatting)
- Update the query to also process jobs with titles containing patterns like "Apply Now", blog-style titles
- Update the DB write to set both `title` and `company`

### 3. Newsletter page with auto-generated weekly content (OpenAI)

**Database: New `newsletters` table** (via migration):
```sql
CREATE TABLE public.newsletters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Newsletters are publicly readable" ON public.newsletters FOR SELECT TO public USING (true);
```

**New edge function `generate-newsletter/index.ts`:**
- Queries the top/latest jobs from the past week (limit ~20)
- Sends them to OpenAI `gpt-4o-mini` to generate a formatted weekly newsletter HTML: "Jobs of the Week" with job titles, companies, locations, and links to `/job/{slug}`
- Inserts into `newsletters` table with `expires_at` = 7 days from now
- Deletes expired newsletters (`expires_at < now()`)
- Scheduled via pg_cron to run every Saturday at 8 AM UTC

**New frontend page `src/pages/Newsletter.tsx`:**
- Simple page with Header, fetches latest newsletter from `newsletters` table
- Renders the HTML content
- Shows "No newsletter available yet" if empty
- Matches existing site styling

**`src/App.tsx`:** Add `/newsletter` route

**`src/components/Header.tsx`:** Add "Newsletter" nav link

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/fetch-jobs/index.ts` | Remove arbeitnow function and references |
| `supabase/functions/fix-company-names/index.ts` | Add clean title extraction alongside company name |
| `supabase/functions/generate-newsletter/index.ts` | New — weekly newsletter generation via OpenAI |
| `src/pages/Newsletter.tsx` | New — newsletter display page |
| `src/App.tsx` | Add newsletter route |
| `src/components/Header.tsx` | Add Newsletter nav link |
| Database migration | Create `newsletters` table |
| Database (SQL insert) | Delete arbeitnow jobs; add pg_cron for newsletter generation (every Saturday 8 AM UTC) |

