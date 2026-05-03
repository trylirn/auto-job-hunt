## Changes

### 1. Remove Newsletter from Header
- `src/components/Header.tsx`: remove the `Newsletter` nav link (keep Jobs and Opportunities). The `/newsletter` page/route stays accessible via direct URL and footer link.

### 2. Smaller, separated newsletter in Footer
- `src/components/Footer.tsx`: 
  - Remove the inline newsletter form from the bottom copyright row.
  - Add it as its own dedicated 4th column (or full-width row above the copyright) with:
    - A small heading "Stay updated"
    - One-line muted subtext: "Join 10,000+ subscribers — weekly digest"
    - Compact email input + Join button at `text-[11px]` / `h-7`
  - Reduce overall text size of the newsletter block (smaller than current "Browse"/"Company" columns) and visually separate with its own border/spacing so it isn't bundled with the copyright line.

### 3. Fix the "Remote" quick-filter
Currently the hero "Remote" button sets `location = "Remote"`, and `useJobs` filters with `location.ilike '%Remote%'`. Most remote jobs have a country in `location` and `is_remote = true`, so they get excluded.

- `src/hooks/useJobs.ts`: when `location === "Remote"`, instead of `ilike` on location, filter by `is_remote.eq.true` OR `location.ilike.%remote%` / `job_type.eq.Remote`.
- `src/components/JobFilters.tsx`: keep the work-mode `Remote` option (already maps to `job_type` which works correctly). Hero button continues to use the location field but now triggers the new combined remote logic.

### 4. Better AI country/region extraction
Update `supabase/functions/fix-locations/index.ts` and the location/region extraction inside `supabase/functions/clean-job-descriptions/index.ts`:
- Instruct the model to:
  - If only a state/province/city is given (e.g. "Lagos", "California", "Bavaria"), infer the country.
  - If the role spans multiple countries in the same region, return the region name instead (e.g. "Sub-Saharan Africa", "Southeast Asia", "Latin America", "MENA", "East Africa", "West Africa", "Europe", "Caribbean").
  - Only return "Global" if truly worldwide.
  - Never return cities/states alone.
- Expand `looksDirty()` to also re-process locations that look like a US state, a city, or contain words like "Region"/"Province" without a country.
- Add an allow-list of accepted region phrases so output is consistent.

### 5. Safety
- No schema changes.
- All existing filter behavior, listing types, opportunities, deadlines, archiving, mirroring, and edge function schedules remain intact.

### Files touched
- `src/components/Header.tsx`
- `src/components/Footer.tsx`
- `src/hooks/useJobs.ts`
- `supabase/functions/fix-locations/index.ts`
- `supabase/functions/clean-job-descriptions/index.ts`
