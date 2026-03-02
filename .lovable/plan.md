

## Plan: AI-Powered Content Classification + Work Mode Detection

### Problem
The `category` column has messy values from WordPress sources: "africa", "continent", "asia", "remote jobs", "short courses", "phd", "awards", etc. The current code uses a hardcoded list of opportunity categories to separate Jobs from Opportunities, but many listings (e.g., fellowships tagged "africa" or "continent") slip through and appear in the wrong tab.

### Solution
Have the AI classify each listing as either `"job"` or `"opportunity"` during the cleanup step, and store that in a new `listing_type` column. This replaces the unreliable category-based filtering.

### 1. Add `listing_type` column to jobs table

**Database migration:**
```sql
ALTER TABLE jobs ADD COLUMN listing_type text DEFAULT NULL;
```

### 2. Update AI cleanup to classify listing type

**Edit: `supabase/functions/clean-job-descriptions/index.ts`**
- Add `listing_type` to the AI prompt: classify as `"job"` (standard employment: full-time, part-time, contract, freelance) or `"opportunity"` (fellowships, scholarships, grants, conferences, training programs, awards, PhD positions, short courses)
- Add `listing_type` to the `save_cleaned_job` tool schema with enum `["job", "opportunity"]`
- Save the result to the new `listing_type` column

### 3. Update query hook to use `listing_type`

**Edit: `src/hooks/useJobs.ts`**
- Replace the `OPPORTUNITY_CATEGORIES` array and complex `.neq()` loop with a simple `.eq("listing_type", "job")` or `.eq("listing_type", "opportunity")`
- This is cleaner and relies on AI classification instead of brittle category matching

### 4. Update Job type

**Edit: `src/types/job.ts`**
- Add `listing_type: string | null` to the `Job` interface

### 5. Re-process all jobs

- Null out `clean_description` for all 265 jobs so they get re-processed with the updated prompt that now detects `listing_type`, `work_mode`, and `location` correctly
- Trigger the cleanup function multiple times (13 batches of 20)

### Files Changed
- `supabase/functions/clean-job-descriptions/index.ts` — add `listing_type` extraction
- `src/hooks/useJobs.ts` — replace category-based filtering with `listing_type` column
- `src/types/job.ts` — add `listing_type` field
- Database migration: add `listing_type` column

### One-time data operation
- `UPDATE jobs SET clean_description = NULL;` to re-process all listings

