## 1. Delete listings older than 1.5 months

The `cleanup-old-listings` edge function + daily 03:00 cron already exists, but its rule only deletes when *both* `apply_before_date IS NULL` AND `created_at < 45 days`. Listings with a stale `apply_before_date` in the past are deleted, but ~1,977 rows older than 45 days that still carry a future deadline survive forever.

Fix:
- Broaden the delete rule to: `created_at < now() - 45 days` **OR** `apply_before_date < today`. Age wins regardless of deadline — anything older than 45 days is gone.
- Run the same rule against the `newsletters` table for consistency (the column there is `expires_at`).
- Mirror-delete to the secondary Supabase instance (already wired) — keep that intact.
- Keep the 03:00 daily cron; no schedule change.

## 2. Re-brand "Global" as "USA / Global" for U.S. SEO

Currently 2,484 jobs are stored as `location = "Global"`. The user wants these surfaced as **U.S.A jobs first, Global alongside** to target U.S. search.

Approach (display-layer only, no data rewrite — keeps `fix-locations` AI logic intact):

- Add a small helper `formatLocation(loc)` that maps `"Global"` → `"USA / Global"` everywhere a job's location is rendered: JobCard, JobListItem, JobDetail (h1, meta, JSON-LD `jobLocation`), SimilarJobs, Location page chips, share text, newsletter email.
- Update the region filter so `region = "us"` matches `location ILIKE 'USA'` OR `'United States'` OR `'Global'` (Global rolls into U.S.). `region = "non-us"` excludes those three.
- Default sort on `/` and `/opportunities`: U.S. + Global first, then everything else by `created_at desc`. This pushes U.S./Global results above the fold for U.S. visitors.
- Update H1/meta on homepage to lead with "U.S. & Global International Development Jobs" (current copy is global-first).
- Stop `fix-locations` from re-classifying rows that are correctly `"Global"` — it currently treats "Global" as dirty and may hammer them. Tighten `looksDirty` so plain `"Global"` is left alone unless the description clearly names a country/city.

## 3. Replace `/jobs/in/:city` with data-driven country + city hubs

Today `/jobs/in/:city` is a hard-coded list of 8 cities in `src/data/locationHubs.ts`. But the DB stores mostly **countries** (Nigeria 868, USA 56, UK 43, Kenya 29, Germany 23, etc.) — almost no city-level data. The hard-coded city pages are mostly empty.

New structure:
- **`/jobs/in/:country`** (primary) — one page per country that has ≥1 live job. Built from a `country_hubs.ts` registry covering every country we actually see (USA, Nigeria, UK, Kenya, South Africa, Germany, Canada, India, Ghana, etc.) plus the regional groupings the AI emits ("Sub-Saharan Africa", "MENA", "Europe", "Latin America", "Asia-Pacific"…). Each entry has: slug, country/region name, blurb (AI-flavoured, 1–2 sentences), keyword set for JSON-LD.
- **`/jobs/in/cities/:city`** (secondary) — only renders for cities that *actually appear* in the DB. Because the DB is almost entirely country-level, we'll seed this list by scanning `jobs.location` for known city tokens (Nairobi, NYC, Geneva, London, etc.) and emit a hub **only if** the live query returns ≥1 job. Empty cities are silently dropped — both from routing and from the sitemap.
- A single `Location.tsx` component handles both, with a `mode: "country" | "city"` prop driving copy, breadcrumbs, and the DB filter (`ilike %country%` vs `ilike %city%`).
- Keep `/jobs/in/:city` working as a 301 redirect for the 8 legacy slugs (`new-york` → `/jobs/in/cities/new-york`, `washington-dc` → same, others map to their country page) so existing backlinks survive.
- A new index page `/jobs/in` lists every active country + city hub for crawl discovery, linked from the footer.

USA-first ordering: the country index puts United States at the top, then Global, then the rest A–Z. The home page already shows "Top hubs" — that list flips to country-first (United States, United Kingdom, Kenya, Nigeria, India, Germany…).

## 4. SEO: make sure the new hubs are indexed

- `supabase/functions/sitemap` (dynamic sitemap edge function): currently emits static pages + individual job URLs. Extend it to also emit `/jobs/in`, every `/jobs/in/:country`, and every `/jobs/in/cities/:city` that has ≥1 live job. Computed at request time from the same DB scan, so it stays in sync as data shifts.
- Drop the 8 hard-coded city URLs from `public/sitemap.xml` (the static one) — the dynamic sitemap is the source of truth. Keep only the truly static pages there as a fallback.
- Add proper `<link rel="canonical">`, OG, Twitter, `ItemList` + `BreadcrumbList` JSON-LD on every country & city page (Location.tsx already has the pattern; reuse it).
- Internal linking: footer gets a "Browse by country" expandable list (top 12 countries); job detail pages get a "More jobs in {country}" link pointing at the country hub.
- After deploy: bump `lastmod` on hub URLs daily via the dynamic sitemap (`new Date()` is fine), and ping Google via the existing GSC integration so the new URLs get discovered fast.

## Technical details

Files / functions touched:

- `supabase/functions/cleanup-old-listings/index.ts` — rewrite delete predicate (`created_at < cutoff OR apply_before_date < today`), add newsletter cleanup.
- `supabase/functions/fix-locations/index.ts` — tighten `looksDirty` so bare "Global" isn't reprocessed.
- `supabase/functions/sitemap/index.ts` — append country + city hub URLs from a live DB scan.
- `src/lib/locationLabel.ts` (new) — `formatLocation()`, `isUsRegion()` helpers.
- `src/data/countryHubs.ts` (new) — country/region registry (~40 entries).
- `src/data/cityHubs.ts` (new) — candidate cities, filtered live by `useJobs` count.
- `src/pages/Location.tsx` — generalize for country + city, dynamic blurb, breadcrumbs.
- `src/App.tsx` — new routes: `/jobs/in`, `/jobs/in/:country`, `/jobs/in/cities/:city`; legacy `/jobs/in/:city` becomes a redirect.
- `src/pages/JobsIndex.tsx` (new) — `/jobs/in` discovery page.
- `src/hooks/useJobs.ts` — region filter expands to include "Global" + "USA" + "United States" for `us`.
- `src/components/JobCard.tsx`, `JobListItem.tsx`, `SimilarJobs.tsx`, `src/pages/JobDetail.tsx`, `src/pages/Index.tsx`, `src/pages/Opportunities.tsx`, `src/components/Footer.tsx` — wire `formatLocation`, update copy, add country hub links.
- `public/sitemap.xml` — trim to truly static pages.

No DB migration is required; "Global" stays as the stored value. No new env vars or secrets.

## Verification

- `cleanup-old-listings`: invoke the function once after deploy; expect ~1,977 rows deleted. Re-query `count(*) where created_at < now() - interval '45 days'` → 0.
- Region filter: `/?region=us` returns jobs whose location is USA / United States / Global; `/?region=non-us` excludes them.
- Country hubs: visit `/jobs/in/nigeria` → 868 jobs, correct H1/meta/canonical. Visit `/jobs/in/cities/nairobi` → ~29 jobs.
- Sitemap: `curl https://eplicant.com/sitemap.xml` includes every active country + city hub; empty hubs absent.
- "Global" label: any job card whose stored location is `Global` reads `USA / Global` in the UI and in JSON-LD.

## Out of scope

- Re-tagging the 2,484 "Global" rows in the DB (display-layer fix is sufficient and reversible).
- Adding new ingestion sources for U.S. roles (covered in earlier turn; not part of this request).
- SSR / prerender changes — existing prerender already covers SPA routes.
