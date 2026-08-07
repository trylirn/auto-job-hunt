# Remote-only cleanup: data purge, generalised copy, and fetch quality fixes

## 0. Why the site is showing errors right now

The hosted database is paused, which is why every listing request on the live preview fails ("Failed to fetch"). Nothing can be deleted or fetched until it is resumed. First step: resume the backend, then run the data purge.

## 1. Delete data older than 15 days

- Remove every listing (jobs and any leftover opportunity rows) created more than 15 days ago, plus anything whose application deadline has already passed.
- Mirror the same deletion to the secondary database so both stay in sync.
- Tighten the scheduled cleanup so it enforces 15 days going forward instead of 45.

## 2. Fully general remote job board (no sector language)

- Rewrite site copy so nothing claims an international development / UN / NGO focus: home page hero, FAQs, About, Terms, Privacy, footer blurb, page titles, meta descriptions and the structured-data/route metadata.
- The board is described as fully remote roles across all industries.

## 3. Location pages repurposed

- `/jobs/in` becomes "Remote jobs by country" — a directory of countries candidates can work from.
- Country hubs (`/jobs/in/:country`) become "Remote jobs hiring from {Country}": same URL, new heading, blurb, title and description framed around remote work eligibility rather than local offices.
- City hubs no longer make sense for remote work: `/jobs/in/cities/*` redirects to the matching country hub, or to `/jobs/in` when there isn't one. City links are removed from the directory and sitemap.
- Footer "By country" block keeps the same shape but with remote-friendly country labels; hub blurbs and keyword chips are rewritten.
- Hubs with zero live jobs stay hidden from the directory and sitemap so no empty pages get indexed.

## 4. UN careers guide removed

- Delete the guide page, its route, footer link, sitemap and llms.txt entries. `/guides/un-careers` redirects to the home page.

## 5. Empty job listings (no description)

Cause: several feeds return jobs with no usable body (Working Nomads and Himalayas can return empty description fields, and some ATS boards return content-free postings), and those rows are still inserted.

Fix: drop any listing whose description is shorter than a minimum length before insert, so no empty shells reach the board. The job detail page also gets a graceful fallback (short summary + prominent apply link) instead of a blank area.

## 6. Unreadable, run-together text in descriptions

Cause: Greenhouse (and some other ATS feeds) return descriptions as HTML-escaped strings (`&lt;p&gt;…&amp;nbsp;`). The current code strips tags with a regex before decoding entities, so the escaped markup survives as literal character noise and every paragraph break disappears.

Fix:
- Decode HTML entities first, then normalise the markup, keeping paragraph and list breaks as real line breaks instead of flattening everything into one string.
- Apply the same normaliser across all ATS and feed sources (Greenhouse, Lever, Ashby, Breezy, Working Nomads, Himalayas).
- Strip leftover encoded junk (`&nbsp;`, `&#39;`, zero-width and non-breaking characters) and collapse only real whitespace.
- Run a one-off repair pass over existing rows that already contain this mangled text.

## 7. Jobs with no apply link

Cause: some feeds provide relative or missing URLs (Working Nomads returns a path, Himalayas can omit the application link), and those rows still insert with an empty link, so the Apply button renders with nothing behind it.

Fix:
- Build absolute URLs per source and fall back to the source's own posting page.
- Skip any listing that still has no valid `http(s)` or `mailto:` target.
- On the detail page, hide the Apply button entirely rather than rendering a dead one.

## 8. "Post a remote job" form

- Store submitted descriptions as clean text with paragraph breaks preserved, and escape user input on the way in so pasted rich text can't produce the same character-noise problem.
- Validate that either an application URL or an application email is provided, and normalise the email into a proper `mailto:` link so the Apply button always works.
- Exclude submitted listings from the AI reformatting pass that mangles already-clean text.

## Technical notes

- Backend: resume Cloud, then a data operation deleting `jobs` rows older than 15 days plus expired deadlines, mirrored to the secondary instance; `cleanup-old-listings` cutoff changed 45 → 15 days.
- `supabase/functions/fetch-jobs/index.ts`: new shared `decodeEntities` + `htmlToText` helpers replacing `stripHtml`; per-source absolute-URL resolution; a final validity filter (description length, valid apply URL) before upsert.
- `supabase/functions/clean-job-descriptions/index.ts`: one-off repair mode for already-mangled rows; skip `source = 'submission'`.
- Frontend: `src/data/countryHubs.ts` (rewritten blurbs/keywords), `src/data/cityHubs.ts` (retired to redirect map), `src/pages/JobsIndex.tsx`, `src/pages/Location.tsx`, `src/App.tsx` (city + guide redirects), `src/components/Footer.tsx`, `src/pages/Index.tsx`, `About.tsx`, `Terms.tsx`, `Privacy.tsx`, `src/lib/routes.ts`, `src/lib/seo.ts`, `src/pages/Submit.tsx`, `src/pages/JobDetail.tsx`; delete `src/pages/UnCareersGuide.tsx`.
- `supabase/functions/sitemap/index.ts` and `public/llms.txt`: drop city hubs and the UN guide; keep only hubs with live jobs.
