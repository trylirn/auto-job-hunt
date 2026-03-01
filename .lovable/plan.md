

## Plan: AI-Powered Location Detection + Filter Overhaul

### 1. Expand AI cleanup to extract location and work mode

**Edit: `supabase/functions/clean-job-descriptions/index.ts`**
- Update the AI prompt to also extract:
  - `detected_location` — the specific country/city/region mentioned in the description (e.g., "Kenya", "Lagos, Nigeria", "Washington DC, USA")
  - `work_mode` — one of "Remote", "Hybrid", or "Physical" based on what the description indicates
- Add these two fields to the `save_cleaned_job` tool schema
- After AI responds, update the `location` and `job_type` columns with the detected values
- Also select `location` and `job_type` in the query so AI has current context

### 2. Re-process existing jobs

Since ~259 jobs already have `clean_description` set, the AI cleanup won't re-process them. We need to:
- **Temporarily** null out `clean_description` for all jobs so they get re-processed with the new prompt, OR
- Add a separate query batch that targets jobs where `location IN ('Global', 'Nigeria')` (the generic defaults) to re-analyze them

The simpler approach: null out `clean_description` for all jobs so every listing gets the enhanced AI treatment. This is a one-time data update.

### 3. Update job type filter to Remote / Hybrid / Physical

**Edit: `src/components/JobFilters.tsx`**
- Replace the current job type select options (which pull messy DB values) with three hardcoded options: Remote, Hybrid, Physical
- Remove the Remote toggle button (it's now part of job type)
- Keep the location filter but populate it dynamically from `useFilterOptions` (since AI will now provide real locations)
- Keep date range filter as-is

**Edit: `src/hooks/useFilterOptions.ts`**
- Keep this hook but only for fetching distinct `location` values (now meaningful after AI enrichment)
- Remove `jobTypes` from it since those are hardcoded

### 4. Update query hook

**Edit: `src/hooks/useJobs.ts`**
- Remove `isRemote` parameter
- `jobType` filter now matches against `job_type` column with values "Remote", "Hybrid", or "Physical"
- `location` filter remains as ilike match

### 5. Update pages

**Edit: `src/pages/Index.tsx`**
- Remove `remoteOnly` state
- Remove `onRemoteToggle` prop
- Update `JobFilters` props accordingly

**Edit: `src/pages/Opportunities.tsx`**
- Add the same filter bar

### Files Changed
- `supabase/functions/clean-job-descriptions/index.ts` — add location + work_mode extraction
- `src/components/JobFilters.tsx` — new filter layout (Job Type: Remote/Hybrid/Physical, Location from DB, Date Posted)
- `src/hooks/useJobs.ts` — remove `isRemote`, update `jobType` matching
- `src/hooks/useFilterOptions.ts` — simplify to locations only
- `src/pages/Index.tsx` — remove remote state, update filter props
- `src/pages/Opportunities.tsx` — add filters

### One-time data operation
- Null out `clean_description` for all existing jobs so they get re-processed with the new AI prompt that extracts location and work mode

