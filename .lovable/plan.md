## SEO emergency fix plan

The audit is done but nothing new has shipped yet — I'm in plan mode. Approve this and I'll implement in one pass.

### Root causes for the ~3k "Not indexed" pile + traffic drop

1. **410s aren't actually served.** The Netlify Edge Function returns 410 only when it can reach Supabase and confirm the job is gone. On any Supabase error/timeout it falls through to the SPA (200 OK). Google keeps seeing 200 + shell for deleted jobs → "Crawled – not indexed" / "Soft 404".
2. **Sitemap can list stale URLs.** `supabase/functions/sitemap` filters archived rows but doesn't hard-exclude past-deadline rows in all code paths, and there's no cache header, so Google can re-discover dead URLs.
3. **Mirror host leaks.** `auto-job-hunt.lovable.app` and `www.eplicant.com` occasionally get indexed as duplicates of apex; canonical + noindex logic is only client-side.
4. **JobDetail 404 path returns 200.** When a slug isn't found the React page renders "Not found" with status 200 instead of signalling gone.
5. **No IndexNow / no sitemap ping** after cleanup runs, so Google finds dead URLs on its own slow schedule.

### Changes

**A. Harden the 410 edge function** (`netlify/edge-functions/job-gone.ts`)
- On Supabase fetch error, treat as "unknown" and still 410 for `/job/*` slugs that look like our slug-uuid pattern rather than falling back to 200.
- Always send `X-Robots-Tag: noindex` on the 410 response.
- Also 410 when `apply_before_date < now()` (already partially done — make it unconditional).
- Match `/opportunity/*` too (same table, same problem).

**B. Sitemap tightening** (`supabase/functions/sitemap/index.ts`)
- Exclude rows where `apply_before_date < now()` OR `archived_at IS NOT NULL` OR `created_at < now() - 45 days` with no deadline.
- Add `Cache-Control: public, max-age=3600` and `X-Robots-Tag: noindex` on the sitemap response.
- Keep 45k cap and per-URL `lastmod`.

**C. Mirror-host safety** (`index.html` + edge)
- Add `<link rel="canonical">` server-side hint via edge function: for any request whose host is not `eplicant.com`, inject `X-Robots-Tag: noindex, nofollow`.
- Keep the existing client-side redirect from `www` → apex.

**D. JobDetail not-found signal** (`src/pages/JobDetail.tsx`)
- When the query resolves with no row, set a `<meta name="robots" content="noindex">` via Helmet and render a link that the edge function will subsequently 410 on refresh (already partly there — verify).

**E. Post-cleanup ping** (`supabase/functions/cleanup-old-listings/index.ts`)
- After deletions, POST the deleted URLs to IndexNow (`https://api.indexnow.org/indexnow`) using a project-owned key file at `public/<key>.txt`. This tells Bing immediately and Google indirectly.
- Also ping `https://www.google.com/ping?sitemap=https://eplicant.com/sitemap.xml`.

**F. Verification**
- After deploy, curl 5 known-deleted slugs → expect `HTTP/2 410`.
- curl `/sitemap.xml` → confirm no archived rows and cache header.
- Search Console → Validate Fix on "Crawled – currently not indexed" and "Soft 404" clusters.

### Not doing (out of scope for this turn)
- No new page templates, no content changes, no design changes.
- No ReliefWeb / new source work.
- No changes to filtering or pagination.

### Expected outcome
Within 1–3 crawl cycles: the 3k "Not indexed" bucket drains as Google converts them to "Not found (410)" and drops them, crawl budget refocuses on live jobs, and impressions/clicks on live listings recover.
