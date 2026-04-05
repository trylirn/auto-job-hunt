

## Root Cause

The `fetch-jobs` function runs hourly and uses `upsert` with `ignoreDuplicates: false` on the `jobs` table (conflict key: `source,external_id`). This means **every hour, it overwrites the `title` and `company` fields** with the raw, uncleaned data from the source websites (e.g., "Senior Data Analyst at UNICEF — Apply Now | YesHub").

The `fix-company-names` function then cleans them up via OpenAI, but the **next hourly fetch overwrites them again** with the dirty originals. This is why the cleanup appears temporary.

## Fix

**`supabase/functions/fetch-jobs/index.ts`** — Change the upsert strategy so it does NOT overwrite `title`, `company`, or `slug` for existing records. Two changes:

1. Before upserting, check if jobs already exist in the DB. For existing jobs, only update `description`, `posted_at`, and other non-title fields — skip `title`, `company`, and `slug`.

2. Simplest approach: switch to `ignoreDuplicates: true` so existing jobs are never overwritten at all. New jobs get inserted with raw titles, then the AI cleanup processes them. This is the cleanest fix since the source data for existing jobs doesn't meaningfully change.

**`supabase/functions/fetch-jobs/index.ts`** — Also trigger `fix-company-names` after job ingestion (alongside the existing `clean-job-descriptions` trigger), so new jobs get their titles/companies cleaned immediately.

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/fetch-jobs/index.ts` | Change `ignoreDuplicates: false` → `true`; add fire-and-forget call to `fix-company-names` after ingestion |

This ensures AI-cleaned titles and company names are permanent, and new jobs automatically get cleaned shortly after import.

