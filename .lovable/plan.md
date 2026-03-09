

## Plan: Add NGO Jobs in Africa as a New Job Source

### What
Add `https://ngojobsinafrica.com/` as a 5th WordPress-based job source in the `fetch-jobs` edge function.

### Source Details
- WordPress REST API confirmed working at `/wp-json/wp/v2/posts`
- Categories: Scholarships (159, 1046 posts), News (7), Career Advice (6), Productivity (8), Skills (9), Uncategorized (1)
- Will exclude non-job categories: News (7), Career Advice (6), Productivity (8), Skills (9)

### Category Mapping
```text
159 → "scholarship"
1   → "opportunity"   (uncategorized fallback)
```

### Implementation

**File: `supabase/functions/fetch-jobs/index.ts`**

1. Add a new `fetchNgoJobsInAfricaJobs()` function following the same pattern as the other WordPress fetchers:
   - Fetch categories from `/wp-json/wp/v2/categories?per_page=100`
   - Fetch 2 pages of 50 posts with `_embed`
   - Filter out News (7), Career Advice (6), Productivity (8), Skills (9) categories
   - Map category 159 → "scholarship", fallback to "opportunity"
   - Set `location: "Africa"`, `source: "ngojobsinafrica"`

2. Add the call in the `Deno.serve` handler alongside the other sources:
   - Call `fetchNgoJobsInAfricaJobs()` in parallel with existing fetchers
   - Merge results into `allJobs`
   - Add count to the response JSON

### Files to Change

| File | Change |
|------|--------|
| `supabase/functions/fetch-jobs/index.ts` | Add `fetchNgoJobsInAfricaJobs()` function and integrate into the main handler |

