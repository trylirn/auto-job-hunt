# Recover the ~300 missing company job boards

## What's happening now
- You added about 598 companies in total (Greenhouse 150, Lever 149, Ashby 149, Breezy 150).
- When I checked each one live, only 302 had a working public job board under the name we guessed (Greenhouse 122, Lever 32, Ashby 128, Breezy 20). The other ~296 returned "not found", so I removed them from the list. That is why only about 300 companies supply jobs.
- They are usually not dead. Most of them use a different board name (for example "acme-inc" instead of "acme"), use a different job system than the list says, or have no public job board at all.

## Fix
1. **Rebuild the full list of 598 companies** from your original spreadsheet, including the 296 that were removed.
2. **Find the real board for each missing company.** For each one, try:
   - common name variations (with and without hyphens, "inc", "hq", "jobs", "careers", or a shortened domain)
   - all four job systems, not only the one listed (many companies have moved to a different job system)
   - the company's own careers page, which often links straight to its board and shows the real name
3. **Keep only boards that work.** A board stays on the list if it responds and has at least one open job. Boards that respond but have no open jobs right now also stay, so they can start supplying jobs later.
4. **Report back** with the new total per job system and a short list of companies that still have no public board. Those companies can't be added through these four sources.
5. **Make sure the larger list fits the schedule.** If the list gets a lot bigger, add another rotating batch so every company is still checked about once an hour without running out of memory.
6. **Add a health check:** each run records which boards failed, so dead boards show up in the logs instead of quietly dropping out.

## Technical details
- A one-off resolver script runs from the sandbox and checks the public APIs: Greenhouse `boards-api.greenhouse.io/v1/boards/{slug}/jobs`, Lever `api.lever.co/v0/postings/{slug}`, Ashby `api.ashbyhq.com/posting-api/job-board/{slug}`, Breezy `{slug}.breezy.hr/json`.
- `supabase/functions/fetch-jobs/ats-companies.ts` is regenerated with the boards that were found. Each company goes under the job system where its board was actually found.
- The slice count in `fetch-jobs/index.ts` is changed only if needed. Redeploy, then do one live run to confirm how many jobs each source inserts.
