

## Plan: Restructure to YesHub-Only with Jobs/Opportunities Tabs

### Issues identified

1. **"YesHub.ng" still in data** — The edge function was updated but existing DB records still have `company: "YesHub.ng"`. Need to re-fetch AND clean existing data.
2. **Truncated YesHub content** — Edge function uses `p.excerpt?.rendered` (short summary) and slices to 2000 chars. Need to use full `p.content?.rendered` without truncation.
3. **Fellowships/scholarships mixed with jobs** — Categories like `fellowship`, `grants`, `scholarship`, `conference`, `internships` should be in a separate "Opportunities" tab.
4. **Remotive/Arbeitnow still in edge function** — Remove them, keep only YesHub.

### What will be done

**1. Edge function: YesHub only + full content**
- Remove `fetchRemotiveJobs()` and `fetchArbeitnowJobs()` functions entirely
- Use `p.content?.rendered` (full HTML) instead of excerpt, remove the 2000-char slice
- Improve company name extraction
- Delete existing non-yeshub records from DB via the function

**2. Add Opportunities tab to Header + routing**
- Update `Header.tsx` with two nav links: "Jobs" (`/`) and "Opportunities" (`/opportunities`)
- Create `src/pages/Opportunities.tsx` — same layout as Index but filters for non-job categories: fellowship, grants, scholarship, conference, internships
- Add route in `App.tsx`

**3. Filter jobs vs opportunities in queries**
- `useJobs` on the Jobs page: exclude opportunity categories (`fellowship`, `grants`, `scholarship`, `conference`, `internships`)
- `useJobs` on Opportunities page: include only those categories
- Add a `listingType` param to `useJobs` to handle this

**4. Clean up existing DB data**
- Edge function will delete all `source != 'yeshub'` records on next run
- Re-fetch YesHub with full content and proper company names

**5. Remove "YesHub" references from descriptions**
- The descriptions come from the WordPress API with HTML — no "YesHub" branding is injected by us, but titles like "First embrace jobs in Kano" have YesHub SEO text in the description body. We can't control that content, but we ensure no UI-level references exist.

### Files to change
- `supabase/functions/fetch-jobs/index.ts` — remove Remotive/Arbeitnow, use full content, clean old data
- `src/hooks/useJobs.ts` — add `listingType` filter (jobs vs opportunities)
- `src/components/Header.tsx` — add "Opportunities" nav link
- `src/App.tsx` — add `/opportunities` route
- `src/pages/Opportunities.tsx` — new page for fellowships/grants/scholarships
- `src/pages/Index.tsx` — pass `listingType: "jobs"` to exclude opportunities

