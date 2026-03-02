

## Netlify Deployment: Steps, Prerendering & Optimization

### Part 1: Deployment Steps

Your project is already well-configured for Netlify (`_redirects`, `_headers` are in place). Here's the full process:

**Prerequisites:**
- A Netlify account (free tier works)
- Your project pushed to GitHub (Lovable can connect to GitHub via Settings > Connectors > GitHub)

**Steps:**
1. Go to [app.netlify.com](https://app.netlify.com) and click "Add new site" > "Import an existing project"
2. Connect your GitHub repo
3. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Node version:** Set environment variable `NODE_VERSION` to `18` (or `20`)
4. Add environment variables in Netlify dashboard (Site settings > Environment variables):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
   (Copy the values from your current `.env` file)
5. Click "Deploy site"

### Part 2: Enable Netlify Prerendering

Netlify has a built-in prerendering feature specifically for SPAs that serves pre-rendered HTML to bots/crawlers (Google, Twitter, Facebook, etc.) while serving the normal SPA to humans.

**How to enable:**
1. Go to your Netlify site dashboard
2. Navigate to **Site configuration > Build & deploy > Post processing > Prerendering**
3. Toggle **"Enable prerendering"** ON
4. Select **"Netlify" as the provider** (it's free and built-in)

That's it -- Netlify automatically detects bot user agents and serves a pre-rendered snapshot. No code changes needed.

### Part 3: Code Optimizations for Prerendering

To make prerendering work well, the site needs proper meta tags, structured data, and a complete sitemap. Here's the plan:

#### 3a. Update `robots.txt` with correct domain
The current `robots.txt` references `jobflow.app` but the site is "Eplicant". Update to the correct deployed domain.

#### 3b. Expand `sitemap.xml`
Currently only has `/`. Add `/opportunities` as a static entry. For dynamic job pages (`/job/:id`), we should create an edge function that generates the sitemap dynamically from the database.

#### 3c. Add a `netlify.toml` config file
Replace the `_redirects` and `_headers` files with a single `netlify.toml` for cleaner configuration, and include the prerendering directive.

#### 3d. Add structured data (JSON-LD) to job detail pages
Add `JobPosting` schema markup to `JobDetail.tsx` so that when Netlify's prerenderer serves the page to Google, it contains rich structured data. This significantly improves SEO for job boards.

#### 3e. Add `<noscript>` fallback
Add a minimal noscript tag in `index.html` so crawlers that don't execute JS still see something meaningful.

#### 3f. Ensure meta tags are complete on all pages
The pages already use `react-helmet-async` which is good. We'll verify all pages have complete OG tags (title, description, image, url) so social sharing previews work when prerendered.

### Files to Change
- `public/robots.txt` -- update domain reference
- `public/sitemap.xml` -- add `/opportunities` route
- `public/netlify.toml` -- new file, consolidates config + prerendering settings
- `public/_redirects` -- delete (moved to netlify.toml)
- `public/_headers` -- delete (moved to netlify.toml)
- `index.html` -- add noscript fallback
- `src/pages/JobDetail.tsx` -- add JSON-LD structured data for JobPosting schema
- `src/pages/Index.tsx` -- ensure complete OG meta tags
- `src/pages/Opportunities.tsx` -- ensure complete OG meta tags
- `supabase/functions/sitemap/index.ts` -- new edge function to generate dynamic sitemap with all job URLs

