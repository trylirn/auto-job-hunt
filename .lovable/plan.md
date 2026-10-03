# Career Advice blog + article publishing webhook

## What you'll get
- **Blog page (`/blog`)** lists career advice articles: interview tips, salary guides, remote-work advice. It has a search box, category filters and tag chips. Each card shows the cover image, title, excerpt, category, date and reading time.
- **Article page (`/blog/{slug}`)** shows the full article, author, date, reading time, tags and a numbered sources list. A banner sends readers to "Browse remote jobs", with links to related articles below.
- **"Career Advice" link in the header** on both desktop and mobile, plus a footer link.
- **Publishing address for your external tool**: `https://eplicant.com/api/public/webhooks/publish-article`. Your tool sends the article as JSON, as in your brief, with an `x-api-key` header. A wrong or missing key returns 401 Unauthorized. Sending the same slug again updates that article instead of creating a duplicate. A successful call returns `{ "success": true, "slug": "..." }`.
- **Secret key**: I'll ask you to enter a `PUBLISH_SECRET_KEY` value in a secure form. Create a strong random value and use the same one in your external tool.

## Search engine readiness
- Each article gets its own title, description and canonical address (from `seo_title` and `meta_description` when you send them). It also gets Article and breadcrumb structured data and social sharing tags.
- Articles go into the sitemap automatically. Crawlers that don't run JavaScript will get proper article titles and descriptions.
- Article text is cleaned before display so it can't carry harmful code.

## Cover images
If `cover_image_url` is sent, the article uses it. If only `cover_image_prompt` is sent, it's stored, and the article shows a tidy branded placeholder until an image URL is added. Images aren't generated automatically.

## Technical details
- Migration: `public.articles` with the columns in your brief and `slug` unique. `GRANT SELECT` to anon and authenticated, `GRANT ALL` to service_role, RLS on, a public SELECT policy (`published_at <= now()`), and no insert or update policies. Plus an index on `published_at desc`.
- The site runs as a single-page app, so the "server endpoint" is an edge function, `publish-article` (verify_jwt false). It checks `x-api-key` against `Deno.env.get("PUBLISH_SECRET_KEY")` with a constant-time compare, validates input with Zod (slug format, size limits), and upserts with the service-role client using `onConflict: "slug"`. It applies the `site.default_author` and `site.default_category` defaults and includes CORS headers.
- `netlify.toml`: a 200 proxy rule sends `/api/public/webhooks/publish-article` to the edge function, placed before the SPA fallback. Existing redirects stay as they are.
- Frontend: `src/hooks/useArticles.ts` (React Query), `src/pages/Blog.tsx`, `src/pages/Article.tsx`. Markdown is rendered with `react-markdown` + `remark-gfm` and sanitised. Reading time is about 220 words per minute. New routes go in `App.tsx`, `/blog` goes in `routes.ts` and the static sitemap, and the nav entry goes in `Header.tsx` and `Footer.tsx`.
- The `sitemap` edge function adds published articles. The `job-gone.ts` crawler prerender is extended to `/blog/*` for article meta tags, with a matching `netlify.toml` path.
- Verification: a curl test of the webhook (401 without a key, 200 with one), then a browser check of `/blog` and an article page.
- Still open from the previous plan: the job-category pages and guides, which come after this work.
