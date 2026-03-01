

## Plan: Add Global South Opportunities as a Second Data Source

### Confirmed

The site `www.globalsouthopportunities.com` uses WordPress with the REST API enabled. Categories available:
- Jobs (id: 20, 4081 posts)
- Fellowships (id: 25, 1696 posts)
- Scholarships (id: 18, 854 posts)
- Internships (id: 19, 763 posts)
- Funding (id: 26, 558 posts)
- Opinion Articles (id: 2) — will skip these
- GSO (id: 1) — general, will include

### What will be done

**1. Add `fetchGlobalSouthJobs()` function** (`supabase/functions/fetch-jobs/index.ts`)
- Mirror the existing `fetchYeshubJobs()` pattern: fetch categories, then fetch posts with `_embed`
- Fetch up to 100 posts (2 pages of 50) to get a good volume
- Map categories to the same normalized names used by the app (fellowships, scholarships, internships, grants/funding, jobs)
- Extract company names from title patterns, same as YesHub
- Set `source: "globalsouth"` and `location: "Global"` (since it's international)
- Skip "Opinion Articles" category posts

**2. Update the main handler** (`supabase/functions/fetch-jobs/index.ts`)
- Remove the delete of non-yeshub records (currently deletes everything except yeshub — this would wipe globalsouth data)
- Call both `fetchYeshubJobs()` and `fetchGlobalSouthJobs()`
- Upsert both sets of results (existing `source,external_id` conflict handling works fine)
- Return combined counts

**3. Update the OPPORTUNITY_CATEGORIES list** (`src/hooks/useJobs.ts`)
- Add "funding" to the list so Global South's Funding category shows under Opportunities

### Files to change
- `supabase/functions/fetch-jobs/index.ts` — add `fetchGlobalSouthJobs()`, update handler to fetch from both sources, remove blanket delete of non-yeshub records
- `src/hooks/useJobs.ts` — add "funding" to OPPORTUNITY_CATEGORIES

### No database changes needed
The existing `jobs` table schema handles everything. The `source,external_id` unique constraint ensures no duplicates across sources.

