

## Plan: Fix Edge Function Timeout + Add List View Toggle

### Issue 1: Edge Function Timeout

The `fetch-jobs` function fetches jobs from two external APIs, upserts them, then synchronously calls `clean-job-descriptions` (which makes up to 20 AI calls). This chain exceeds the edge function timeout limit.

**Fix in `supabase/functions/fetch-jobs/index.ts`:**
- Remove the synchronous `await` on the cleanup call — use a fire-and-forget pattern instead
- Wrap the cleanup fetch in a non-blocking call so `fetch-jobs` returns immediately after upserting jobs
- The cleanup function will still run, just independently

### Issue 2: Add List View Toggle

Add a grid/list view toggle so users can switch between card grid and a compact list layout.

**New file: `src/components/ViewToggle.tsx`**
- A small toggle component with Grid and List icons using `ToggleGroup` from the existing UI primitives
- Stores the current view mode (`grid` | `list`)

**New file: `src/components/JobListItem.tsx`**
- A compact horizontal card layout for list view — shows logo, title, company, location, badges, and time in a single row
- Reuses existing Badge component and icons

**Edit: `src/pages/Index.tsx`**
- Add `viewMode` state (`grid` | `list`)
- Render `ViewToggle` next to the job count
- Conditionally render grid of `JobCard` components or a stacked list of `JobListItem` components

**Edit: `src/pages/Opportunities.tsx`**
- Same view toggle addition as Index page

