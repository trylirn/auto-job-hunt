## Option A — apex (`eplicant.com`) as canonical

### What you do in dashboards (~5 min, can't be done from code)

1. **Netlify → Domain management → Production domains.** Set `eplicant.com` as **Primary domain**. `www.eplicant.com` becomes the redirect (currently it's the other way around). This single flip makes every existing canonical URL in our code correct.
2. **Search Console → Sitemaps.** Remove the two stale entries:
   - `https://www.eplicant.com/sitemap.xml` (last submitted 2023, 1 error)
   - `https://www.eplicant.com/sitemaps` (pending since 2023, error)
   Keep only `https://eplicant.com/sitemap.xml`. Resubmit it after step 1 propagates.
3. **Search Console → Pages → Why pages aren't indexed.** Once step 1 is live (verify with `curl -I https://www.eplicant.com/` returning a 301 to apex), click **Validate Fix** on:
   - "Page with redirect"
   - "Alternate page with proper canonical tag"
   - "Duplicate without user-selected canonical"

### What I do in code (small, defensive)

1. **Audit every canonical / og:url** to confirm they all use bare `https://eplicant.com` (no `www`). Files to check: `index.html`, `src/pages/{Index,JobDetail,Opportunities,Newsletter,About,Contact,Submit,Terms,Privacy,Location}.tsx`, sitemap edge function. Fix any stragglers.
2. **Sitemap `lastmod` hygiene.** Confirm the edge function emits `<lastmod>` for every job (helps Google reprioritize the freshly-canonical URLs).
3. **Drop the stray `<meta name="fragment" content="!" />`** in `index.html` — that's an obsolete AJAX-crawling hint that can confuse modern Googlebot.
4. **Add a runtime guard** in `index.html`: if the page loads on `www.eplicant.com` (until Netlify propagates, or if someone shares a www link), inject a canonical pointing to the apex equivalent. Already present pattern — extend the existing `noindex` script.
5. **Update `mem://tech/seo-hosting`** to lock in apex as canonical so future edits don't drift.

### What I deliberately won't touch
- Prerendering — Netlify Prerender is already serving 62 KB rendered HTML to Googlebot. Working.
- SSR migration — not needed.
- Content/thin-page rewrites — defer until next scan shows whether canonical fix alone clears the 3k backlog. Usually it does.

### Verification (after Netlify change + my code change deploy)

```bash
curl -I https://www.eplicant.com/         # expect 301 → https://eplicant.com/
curl -I https://eplicant.com/             # expect 200
curl -I https://eplicant.com/sitemap.xml  # expect 200 (no redirect)
```

Then in Search Console URL Inspection on 3 job URLs — both "User-declared canonical" and "Google-selected canonical" should read `https://eplicant.com/...`. Expect the indexed count in the sitemap report to climb from 0 over 2–3 weeks; traffic should recover as the backlog clears.

Approve and I'll execute the code-side work; you handle the Netlify + Search Console steps in parallel.