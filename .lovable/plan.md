# Ads, faster sourcing, 300 more companies, and company logos

## 1. In-page push ad

Add the provided ad tag once, at the very end of `<body>` in `index.html`, so it loads after the app and never blocks rendering. The format is an overlay/in-page push served by the network itself, so it sits above content without changing layout — no reserved space, no shifted sections, and the job list, filters and Apply buttons stay untouched.

Note: this network is an ad tag we do not control; if it turns out to be intrusive on mobile, we can gate it to desktop only or to non-detail pages in a follow-up.

## 2. Source every 15 minutes

Currently jobs refresh once an hour. Changes:

- Reschedule the sourcing job to run every 15 minutes.
- Because we will be monitoring ~600 company boards, a single run cannot poll them all inside the function time limit. The fetcher will rotate through boards in 4 slices (one per quarter hour), so every board is still polled hourly but each run stays fast and no run times out.
- Keep concurrency bounded (as today) so we don't get rate-limited by Greenhouse/Lever/Ashby/Breezy.

## 3. Why mostly Greenhouse

Current live counts: Greenhouse 947, Lever 235, Ashby 228, Breezy 57. Greenhouse simply has the most companies on our list and the biggest boards; Lever/Ashby/Breezy are working but under-represented, and several Breezy/Lever slugs in the list are guesses that 404. As part of adding the new companies we will:

- Log per-board failures and drop slugs that consistently 404 after the first runs.
- Add the new companies weighted toward Lever, Ashby and Breezy so the mix evens out.

## 4. Add the 300 companies from the document

The document lists 75 additional companies for each of Greenhouse, Lever, Ashby and Breezy HR. All 300 will be appended to the existing curated lists in the sourcing config, with board slugs derived from each company name (lowercase, punctuation stripped) matching each ATS's slug convention. Duplicates against the current list are skipped.

Slugs are best-effort: a board that returns 404 is logged and skipped harmlessly, and after the first live runs I can report which of the 300 resolved and correct the misses.

## 5. Company logos

ATS APIs (Greenhouse, Lever, Ashby, Breezy) do not return a company logo, which is why every ATS-sourced job shows a blank logo today while the older feed-based jobs have one.

Fix: resolve logos from the company's own domain, taken from the job's apply/board URL where possible and otherwise from the company name. Two options:

- **Logo.dev (recommended)** — a logo lookup service built for exactly this; one connector, logos resolve automatically for any company we add later, with a graceful fallback.
- **No external service** — keep the current styled initials placeholder for ATS jobs.

Either way, cards and the job detail page will show a clean branded initials tile when no logo resolves, instead of an empty box.

## Technical notes

- `index.html`: ad script appended at end of `<body>`.
- `supabase/functions/fetch-jobs/ats-companies.ts`: +300 entries across the four ATS arrays.
- `supabase/functions/fetch-jobs/index.ts`: slice-rotation by quarter hour, per-board failure logging.
- Cron: `refresh-jobs-hourly` → every 15 minutes (recreated via a data statement, not a schema migration).
- Logos: component-level resolution with fallback; no schema change needed.
