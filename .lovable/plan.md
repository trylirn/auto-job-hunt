## SEO emergency fix plan

I investigated the Search Console traffic data and the current code path. The main problems to fix are technical crawl-quality issues, not just content quality:

1. **Stale job URLs are still too easy to discover/show**
   - Frontend queries currently exclude `archived_at`, but do not consistently exclude listings older than the active retention window when there is no future deadline.
   - This can leave expired/stale pages visible or internally linked, creating thousands of low-value/non-indexed URLs.

2. **Sitemap is incomplete and too broad**
   - Supabase/PostgREST defaults can cap results around 1,000 unless paginated.
   - The sitemap should only include current indexable pages: active jobs with future deadlines, or no-deadline jobs younger than 45 days.
   - It should be returned as XML with an explicit XML content type.

3. **Unknown SPA URLs likely return 200**
   - The SPA fallback can serve `index.html` for invalid URLs, which makes Google crawl lots of URLs that should be real 404s.
   - We should add a Netlify Edge guard so unknown routes return real `404` with `noindex`, while `/job/*` continues to be handled by the existing 410 logic.

4. **Cleanup lifecycle needs to preserve future deadlines**
   - Jobs older than 45 days should only be removed if they have no deadline.
   - Jobs with a future deadline must stay until the deadline passes.
   - Expired jobs with deadlines should be removed only after both the deadline has passed and the listing is older than 45 days.

5. **Opportunities should not emit JobPosting schema**
   - Opportunity/scholarship/fellowship pages are not always employment jobs and should avoid invalid `JobPosting` rich-result markup.

## Changes to implement once Build mode is enabled

### 1. Shared active-listing filter
Add `src/lib/activeListing.ts`:
- `ACTIVE_LISTING_DAYS = 45`
- helper to build the Supabase OR filter:
  - `apply_before_date >= today`, OR
  - `apply_before_date IS NULL AND created_at >= today - 45 days`

### 2. Frontend filtering
Update:
- `src/hooks/useJobs.ts`
- `src/hooks/useFilterOptions.ts`
- `src/hooks/useListingStats.ts`
- `src/pages/JobsIndex.tsx`

to apply the active-listing filter everywhere jobs/opportunities are listed, counted, or used for filter options.

### 3. Sitemap fix
Update `supabase/functions/sitemap/index.ts`:
- Fetch all eligible active jobs with range pagination instead of relying on `.limit(45000)`.
- Apply the same active-listing filter.
- Keep future-deadline jobs even if they are older than 45 days.
- Return `application/xml; charset=utf-8`.
- Include static legal pages.

### 4. Cleanup fix
Update `supabase/functions/cleanup-old-listings/index.ts`:
- Delete no-deadline listings older than 45 days.
- Delete deadline listings only if deadline has passed AND listing is older than 45 days.
- Do not delete jobs with future deadlines.

### 5. Unknown-route 404 guard
Add `netlify/edge-functions/seo-router.ts` and register it in `netlify.toml`:
- Redirect `www.eplicant.com` to `eplicant.com` at edge level.
- Return real `404` + `x-robots-tag: noindex, nofollow` for unknown routes instead of letting the SPA fallback return 200.
- Allow known routes, `/job/*`, `/jobs/in/*`, assets, sitemap, robots, etc.

### 6. Structured data cleanup
Update `src/pages/JobDetail.tsx`:
- Keep `JobPosting` JSON-LD for real jobs.
- Use non-job Article schema for opportunities so Search Console does not flag them as invalid job rich results.

## Expected impact

- Google will stop discovering thousands of stale/invalid URLs from the sitemap and internal links.
- Deleted/expired job URLs will produce stronger removal signals (410 for jobs, 404/noindex for bad routes).
- The sitemap will better match the actual indexable pages.
- Rich-result invalidity should reduce because non-employment opportunities will no longer be submitted as `JobPosting` pages.

After deploy, submit the sitemap again in Search Console and allow Google time to recrawl; the “non-indexed” count will not disappear instantly, but the crawl signals will be corrected.