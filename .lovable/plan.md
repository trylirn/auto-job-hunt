

## Plan: Run AI Extraction, Fix Newsletter Links/Count/Schedule

### 1. Run fix-company-names on all jobs (newest first)

There are 589 jobs with Unknown/missing company names and potentially more with dirty titles. I will:

- Deploy the existing `fix-company-names` function (already uses OpenAI `gpt-4o-mini`)
- Call it repeatedly with `mode=all` in batches of 25, working from newest to oldest, covering as many as possible in this session
- This extracts clean titles AND company names from job descriptions using OpenAI

### 2. Fix newsletter links → eplicant.com

**`supabase/functions/generate-newsletter/index.ts`** — Two changes:
- Line 41: Change `https://auto-job-hunt.lovable.app/job/` → `https://eplicant.com/job/`
- Line 55: Change CTA URL from `https://auto-job-hunt.lovable.app` → `https://eplicant.com`

### 3. Increase newsletter job count to 20+

**`supabase/functions/generate-newsletter/index.ts`** — Line 30:
- Change `.limit(25)` → `.limit(30)` (fetch more to ensure at least 20 after filtering)
- Update the system prompt to mention including at least 20 listings

### 4. Change newsletter schedule to Monday 7 AM UTC

Update the `pg_cron` schedule for `generate-newsletter` from Saturday 8 AM to Monday 7 AM:
- Delete the existing cron job
- Insert new cron job: `'0 7 * * 1'` (Monday 7 AM UTC)

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/generate-newsletter/index.ts` | Fix eplicant.com links, increase limit to 30 |
| Database (SQL) | Update pg_cron schedule to Monday 7 AM |
| Runtime | Call fix-company-names in batches to process all jobs |

