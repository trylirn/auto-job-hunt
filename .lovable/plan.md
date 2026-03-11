

## Plan: Google Rich Results + AdSense Integration

### 1. Google Search Appearance (Sitelinks + Logo)

The first image shows Google displaying sitelinks (sub-pages listed under the main result) like Idealist has. To encourage Google to show this for Eplicant, we need to add structured data:

- **`WebSite` schema** with a `SearchAction` (tells Google about the site's search functionality)
- **`Organization` schema** with the logo URL (tells Google which logo to use -- fixes the Lovable logo issue)
- **`SiteNavigationElement` schema** listing key pages (Remote Jobs, Opportunities, etc.) to hint at sitelinks

These will be added as JSON-LD in `index.html` and via Helmet in `Index.tsx`.

Note: Google does not guarantee sitelinks -- it algorithmically decides. But structured data + clear navigation significantly increases the chances.

**Files:** `index.html`, `src/pages/Index.tsx`

### 2. Google AdSense Integration

Add the AdSense script (`ca-pub-8988791559344644`) to `index.html` `<head>`. This enables auto ads site-wide. Later you can create specific ad units in your AdSense dashboard and we can place them in specific positions (sidebars, in-content, near Apply button).

**File:** `index.html`

### Summary of Changes

| File | Change |
|------|--------|
| `index.html` | Add AdSense script, add Organization + WebSite JSON-LD |
| `src/pages/Index.tsx` | Add SiteNavigationElement JSON-LD via Helmet |

