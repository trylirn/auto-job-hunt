

## Plan: Add YesHub.ng as a Job Source (via WordPress REST API)

YesHub.ng is a WordPress site with a **public REST API** — no scraping needed. The edge function will call `https://yeshub.ng/wp-json/wp/v2/posts` to fetch the latest opportunities and store them in your existing `jobs` table.

### What will be done

1. **Update the `fetch-jobs` edge function** to add a new `fetchYeshubJobs()` function that:
   - Calls the WordPress REST API (`/wp-json/wp/v2/posts?per_page=50&_embed`) to get latest posts
   - Extracts title, excerpt/description, link, date, featured image, and category from each post
   - Maps WordPress categories (grants, fellowship, internships, conference, etc.) to the job board's category field
   - Normalizes data into the same `NormalizedJob` format used by Remotive and Arbeitnow
   - Uses the WordPress post ID as `external_id` with source `"yeshub"` for deduplication

2. **Run the updated function** to immediately pull in YesHub listings alongside the existing API sources.

### Technical details

- **API endpoint**: `GET https://yeshub.ng/wp-json/wp/v2/posts?per_page=50&_embed` — returns JSON with title, excerpt, date, link, featured image URL, and category IDs
- **Category mapping**: Will fetch `/wp-json/wp/v2/categories` to map category IDs to names (grants, fellowship, internships, etc.)
- **HTML stripping**: The excerpt/description comes with HTML tags — will strip them just like the other sources
- **No API key required** — the WordPress REST API is public
- **No new database changes** — reuses the existing `jobs` table and deduplication logic

