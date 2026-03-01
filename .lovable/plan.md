## Plan: Remove Source References, Improve Job Detail Layout, Fix Apply Button

### What's wrong now

1. **Source references visible**: The "Source" filter dropdown exists, and `JobDetail.tsx` shows "via remotive/yeshub/arbeitnow" on job pages. The JobCard shows "YesHub.ng" as the company name (hardcoded in the fetch function).
2. **Job detail page layout**: Description is plain text dumped with `whitespace-pre-wrap` — no structure, hard to read.
3. **"View Original & Apply" button**: Links to job board source URLs (remotive.com, yeshub.ng, arbeitnow.com) instead of the original company's application page.

### What will be done

**1. Remove all source references from the UI**

- Remove the Source filter dropdown from `JobFilters.tsx` and all related state/props from `Index.tsx`
- Remove the "via {source}" line from `JobDetail.tsx`
- Remove `source` from `useFilterOptions` hook
- Remove `source` param from `useJobs` (keep in DB, just hide from users)

**2. Fix YesHub company names in the fetch function**

- The edge function hardcodes `company: "YesHub.ng"` for all YesHub posts — instead, extract the actual company name from the post title (e.g., "State Program Manager at PATH" → company = "PATH"). Fall back to extracting from content if not in title.

**3. Improve job detail page layout**

- Show description with proper formatting — render HTML content safely since the raw descriptions contain structure
- Better visual hierarchy: title, company, location/time/badges in a clear layout
- Show tags, salary, job type prominently
- Move description above the apply button so users read the full details first

**4. Fix the Apply button**

- Change text from "View Original & Apply" to "Apply"
- The `url` field currently points to the job board page (remotive.com/..., yeshub.ng/...). For Remotive and Arbeitnow, these URLs typically redirect to or contain the original application link — so they're not acceptable as-is. 
- For YesHub posts, the URL points to the blog post which contains application instructions (email addresses, links). Since we already show the full description on our site, the Apply button should scroll to the description section where those instructions are, rather than linking out to yeshub.ng.
- Logic: if `job.url` exists and source is not yeshub → open URL. If source is yeshub or no URL → scroll to description section on the page.

**5. Remove source from footer text**

- Change "Jobs aggregated from multiple sources across the web" to something neutral

### Files to change

- `supabase/functions/fetch-jobs/index.ts` — fix YesHub company name extraction
- `src/components/JobFilters.tsx` — remove Source dropdown
- `src/pages/Index.tsx` — remove source state and props
- `src/hooks/useFilterOptions.ts` — remove source fetching
- `src/hooks/useJobs.ts` — remove source param
- `src/pages/JobDetail.tsx` — remove "via source", improve layout, fix Apply button
- `src/components/JobCard.tsx` — no source references currently, but will verify