## Goals

1. Stop Google Search Console from flagging deleted job URLs as 404/5xx indexing errors.
2. Fix the JobPosting rich-result error: `Missing field 'applicantLocationRequirements'` (required by Google whenever `jobLocationType: TELECOMMUTE` is used).

Neither change touches DB schema, business logic, or job data.

---

## Part A — SEO hardening for deleted/missing pages

The `/job/*` 410 Netlify edge function already exists and is correct. Remaining gaps:

1. **SPA NotFound** still returns HTTP 200 with no `noindex`. Any unknown URL Google crawls looks like a soft-200.
2. **JobDetail "Job not found" branch** also returns 200 with no `noindex` (defense-in-depth if the edge function ever fails open or runs on the `.lovable.app` mirror).
3. **Sitemap edge function** has no try/catch and no row cap — a single failed Supabase call surfaces as the "Server error (5xx)" reason in GSC. It can also list rows whose deadline already passed.
4. **`auto-job-hunt.lovable.app` mirror** doesn't run the Netlify 410 layer, so deleted jobs there are soft-200s that Google may index as duplicates.

### Fixes

- **`src/pages/NotFound.tsx`** — add `<Helmet>` with `<meta name="robots" content="noindex, nofollow">` and `<meta name="prerender-status-code" content="404">`.
- **`src/pages/JobDetail.tsx`** (not-found branch only) — same Helmet pattern with `prerender-status-code = 410`.
- **`supabase/functions/sitemap/index.ts`** — wrap in try/catch (return an empty valid `<urlset>` on error so we never emit 5xx); add `.limit(45000)`; also exclude rows where `apply_before_date < today`; always emit `<lastmod>`.
- **`netlify/edge-functions/job-gone.ts`** — also return 410 when the row exists but `apply_before_date` is in the past. Keep fail-open on Supabase errors.
- **`index.html`** — small inline script: if `location.hostname.endsWith('.lovable.app')`, inject `<meta name="robots" content="noindex">` so the duplicate mirror host is not indexed.

---

## Part B — Fix `applicantLocationRequirements` JSON-LD error

Google requires `applicantLocationRequirements` on every `JobPosting` that uses `jobLocationType: TELECOMMUTE`. Our current `buildJobPostingJsonLd` (in `src/pages/JobDetail.tsx`) sets `jobLocationType` for remote roles but never adds `applicantLocationRequirements`, which is exactly what GSC is flagging.

### Fixes (single file: `src/pages/JobDetail.tsx`)

1. **Map `job.location` → ISO country name** (small lookup table covering values our `fix-locations` function emits: countries + region names like "Sub-Saharan Africa", "Europe", "Global"). Region names map to a representative country list; "Global" maps to "Anywhere".

2. **When `job.is_remote` (or `jobLocationType` is set):**
   - Add `applicantLocationRequirements`:
     - If we resolved a single country → `{ "@type": "Country", "name": "<country>" }`
     - If region → array of `Country` entries
     - If unknown / "Global" → `{ "@type": "Country", "name": "Anywhere" }` (Google accepts this for fully open remote roles)
   - Keep existing `jobLocation` only when we actually have a physical address; for pure remote with no city, drop `jobLocation` (Google allows TELECOMMUTE-only postings).

3. **Add `validThrough`** (also recommended; reduces other GSC warnings) using `apply_before_date` when present, otherwise `posted_at + 30 days`.

4. **Add `hiringOrganization.sameAs`** = company website if we can derive it from `apply_url` host (best-effort, optional, no error if missing).

5. **Add `baseSalary`** only when `job.salary` is a clean numeric range we can parse — otherwise omit (don't emit invalid structured data).

6. **Add `identifier`**: `{ "@type": "PropertyValue", "name": "Eplicant", "value": job.id }`.

These additions are all schema.org-compliant and fix the current rich-result error without changing how the page renders.

---

## What we are NOT changing

- No DB schema, no RLS, no migrations.
- No change to job listing UI, filters, pagination, PostHog, or routing.
- No change to `/job/*` URL structure or canonical strategy.
- No change to the cleanup or fetch jobs functions.

## Files touched

- `src/pages/NotFound.tsx`
- `src/pages/JobDetail.tsx` (two areas: not-found branch + JSON-LD builder)
- `supabase/functions/sitemap/index.ts`
- `netlify/edge-functions/job-gone.ts`
- `index.html`

## Post-deploy (manual, no code)

In Search Console, open the **Pages** report and the **Job postings** rich-result report → click each affected row → **Validate Fix**. Google recrawls over 1–2 weeks and clears the warnings.
