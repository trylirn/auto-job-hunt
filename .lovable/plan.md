## Add ReliefWeb (USA) jobs source

Add a new `fetchReliefWebUSJobs()` function in `supabase/functions/fetch-jobs/index.ts` that pulls US-only job listings from the free ReliefWeb public API and feeds them into the existing aggregation pipeline.

### What gets built

1. **New fetcher** in `supabase/functions/fetch-jobs/index.ts`:
   - `POST https://api.reliefweb.int/v1/jobs?appname=eplicant.com`
   - Body filters by `country.iso3 = "USA"`, requests fields: `title`, `body`, `date`, `source`, `country`, `city`, `type`, `career_categories`, `experience`, `theme`, `url_alias`, `how_to_apply`, `closing_date`
   - `limit: 100`, sorted by `date.created:desc`

2. **Normalization** to the existing `NormalizedJob` shape:
   - `title` ← `fields.title`
   - `company` ← `fields.source[0].name` (the posting organization)
   - `location` ← `"United States"` (city prepended if present, e.g. `"New York, United States"`)
   - `job_type` ← first `fields.type[].name` (e.g. Job, Consultancy)
   - `category` ← `"jobs"` (so it lands in the Jobs listing, not Opportunities)
   - `description` ← `fields.body` (HTML/markdown — existing AI cleanup handles it)
   - `url` ← `fields.url_alias`
   - `apply_url` ← extracted from `fields.how_to_apply` if a URL is present, else `url_alias` (existing `fix-company-names` / link extraction also runs)
   - `apply_before_date` ← `fields.closing_date` (date only)
   - `posted_at` ← `fields.date.created`
   - `tags` ← merge of `career_categories[].name` + `theme[].name`
   - `source: "reliefweb"`, `external_id: String(item.id)`, `listing_type: "job"`, `is_remote: false`

3. **Wire into the orchestrator** at the bottom of the same file:
   - Call `fetchReliefWebUSJobs()` alongside the other sources
   - Include its count in the log line and the JSON response's `fetched` object (`reliefweb: N`)
   - Append to `allJobs` so it flows through the existing upsert (dedup via `source,external_id`), Eplicant mirror, AI cleanup trigger, and title/company fix trigger

### What does NOT change

- No DB schema changes — uses existing `jobs` columns and unique constraint
- No frontend changes — the Region = "US" filter in `useJobs.ts` already matches `location ILIKE '%United States%'`
- No new secrets, no auth (ReliefWeb API is free and key-less)
- No changes to cron schedule — picked up on the next `fetch-jobs` run

### Files touched

- `supabase/functions/fetch-jobs/index.ts` (single file edit)
