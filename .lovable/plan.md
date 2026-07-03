## What I found

1. **Misclassified listings in the DB** (verified against current data):
   - 16 rows are `listing_type='opportunity'` but categorized `jobs`, plus 5 as `job`, 1 as `remote jobs`, 10 as `consultancy` — most of these are actually jobs.
   - Some `listing_type='job'` rows carry opportunity-flavored categories (`africa`, `continent`, etc.). The AI classifier is the source of truth but has drifted on ambiguous posts.

2. **Source-blog references leaking into descriptions** (screenshot):
   - "For more opportunities such as these please follow us on Facebook, Instagram, Twitter, LinkedIn and WPChannel"
   - "Disclaimer: Global South Opportunities (GSO) is not the organization offering this opportunity…"
   - "JOIN GSO WHATSAPP CHANNEL NOW"
   The AI prompt already forbids this, but older cleaned rows still contain it, and the model occasionally leaves it in.

3. **jobstoapply.com** is already wired up in `fetch-jobs` — the source is active. I'll confirm the schedule still hits it and surface it in the response summary.

4. **ReliefWeb** was previously removed. It has a free public API at `https://api.reliefweb.int/v1/jobs` — no key required, just an `appname` query param. I can filter to `United States of America` server-side.

## Changes

### A. Reclassify existing rows (SQL migration, one-off)
- `UPDATE jobs SET listing_type='job'` where current `listing_type='opportunity'` and `category` ∈ (`jobs`, `job`, `remote jobs`, `consultancy`, `consulting`).
- `UPDATE jobs SET listing_type='opportunity'` where `category` ∈ (`fellowship`, `scholarship`, `grant`, `conference`, `internship`, `internships`, `award`, `funding`, `training`, `course`, `short course`, `online course`, `phd`, `competition`, `learnership`) regardless of prior `listing_type`.
- Backfill `listing_type='job'` for rows still NULL with a jobs-like `job_type`.

### B. Harden `clean-job-descriptions` prompt + post-processor
- Tighten system prompt: list the exact aggregator names to strip (`Global South Opportunities`, `GSO`, `YesHub`, `Opportunities for Youth`, `YuthAxis`, `NGO Jobs in Africa`, `JobsToApply`, `Jobs To Apply`), including their "Disclaimer:", "For more opportunities…", "JOIN … WHATSAPP CHANNEL", "follow us on …" blocks. Never mention the source.
- Add a deterministic regex sanitizer (runs after the AI) that removes any surviving paragraphs/sentences containing those aggregator names, plus links to their domains, before writing `clean_description`.

### C. Re-clean affected rows
- Trigger `clean-job-descriptions?mode=all` in batches over rows where `clean_description` contains any of the aggregator names (via a small helper query) so old listings get scrubbed.

### D. Confirm `jobstoapply.com`
- Already integrated; no code change needed. I'll double-check it still fetches on the scheduled cron and note it in the summary.

### E. Re-add ReliefWeb (US only)
- New `fetchReliefWebUSJobs()` in `supabase/functions/fetch-jobs/index.ts`:
  - `GET https://api.reliefweb.int/v1/jobs?appname=eplicant.com&profile=full&limit=50&sort[]=date.created:desc&filter[field]=country.name&filter[value]=United%20States%20of%20America`
  - Normalize: title, source_org, city/country, career_categories → tags, body-html → description, url_alias → url, `source='reliefweb'`, `external_id=id`.
  - Wrap in `try/catch` so a ReliefWeb outage never breaks the whole run.
  - Add to the aggregated `allJobs` array and to the response summary.

### Technical details

- Migration file: `supabase/migrations/<ts>_reclassify_listings.sql` — pure `UPDATE` statements, no schema change.
- Edit `supabase/functions/clean-job-descriptions/index.ts`:
  - Expand `SYSTEM_PROMPT` with explicit aggregator names.
  - Add `stripSourceBlogNoise(html: string): string` — removes `<p>`/`<div>` blocks matching a compiled aggregator regex and any `<a>` whose href contains an aggregator domain.
  - Apply it to `clean_description` in `buildUpdateData`.
- Edit `supabase/functions/fetch-jobs/index.ts`: add ReliefWeb fetcher + call site + response payload.
- After deploy, POST once to `clean-job-descriptions?mode=all` with the cron token to rescrub.

### Out of scope
- No UI changes; filtering already respects `listing_type` correctly once the DB is fixed.
- No changes to `useJobs`, header, or footer.
