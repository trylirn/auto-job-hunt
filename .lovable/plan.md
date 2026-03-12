## Plan: Add US Job Sources + Region Filter

### 1. New Job Sources (Edge Function)

Add two free, no-API-key sources to `fetch-jobs/index.ts`:

- **Remotive API** (`https://remotive.com/api/remote-jobs`) -- free, no key needed. Filter results where `candidate_required_location` contains "USA" or "United States" or "U.S.A". Set `location` to "United States".
- **Arbeitnow API** (`https://www.arbeitnow.com/api/job-board-api`) -- free, no key needed. Filter results where `location` contains "US" or "United States" or "U.S.A". Set `location` to "United States".
- [USAJobs.gov](http://USAJobs.gov) -- Pick U.S jobs here too.

Both sources will tag jobs with `location: "United States"` and `source: "remotive"` / `"arbeitnow"`.

### 2. Region Filter (Frontend)

Add a **"Region"** filter checkbox to both `JobFilters` and `OpportunityFilters` with options:

- **U.S. Jobs** -- filters where `location` contains "United States" or "USA" or "U.S.A"
- **Non-U.S. Jobs** -- filters where `location` does NOT contain "United States" or "USA" or "U.S.A"

This uses a new `region` parameter in `useJobs` that applies the appropriate `.ilike` / `.not.ilike` filter on the `location` column.

### 3. Query Hook Update

Add `region` param to `useJobs`:

- `"us"` → `query.or("location.ilike.%United States%,location.ilike.%USA%")`
- `"non-us"` → `query.not("location", "ilike", "%United States%").not("location", "ilike", "%USA%")`

### Files Changed


| File                                     | Change                                                                              |
| ---------------------------------------- | ----------------------------------------------------------------------------------- |
| `supabase/functions/fetch-jobs/index.ts` | Add `fetchRemotiveJobs()` and `fetchArbeitnowJobs()` functions, include in pipeline |
| `src/hooks/useJobs.ts`                   | Add `region` param and filtering logic                                              |
| `src/components/JobFilters.tsx`          | Add Region dropdown                                                                 |
| `src/components/OpportunityFilters.tsx`  | Add Region dropdown                                                                 |
| `src/pages/Index.tsx`                    | Wire up `region` state                                                              |
| `src/pages/Opportunities.tsx`            | Wire up `region` state                                                              |
