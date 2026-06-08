## Changes

### 1. Remove ReliefWeb
In `supabase/functions/fetch-jobs/index.ts`:
- Delete `fetchReliefWebUSJobs()` and its call/log lines.
- Remove `reliefweb` from the `allJobs` array and the response payload.
- Delete the 0 existing `reliefweb` rows from the `jobs` table (none present, but run as safety cleanup).

### 2. Add jobstoapply.com
Add a new `fetchJobsToApplyJobs()` function mirroring the pattern used for YuthAxis/NGO Jobs in Africa (WordPress REST):
- Fetch `/wp-json/wp/v2/categories?per_page=100` to build the id→name map.
- Fetch 2 pages of `/wp-json/wp/v2/posts?per_page=50&page=N&_embed`.
- Map categories to our normalized types: Jobs → `jobs`, Fellowships → `fellowship`, Scholarships → `scholarship`, Internships → `internships`, Funding/Grants/Awards → `funding`, everything else → `opportunity`.
- `source: "jobstoapply"`, `location: "Global"` by default (AI `fix-locations` will refine), `external_id: post.id`.
- Wire it into the `allJobs` aggregation and the response stats.

After deployment, manually invoke `fetch-jobs` once to seed the new source and chain into AI cleanup + title/company fix automatically.

### 3. Refresh opportunities
Run `fetch-jobs` immediately after the deploy so the latest posts from globalsouth, opportunitiesforyouth, yuthaxis, yeshub, and the new jobstoapply are pulled. The cron already runs on schedule; this is just to surface the change now.

### 4. Remotive note (no change, surfacing for awareness)
Remotive is working but its public API has no real "opportunities" category and our US filter narrows it heavily — that's why only 17 rows. If you want more US/remote volume we should switch to a different source (e.g. Idealist, Devex public feeds) in a follow-up.

### 5. NGO Jobs in Africa (out of scope here)
Stale since May 1 — their WP endpoint may have moved or rate-limited us. Flagging only; can debug in a separate task if you want.

## Files touched
- `supabase/functions/fetch-jobs/index.ts` (only file)
- One-time DB delete: `DELETE FROM jobs WHERE source = 'reliefweb'`
- One-time function invocation to backfill jobstoapply

No schema changes, no new secrets, no frontend changes.