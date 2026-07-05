## Focus: ReliefWeb 410 + real SEO fixes

Not touching the source updater cron/auth work. Only editing the ReliefWeb call inside `fetch-jobs`, plus front-end SEO code paths.

---

### 1. ReliefWeb `410 Gone` — root cause and fix

ReliefWeb deprecated **GET query-string filtering** on `/v1/jobs`. The v1 API is still live, but complex filter payloads must be sent as **POST with a JSON body** (per `apidoc.reliefweb.int`). Our current GET with `filter[field]=…&filter[value]=…` in the querystring is what triggers 410.

Fix in `supabase/functions/fetch-jobs/index.ts` → `fetchReliefWebUSJobs()`:
- Switch to `POST https://api.reliefweb.int/v1/jobs?appname=eplicant.com`
- Send filters/sort/limit as JSON body:
  ```json
  {
    "profile": "full",
    "limit": 50,
    "sort": ["date.created:desc"],
    "filter": { "field": "country.name", "value": "United States of America" }
  }
  ```
- Keep the existing `410 → warn and return []` guard so a future deprecation never breaks the whole run.
- No auth/cron logic touched.

### 2. SEO — investigate and fix what's actually broken

Two ignored findings complain that sitemap/robots point at `eplicant.com` instead of `auto-job-hunt.lovable.app`. That's **intentional and correct** — `eplicant.com` is the canonical apex, the `.lovable.app` mirror is `noindex`, and Netlify 301s www→apex. I'll leave those ignored and note it clearly.

The two real Lighthouse failures need code changes:

**a. Performance / LCP** (`src/pages/Index.tsx`, `src/components/JobCard.tsx`, hero/logo images)
- Add `fetchpriority="high"` + explicit width/height and remove `loading="lazy"` on the above-the-fold hero/logo.
- Add `<link rel="preload" as="image" href="/logo.png" fetchpriority="high">` in `index.html`.
- Confirm `@font-face` for Space Grotesk / DM Sans uses `display=swap` (already in the Google Fonts URL — verify no other font blocks).

**b. Accessibility / contrast** (audit components using low-contrast utilities)
- Replace any `text-gray-300/400`, `text-muted-foreground/50`, or arbitrary greys on light backgrounds with `text-muted-foreground` / `text-foreground` tokens.
- Fix input `placeholder:` classes to use `placeholder:text-muted-foreground`.
- Target files to audit: `Header.tsx`, `Footer.tsx`, `JobCard.tsx`, `JobListItem.tsx`, `SearchBar.tsx`, `JobFilters.tsx`, `OpportunityFilters.tsx`, `Newsletter.tsx`, `Index.tsx`.

### 3. Google Search Console cross-check

Use the connected GSC API to pull the current index-coverage state for `https://eplicant.com/` and surface any additional URL-level issues (soft 404s, discovered-not-indexed, redirect errors) so we don't only rely on the Lovable scanner. Any concrete issues found there get folded into the same fix pass.

### 4. Deploy + verify

- Deploy only `fetch-jobs` (ReliefWeb change).
- Manually invoke `fetch-jobs` once, confirm `ReliefWeb=<n>` in the log line (n > 0).
- Mark the two Lighthouse findings fixed after the perf/contrast edits.
- Tell the user Lighthouse re-scores against the **published** build, so they need to publish for the score to update.

### Out of scope (per your instruction)
- Cron auth, `require-cron`, `x-cron-token`, source classifier, and any other updater logic — untouched.