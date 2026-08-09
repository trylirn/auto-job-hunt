# Fix live count, apply links, stale jobs, and source attribution

## What's wrong (verified)

- **"0 live remote jobs"** — the counter asks the database for all columns (`select *`), which is blocked because sensitive columns (submitter email, payment fields) are revoked from public access. The request fails with a permission error, so the count falls back to 0. Confirmed with a live public API call returning `permission denied for table jobs`.
- **"Originally posted on Himalayas"** — this text is not in the site code; it is baked into the description HTML of all 320 Himalayas listings in the database.
- **Apply button** — most listings have no dedicated apply link stored (Himalayas, Greenhouse, Lever, Ashby, Breezy: all empty), and the button does not fall back to the stored source job URL. Those stored URLs are correct deep links to the exact job, so the button should use them.
- **Sources are working** — Greenhouse (1,102), Lever (857), Ashby (793), Breezy (78), Working Nomads, Remotive and others are all present. Himalayas just dominates the first pages because the board sorts by posting date and Himalayas posts most recently. Non-Himalayas sources have older posting dates.
- **4-year-old jobs** — 1,555 listings have a posting date older than 30 days (oldest: 2019). Cleanup currently deletes by *created* date (15 days), which never catches old jobs that were only recently imported.

## The fix

1. **Live count** — request only a public column for the count instead of all columns.
2. **Attribution** — strip "Originally posted on ..." (and similar source-credit trailers with their links) at render time, and run a one-off database cleanup on the 320 affected rows so the text is gone everywhere including search engines.
3. **Apply now** — fall back to the stored source job URL when no explicit apply link exists, so the button always lands on the exact job page. Keep the email-apply behaviour. Only show the "no link" note when both are missing.
4. **Stale listings** — delete every listing whose posting date is older than 30 days (one-off purge of ~1,555 rows), and add the same rule to the scheduled cleanup function so it runs daily.
5. **Fetcher guard** — skip incoming listings posted more than 30 days ago, so ATS boards (Greenhouse/Lever/Ashby) stop importing years-old openings. This also rebalances the board: fewer stale imports, more variety across sources on recent pages.

## Technical notes

- `src/hooks/useListingStats.ts`: `select("id", { count: "exact", head: true })`.
- `src/lib/sanitize.ts`: add a trailing-attribution stripper (regex on `Originally posted on …`, `Apply on <aggregator>`) applied before sanitising; also used by the card preview text in `src/components/ListingCard.tsx`.
- `src/pages/JobDetail.tsx`: `applyUrl = job.apply_url || extractApplyUrl(...) || job.url`.
- Data changes (via database tools): UPDATE to strip the attribution paragraph from `description`/`clean_description`; DELETE where `posted_at < now() - interval '30 days'`.
- `supabase/functions/cleanup-old-listings/index.ts`: add a third delete pass on `posted_at`, keeping the existing age and deadline passes and the IndexNow ping.
- `supabase/functions/fetch-jobs/index.ts`: reject rows with `posted_at` older than 30 days in the publishability gate.
