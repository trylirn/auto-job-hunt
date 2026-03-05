

## Plan: 5 Changes

### 1. Enhanced Share Text
Update `ShareButtons` to accept `location`, `jobType`, `salary` props and build a richer message:
- **Format**: `🚀 Hiring: {title} at {company} | {location} | {jobType}\n\nApply here: https://eplicant.com/job/{id}`
- Copy link copies the full summary text + URL
- Pass extra props from `JobDetail.tsx`

### 2. Replace All `auto-job-hunt.lovable.app` with `eplicant.com`
Global find-and-replace across all files:
- `src/pages/Index.tsx` — canonical, og:url
- `src/pages/Opportunities.tsx` — canonical, og:url
- `src/pages/JobDetail.tsx` — canonical, og:url, JSON-LD, ShareButtons URL
- `supabase/functions/sitemap/index.ts` — SITE_URL
- `supabase/functions/post-to-socials/index.ts` — apply URLs
- `public/robots.txt` — sitemap URL
- `public/sitemap.xml` — static URLs

### 3. Dynamic Country Filter from DB
- Update `useFilterOptions` to fetch distinct locations split by `listing_type` (jobs vs opportunities), returning `{ jobLocations, opportunityLocations }`
- Update `JobFilters` and `OpportunityFilters` to accept `availableLocations` as a prop instead of hardcoded `COUNTRIES`
- Pass from `Index.tsx` and `Opportunities.tsx`

### 4. WhatsApp Floating Button
Replace the full-width bottom banner in `WhatsAppBanner.tsx` with a circular floating button at the bottom-right:
- Green circle with WhatsApp icon
- Tooltip: "Join us on WhatsApp for instant job alerts"
- Small X to dismiss

### 5. Dynamic Sitemap via Netlify Proxy
The edge function already generates all job URLs dynamically. To make it work at `/sitemap.xml`:
- Update `SITE_URL` to `https://eplicant.com` in the edge function
- Add a Netlify redirect in `netlify.toml`: `/sitemap.xml` → edge function URL (200 proxy), placed **before** the SPA catch-all
- Update `robots.txt` to `Sitemap: https://eplicant.com/sitemap.xml`
- Update static `public/sitemap.xml` as fallback

### Files to Change

| File | Change |
|------|--------|
| `src/components/ShareButtons.tsx` | Add location/jobType/salary props, richer share text |
| `src/pages/JobDetail.tsx` | Pass extra props to ShareButtons, all URLs → eplicant.com |
| `src/pages/Index.tsx` | URLs → eplicant.com, pass dynamic locations |
| `src/pages/Opportunities.tsx` | URLs → eplicant.com, pass dynamic locations |
| `src/components/WhatsAppBanner.tsx` | Convert to floating circle button |
| `src/components/JobFilters.tsx` | Accept `availableLocations` prop |
| `src/components/OpportunityFilters.tsx` | Accept `availableLocations` prop |
| `src/hooks/useFilterOptions.ts` | Split locations by listing_type |
| `supabase/functions/sitemap/index.ts` | SITE_URL → eplicant.com |
| `supabase/functions/post-to-socials/index.ts` | URLs → eplicant.com |
| `public/robots.txt` | Sitemap URL → eplicant.com |
| `public/sitemap.xml` | URLs → eplicant.com |
| `netlify.toml` | Add `/sitemap.xml` proxy redirect before SPA fallback |

