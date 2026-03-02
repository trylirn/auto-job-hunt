

## Plan: Add YuthAxis Source + Updated Netlify Prerender Guide

### Part 1: Add YuthAxis as a Job Source

YuthAxis (yuthaxis.com) is a WordPress site with a standard WP REST API. It has well-structured categories that map cleanly to our system:

- **Jobs** (id: 32, 766 posts)
- **Internships** (id: 31, 317 posts)
- **Fellowships** (id: 36, 115 posts)
- **Scholarships** (id: 33, 67 posts)
- **Grants** (id: 38, 18 posts)
- **Embassy Jobs** (id: 5527, 1 post)

**Edit: `supabase/functions/fetch-jobs/index.ts`**
- Add a new `fetchYuthAxisJobs()` function following the same WordPress pattern as the existing sources
- Fetch 2 pages of 50 posts via `https://yuthaxis.com/wp-json/wp/v2/posts?per_page=50&page={n}&_embed`
- Use source name `"yuthaxis"`
- Set location to `"Global"` (site covers international opportunities)
- Wire it into the main handler alongside the other sources

### Part 2: Updated Netlify Prerender Guide

The old prerendering approach (Site config > Post processing > toggle ON) is now **legacy**. Netlify has replaced it with a new **Prerender Extension**.

**Updated steps for your Netlify deployment:**

1. **If you already enabled the legacy prerendering**, disable it first: go to *Project Configuration > Build & Deploy > scroll to "Prerendering"* and turn it OFF.

2. **Install the new Prerender Extension**: visit [https://app.netlify.com/extensions/prerender](https://app.netlify.com/extensions/prerender) and install it for your Netlify account.

3. **Enable for your project**: in your Netlify project sidebar, find *"Netlify Prerender Extension (Early Access)"* at the bottom. Click it, check *"Enable prerendering"*, save changes, and **re-deploy**.

4. **Test it**: in Chrome DevTools, go to Network conditions and set a custom User-Agent string (e.g., `Googlebot`). Reload your deployed site and check for the `X-Prerendered` response header on the HTML document.

**Key differences from the old approach:**
- Full visibility via serverless function logs in your Netlify dashboard
- Configurable cache settings with the ability to purge cached pages
- Automatically handles all major crawlers, AI crawlers, and AI agents (ChatGPT, etc.)
- No code changes needed -- the extension handles everything at the edge

**Update: `.lovable/plan.md`**
- Replace the outdated Part 2 instructions with the new extension-based approach

### Files to Change
- `supabase/functions/fetch-jobs/index.ts` -- add `fetchYuthAxisJobs()` function and wire into main handler
- `.lovable/plan.md` -- update prerender instructions to reflect the new extension

