

## Plan: Expand Job Filters

The current hardcoded filter lists don't match the actual data in the database. This plan replaces them with dynamic, data-driven filters and adds new ones.

### Problems with current filters
- The hardcoded category list (engineering, design, marketing...) doesn't match actual categories in the DB (ai / ml, software development, fellowship, grants, scholarship, etc.)
- Job types are also mismatched — DB has scholarship, fellowship, grants, conference, etc. that aren't in the dropdown
- No location or source filter exists

### What will be done

1. **Create a `useFilterOptions` hook** that fetches distinct values for location, job_type, category, and source from the database — so filters always reflect real data

2. **Add new filters to `JobFilters.tsx`**:
   - **Location** dropdown — populated dynamically from DB (Germany, Nigeria, USA, Munich, Berlin, etc.)
   - **Source** dropdown — filter by Remotive, Arbeitnow, or YesHub
   - Keep the **Remote** toggle button
   - Replace hardcoded job type and category lists with dynamic ones

3. **Update `useJobs` hook** to support `location` and `source` filter params

4. **Update `Index.tsx`** to wire up the new location and source state + pass to filters and query

### Technical details
- New hook queries: `SELECT DISTINCT location FROM jobs`, `SELECT DISTINCT source FROM jobs`, etc.
- Location filter will use `ilike` matching (since locations vary in format: "Berlin" vs "Berlin, Berlin, Germany")
- Source filter uses exact match via `.eq("source", value)`
- All filters reset page to 1 when changed

