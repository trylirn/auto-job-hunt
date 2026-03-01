

## Review: Hardcoded Issues & Netlify/SEO Fixes

### Hardcoded issues found

The codebase is mostly clean — filters are already dynamic. The remaining hardcoded items are:

1. **`index.html`** — Title says "Lovable App", description says "Lovable Generated Project", OG tags reference Lovable branding and generic OG image
2. **Footer in `Index.tsx`** — Minor, but the text "JobFlow — Jobs aggregated from multiple sources across the web." is fine as static branding
3. **No `_redirects` file for Netlify** — SPA client-side routing will break on direct URL access or page refresh (e.g. `/job/123` returns 404)
4. **No sitemap or structured SEO meta tags** — No dynamic `<title>` per page, no Open Graph tags for job detail pages

### What will be done

**1. Fix hardcoded metadata in `index.html`**
- Update title to "JobFlow — Find Your Next Opportunity"
- Update description, OG title, OG description, twitter tags to match the app
- Remove Lovable OG image placeholder (or replace with a generic one)

**2. Add `react-helmet-async` for dynamic per-page SEO**
- Add `<Helmet>` to `Index.tsx` with the main title/description
- Add `<Helmet>` to `JobDetail.tsx` with job-specific title, description, and OG tags (title, company, location) so shared links on LinkedIn/Google show meaningful previews

**3. Add Netlify SPA support**
- Create `public/_redirects` with `/* /index.html 200` so all routes resolve to the SPA
- Create `public/_headers` with cache headers and security headers (X-Frame-Options, etc.)

**4. Add `public/sitemap.xml`** (static)
- A basic sitemap pointing to `/` for Google indexing — dynamic job page sitemaps would require a serverless function, but the static one covers the main entry point

**5. Improve `robots.txt`**
- Add sitemap reference

### Technical details

- Will install `react-helmet-async` for managing `<head>` tags per route
- `_redirects` file is the standard Netlify approach for SPAs using client-side routing
- LinkedIn uses OG tags (`og:title`, `og:description`, `og:image`) from the HTML response — for an SPA, the `index.html` defaults matter most since there's no server-side rendering. The per-page Helmet tags help with Google (which renders JS) but won't help LinkedIn on deep links without SSR. The `index.html` defaults will be set to meaningful JobFlow branding so shared links look good everywhere.

