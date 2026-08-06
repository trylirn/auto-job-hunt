# Remote-only Eplicant: cleanup, new type, more sources

## 1. Look and feel

- Header gets the same white/card background as the footer (no tinted bar), keeping the hairline rule and sticky behaviour.
- New typography: **Space Grotesk** for headings, **DM Sans** for body, replacing Instrument Serif / Work Sans everywhere (fonts loaded in `index.html`, tokens in `tailwind.config.ts`).
- Newsletter subscribe form moves to the top of the home page (directly under the hero/search area) so it is visible without scrolling; the footer keeps a small link-sized version.

## 2. Opportunities removed

- Delete the `/opportunities` page, its route, nav entries, filters component and every link to it (header, footer, sitemap, llms.txt, route registry).
- Stop classifying anything as an opportunity: the fetcher writes only jobs, and the reclassifier/newsletter opportunity sections are removed.
- Permanently delete the ~1,300 existing opportunity rows from the database.

## 3. Filters removed

- Since everything is remote-only, the toolbar drops region / work-mode / location / date filters and keeps only search (and the grid/list toggle + pagination).
- Location hub pages (`/jobs/in/...`) are kept only if they still hold remote roles; otherwise they will be pruned from the sitemap so no empty pages get indexed. (Confirm if you'd rather remove them entirely.)

## 4. Content updates

- FAQ on the home page rewritten around "remote-only jobs, verified employers, no aggregation talk".
- Terms and Privacy refreshed: remote-only scope, job submission rules, email-only applications, newsletter/email data handling, IP and takedown wording.

## 5. Sources

- **Remotive**: it does return data, but only 17 rows total and nothing new since 30 July — the remote filter and the 50-item limit are throttling it. Fix: raise the limit, paginate, and skip the redundant remote check (Remotive is already all-remote). Keep it if it produces volume after the fix, otherwise report back.
- **Add Working Nomads** and **Himalayas** public JSON feeds as new sources.
- **Add ATS board sources** for the four curated company lists (Greenhouse, Lever, Ashby, Breezy HR): each list becomes a static company array in the function; the fetcher hits the per-company public board endpoint, normalises the roles, and keeps only genuinely remote ones.
  - Greenhouse: `boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true`
  - Lever: `api.lever.co/v0/postings/{slug}?mode=json`
  - Ashby: `api.ashbyhq.com/posting-api/job-board/{slug}` (public posting API, no key)
  - Breezy: `{slug}.breezy.hr/json`
  - Slugs must be resolved per company; any company whose board 404s is logged and skipped so one bad slug never breaks a run. Expect a meaningful share of the 300 names to have no public board under a guessable slug — those get dropped with a log line.
- All new sources go through the existing remote-only filter, dedupe, and the AI description cleaner, so nothing about the current updater cadence changes.

## Technical notes

- `supabase/functions/fetch-jobs/index.ts`: new fetchers + company-slug tables, run in parallel batches with the existing `timedFetch` timeout so 300 board calls can't stall the cron run; `listing_type` hard-set to `job`.
- Migration: delete `listing_type = 'opportunity'` rows.
- Frontend: `src/lib/routes.ts`, `src/App.tsx`, `Header.tsx`, `Footer.tsx`, `ListingToolbar.tsx`, `ListingBrowser.tsx`, `Index.tsx`, `Terms.tsx`, `Privacy.tsx`, `index.html`, `tailwind.config.ts`, `src/index.css`; delete `Opportunities.tsx` and `OpportunityFilters.tsx`.
- `/opportunities` and `/opportunity/*` URLs will 301 to `/` (or 410 for dead detail pages) via the existing Netlify edge function, so removed pages don't become soft 404s.
