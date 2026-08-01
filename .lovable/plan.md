## Eplicant — full frontend rebuild

Backend stays completely untouched: the jobs database, source updater, newsletter generator, cleanup/archive functions and their schedules keep running exactly as they do today. Everything below replaces the *website* only.

### First, the honest part about SEO

Lovable builds React + Vite. There is no server rendering. The reason Google struggles today is that every URL initially serves the same bare HTML shell, and the real title/description/content only appear after JavaScript runs.

The rebuild does not remove that constraint — it fixes it properly with a **site-wide bot prerender layer at the Netlify edge**. Today that layer only covers job pages. After the rebuild, every route (home, opportunities, country hubs, city hubs, guides, legal pages, job/opportunity detail) is served to crawlers as complete, real HTML with correct title, description, canonical, and structured data, generated at request time from the live database. Humans still get the fast React app.

That is the maximum achievable on this stack, and it is a genuine step up from where the site is now. If you ever want true SSR for every visitor, that requires moving off Lovable — worth revisiting only if this doesn't move the needle.

### Design direction — editorial & calm

- Palette: ink `#12100E`, paper `#F7F4EF`, deep green `#1F6F5C` (primary), rust `#C2410C` (accent/deadline urgency), all as HSL semantic tokens.
- Type: serif display headings (Instrument Serif) + clean sans body (Work Sans). No Inter, no gradients.
- Feel: generous whitespace, hairline rules instead of heavy borders, quiet cards, restrained motion. Reads like a trusted sector publication, not a startup SaaS page.
- Full light/dark token set, WCAG AA contrast throughout.

### Pages being rebuilt

- **Home / Jobs** — hero with search, quick filters (Remote, US, this week), region and type filters, grid/list toggle, pagination in the URL, live counts, FAQ.
- **Opportunities** — same shell, opportunity-specific filters.
- **Job / Opportunity detail** — clean reading layout, deadline urgency notice, apply CTA, share buttons, similar listings, sanitized description.
- **Post a Job** — free submission form writing to the existing submissions path, with validation and confirmation.
- **Newsletter** — archive plus subscribe, unchanged generator behind it.
- **Subscribe form** — same Plunk integration, "join over 10,000 subscribers" copy, no spam wording.
- **Country hubs, city hubs, jobs index, UN careers guide** — all preserved, redesigned.
- **About, Terms, Privacy, Contact** — same content, new layout.
- **404** — proper noindex, useful navigation.

Existing behaviour that carries over unchanged: pagination memory when returning from a listing, browser-back returning to where you were, no aggregator/source attribution anywhere, deadline handling, direct application links.

### SEO work

- Per-route metadata: unique title, description, canonical, Open Graph, Twitter — for every route, driven by a single shared helper so nothing can be missed.
- Structured data: Organization + WebSite on the shell, `JobPosting` (with `applicantLocationRequirements`, `validThrough`, `identifier`) on detail pages, `BreadcrumbList` on hubs, `FAQPage` on home, `ItemList` on listing pages.
- Semantic HTML: single H1 per page, correct heading order, real `<nav>`/`<main>`/`<article>`, alt text everywhere, internal linking between hubs and listings.
- Apex-host canonicalisation and `.lovable.app` noindex preserved.
- 410 Gone for deleted/expired listings and 301 for legacy `/job/id/:uuid` preserved and extended to opportunities.
- Sitemap and `llms.txt` regenerated from the same route registry so they can't drift.
- Performance: font preload with `display: swap`, lazy images with dimensions, code-split routes, small initial bundle.

### Technical notes

- New design tokens in `index.css` and `tailwind.config.ts`; every component uses semantic tokens only.
- A single `src/lib/seo.ts` + `<Seo>` component as the one source of head metadata, consumed by both React and the edge prerenderer.
- A route registry (`src/lib/routes.ts`) feeding the router, sitemap, and prerender layer.
- `netlify/edge-functions/` extended from job-only prerendering to all routes, reusing the existing read-only database queries.
- Data hooks (`useJobs`, `useFilterOptions`, `useListingStats`) keep their current query shapes so the backend contract is identical.
- Old page and component files are deleted, not layered over.

### Sequence

1. Design system and tokens.
2. Layout shell, header, footer, SEO helper, route registry.
3. Listing pages and detail pages.
4. Post a job, newsletter, subscribe, legal/about pages, hubs and guide.
5. Edge prerender layer, sitemap, robots, llms.txt.
6. Verify in the preview: every route renders, filters and pagination work, submissions and subscriptions succeed, and bot-fetched HTML contains real metadata.
