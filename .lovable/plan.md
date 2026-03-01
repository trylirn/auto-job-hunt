

## Plan: Fix Apply Button, Add AI Description Cleanup, Date Filter, Remove Category Filter, Mobile Optimization

### Current Issues

1. **Apply button broken** — The regex `/<a\s[^>]*href=["']([^"']+)["']/i` picks up the first `<a>` tag, but 34 out of 56 jobs have `chatgpt://generic-entity` garbage links from YesHub's content. These are not real URLs. The regex must skip those and only match `https://` links.

2. **No date filter** — Users want to filter by recency (e.g., last 7 days, last 30 days).

3. **Category filter still present** — Needs to be removed from `JobFilters.tsx` and `Index.tsx`.

4. **Mobile not optimized** — Filter dropdowns overflow on small screens; job cards and detail page need tighter spacing.

5. **AI description cleanup** — YesHub descriptions contain SEO spam, `chatgpt://` garbage links, and messy formatting. An edge function using Lovable AI can clean descriptions and extract the real application URL at fetch time, storing a cleaned version and a separate `apply_url` column.

### What will be done

**1. Create an AI-powered edge function to clean job descriptions** (`supabase/functions/clean-job-descriptions/index.ts`)
- Uses Lovable AI (gemini-2.5-flash-lite for cost efficiency) to:
  - Clean up the HTML description: remove SEO spam, `chatgpt://` links, YesHub branding references
  - Extract the actual application URL (Google Forms, email links, company career pages) if available
- Stores results in two new columns on the `jobs` table:
  - `clean_description` (text) — AI-cleaned HTML description
  - `apply_url` (text) — extracted application link or null
- Runs after `fetch-jobs` completes, processing only jobs where `clean_description` is null
- DB migration: add `clean_description` and `apply_url` columns

**2. Fix Apply button logic** (`src/pages/JobDetail.tsx`)
- Use `job.apply_url` first (set by AI)
- Fallback: regex extract first `https://` link from description (skip `chatgpt://` and `yeshub.ng` URLs)
- Final fallback: scroll to description section
- Show external link icon only when there's a real URL

**3. Remove category filter, add date filter** (`src/components/JobFilters.tsx`, `src/pages/Index.tsx`, `src/hooks/useJobs.ts`)
- Remove category dropdown and all related state/props
- Add a date filter dropdown: "Any time", "Past 24h", "Past week", "Past month"
- Apply date filter in `useJobs` using `posted_at.gte` with computed date

**4. Mobile optimization**
- `JobFilters.tsx`: stack filters vertically on mobile, full-width dropdowns
- `JobCard.tsx`: tighter padding on mobile
- `JobDetail.tsx`: smaller text/padding on mobile, ensure description container handles overflow
- `Index.tsx` / `Opportunities.tsx`: reduce hero padding on mobile

**5. Update fetch-jobs to call clean-job-descriptions** (`supabase/functions/fetch-jobs/index.ts`)
- After upserting jobs, invoke the `clean-job-descriptions` function to process new entries

### Files to change
- **New migration**: add `clean_description` and `apply_url` columns to `jobs` table
- **New file**: `supabase/functions/clean-job-descriptions/index.ts` — AI cleanup edge function
- `supabase/functions/fetch-jobs/index.ts` — trigger cleanup after fetch
- `src/components/JobFilters.tsx` — remove category, add date filter
- `src/pages/Index.tsx` — remove category state, add date state
- `src/pages/Opportunities.tsx` — add date filter
- `src/hooks/useJobs.ts` — add `dateRange` param, remove `category`
- `src/hooks/useFilterOptions.ts` — remove `categories` fetch
- `src/pages/JobDetail.tsx` — use `apply_url` column, better mobile layout, fix URL extraction fallback
- `src/components/JobCard.tsx` — use `clean_description` if available, mobile spacing
- `src/types/job.ts` — add `clean_description` and `apply_url` fields

### Technical detail: AI cleanup prompt

The edge function will process jobs in batches. For each job, it sends the raw HTML to Lovable AI with a prompt like:
- "Clean this job description HTML. Remove SEO spam, remove any references to YesHub or chatgpt:// links. Keep the essential job information: title, responsibilities, qualifications, location, salary, and application instructions. Extract the application URL if present (Google Forms, email addresses, company websites). Return JSON with `clean_description` (clean HTML) and `apply_url` (string or null)."
- Uses tool calling for structured output extraction

