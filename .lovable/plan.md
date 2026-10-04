# Finish the Career Advice blog, then the SEO pages

## 1. Make article publishing work (first)
- Turn on the publishing address so your external tool can send articles. The secret key is already saved, so you don't need to enter it again.
- Test it: no key or a wrong key is refused (401). The right key saves a test article (200, `{ success: true, slug }`). Sending the same slug again updates the article instead of making a copy.
- Open /blog and the test article in a browser: check the text, author, date, reading time, tags, sources and the "Browse remote jobs" banner. Then delete the test article.
- Fix any errors that come up.

## 2. Remote jobs by type pages (`/remote-jobs/{category}`)
- 10 pages, using the guide text that's already written: software engineering, design, product, data, marketing, sales, customer support, operations, finance, HR and recruiting.
- Each page has the guide, a pay table from live listings, the matching live jobs, breadcrumbs and links to related pages.

## 3. Guides (`/guides/{slug}`)
- 5 original guides, each about 600 to 900 words: finding a real remote job and spotting scams, interview tips, a CV for remote roles, a remote salary guide, and working across time zones.

## 4. SEO check on every page
- New and existing pages get a unique title and description, one main heading, clear link text and image alt text.
- Fix the Newsletter page, which still says "Monday" and "opportunities". Check Home, Tools, About, the location pages and Submit too.
- Add the new pages to the sitemap, the crawler previews and the footer, then mark the SEO findings as fixed.

## Technical details
- Deploy `publish-article` (config already has `verify_jwt = false`; `PUBLISH_SECRET_KEY` already exists). Test with curl_edge_functions, then delete the test row.
- New: `src/pages/RemoteCategory.tsx` (uses `ListingBrowser` with a keyword query plus a salaryBenchmarks table), `src/data/guides.ts` and `src/pages/Guide.tsx`. Add routes in `App.tsx` and entries in `routes.ts`, `public/sitemap.xml`, the `sitemap` function and `job-gone.ts` metadata, with matching netlify.toml edge paths.
- JSON-LD: BreadcrumbList and ItemList on category pages, Article on guides.
