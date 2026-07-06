## Fix: SEO indexing collapse from client-only rendering

Root cause is confirmed: bots receive the same static `index.html` for every URL (job pages, hubs, legacy `/job/id/:id`), so Google buckets them as duplicates and dumps ~2,853 URLs into "Duplicate without user-selected canonical", plus 332 as "Page with redirect" from `<Navigate>` (JS-only) legacy redirects.

I will fix this at the Netlify edge — no changes to the source updater, no changes to job/opportunity import logic.

### 1. Rewrite `netlify/edge-functions/job-gone.ts`

Extend the existing edge function (already wired to `/job/*` in `netlify.toml`) to handle three cases in this order:

1. **Legacy `/job/id/:uuid`** → look up the row, if live respond with a real HTTP **301** to `/job/:slug`. If archived/expired/missing → 410 (as today).
2. **`/job/:slug` + bot request + live job** → respond with a fully-rendered HTML shell containing:
   - Real `<title>`, `<meta name="description">`, self-referential `<link rel="canonical">`, matching `og:title`/`og:url`/`og:description`/`og:image`, `twitter:card`.
   - Visible `<h1>`, company, location, posted date, deadline, and a plain-text snippet from `clean_description` (HTML-stripped, ~500 chars).
   - `application/ld+json` `JobPosting` — port the existing `buildJobPostingJsonLd()` from `src/pages/JobDetail.tsx` verbatim (region map, TELECOMMUTE handling, validThrough, identifier, directApply) so bots and users see the same schema.
   - A visible link back to the canonical URL so humans who somehow land here still get out.
3. **`/job/:slug` + bot request + archived/expired/missing** → 410 (as today).
4. **Any human request** → `context.next()` (unchanged; React app takes over).

Bot detection: `user-agent` contains any of `Googlebot`, `Bingbot`, `Slurp`, `DuckDuckBot`, `Baiduspider`, `YandexBot`, `facebookexternalhit`, `Twitterbot`, `LinkedInBot`, `AhrefsBot`, `SemrushBot`, `Applebot`, `PetalBot`, `GPTBot`, `ClaudeBot`, `PerplexityBot`. Case-insensitive.

Row fetch stays as it is today (Supabase REST with the anon key already embedded in the file), but the SELECT expands to include the fields the HTML/JSON-LD need: `id, slug, title, company, company_logo, location, is_remote, job_type, employment_type, salary, posted_at, apply_before_date, apply_url, clean_description, description, archived_at`.

Cache headers on the bot HTML: `Cache-Control: public, max-age=3600, s-maxage=86400`.

### 2. Not applicable / out of scope

- **`/jobs/in/*` country + city hubs** — same theoretical gap but only 64 URLs and not in the current GSC failure buckets. Skipping for now per your "focus" instruction; can be added in a follow-up.
- **The 712 "Not found"** — the screenshot you attached shows the existing 410 Gone page rendering correctly for an archived listing. That's the intended behavior for archived jobs; Google marks them "Not found (404)" but they were served as 410 Gone (which is what we want — it tells Google to drop them). No code change needed; the "Started" state in GSC means Google is already revalidating and these will drop out naturally.
- **Source updater, fetch-jobs, cron, classifier, RLS** — untouched.
- **`sitemap.xml`, `robots.txt`, `netlify.toml`** — untouched (already correct).

### 3. Verify

- `curl -A "Googlebot" https://eplicant.com/job/<a-live-slug>` → expect 200 with real `<title>` and JSON-LD in the response body.
- `curl -A "Mozilla/5.0" https://eplicant.com/job/<a-live-slug>` → expect the normal React shell (unchanged).
- `curl -I -A "Googlebot" https://eplicant.com/job/id/<a-live-uuid>` → expect `HTTP/1.1 301` with `Location: /job/<slug>`.
- `curl -I -A "Googlebot" https://eplicant.com/job/<an-archived-slug>` → expect `HTTP/1.1 410`.

### Files touched

- `netlify/edge-functions/job-gone.ts` (rewrite)

That's it — one file.
