## Plan: Add Automatic Job Refresh Schedule

### Current state

- Jobs are only fetched when someone manually calls the `fetch-jobs` edge function
- Job content (title, description, company, etc.) is fully stored in the database — not referenced externally
- The only external link is the "apply" button pointing to the original source

### What will be done

1. **Enable `pg_cron` and `pg_net` extensions** to support scheduled function calls
2. **Create a cron job** that automatically calls the `fetch-jobs` edge function every 1 hour
  - This will pull the latest listings from Remotive, Arbeitnow, and YesHub.ng
  - New jobs get inserted; existing ones are skipped (deduplication via `source + external_id`)
  - Schedule: `0 */6 * * *` (every 1 hours at minute 0)

### Technical details

- Uses Postgres `cron.schedule()` + `net.http_post()` to invoke the edge function on a timer
- No code changes needed to the edge function itself — it already handles everything
- The cron job runs server-side, so the site stays updated even when no one is visiting