

## Plan: Fix Company Names, Enrich Share Content, Improve SEO Indexing

### Issue 1: Fix "Unknown" Company Names

The AI cleanup function (`clean-job-descriptions`) already extracts company names from titles/descriptions via OpenAI tool calling. The problem is that many existing jobs were imported with `company: "Unknown"` and the AI cleanup either didn't extract the company name or hasn't processed them yet.

**Fix**: Create a new edge function `fix-company-names` that:
- Queries jobs where `company = 'Unknown'` (or similar like "unknown", empty)
- Sends the title + description to OpenAI to extract the company name
- Updates the company field in both databases

Also update the `clean-job-descriptions` system prompt to be more aggressive about extracting company names from the title itself (e.g., "Alliance Francaise de Lagos is recruiting..." → company is "Alliance Francaise de Lagos").

**Files:**
- `supabase/functions/fix-company-names/index.ts` — New edge function
- `supabase/functions/clean-job-descriptions/index.ts` — Strengthen company extraction prompt

### Issue 2: Enrich "Copy Link" Share Content

Looking at the reference images (LinkedIn-style posts), the copied content should be formatted like:

```
{Company} is on the lookout for a {Title}. Apply now!

🔗Link: {jobUrl}
💰Salary: {salary}
📍Location: {location}
⏰Deadline: {deadline}

Summary of Key Responsibilities:
→ {responsibility1}
→ {responsibility2}
...

🧑‍💼Share this with your network or tag someone who might benefit.

Follow Eplicant for verified opportunities.
```

**Fix**: Update `buildShareText` in `ShareButtons.tsx` to produce a richer, LinkedIn-ready format with emoji-formatted details, a brief responsibilities excerpt extracted from the clean_description, and Eplicant branding.

Pass `cleanDescription` as a new prop to `ShareButtons` so it can extract key responsibilities.

**Files:**
- `src/components/ShareButtons.tsx` — Richer copy content
- `src/pages/JobDetail.tsx` — Pass `cleanDescription` prop

### Issue 3: Fix "Discovered - Currently Not Indexed"

The site is a client-side SPA. Google discovers URLs from the sitemap but can't render JavaScript content efficiently, leading to "Discovered - currently not indexed." Key fixes:

1. **Add `<meta name="fragment" content="!">` to `index.html`** — signals to crawlers that the page has dynamic content
2. **Improve `<noscript>` content** with actual links and structured content so crawlers see real text
3. **Add server-side rendering hints** — since Netlify already has the Prerender extension, ensure the config is correct
4. **Add a Netlify `_headers` or update `netlify.toml`** to set `X-Robots-Tag: all` to encourage indexing
5. **Ensure each page has unique, descriptive meta tags** (already done via Helmet)
6. **Add internal linking** — ensure the homepage has crawlable `<a href>` links to key pages (jobs, opportunities) so Google can discover them through HTML links, not just sitemap

The most impactful fix: configure Netlify's prerendering properly for bot user-agents by adding the `netlify-plugin-prerender` or using Netlify's built-in prerender support with proper `_redirects` for bot detection.

**Files:**
- `index.html` — Add fragment meta, improve noscript
- `netlify.toml` — Add bot prerender redirects and X-Robots-Tag header
- `src/pages/Index.tsx` — Ensure crawlable anchor links exist in noscript/footer area

### Summary

| File | Change |
|------|--------|
| `supabase/functions/fix-company-names/index.ts` | New — batch fix "Unknown" companies via OpenAI |
| `supabase/functions/clean-job-descriptions/index.ts` | Strengthen company name extraction in prompt |
| `src/components/ShareButtons.tsx` | Rich LinkedIn-style copy content |
| `src/pages/JobDetail.tsx` | Pass `cleanDescription` to ShareButtons |
| `index.html` | Add fragment meta, improve noscript content |
| `netlify.toml` | Add X-Robots-Tag, prerender config for bots |

