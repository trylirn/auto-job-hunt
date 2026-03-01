

## Plan: Add New Job Sources

### Source 1: Opportunities for Youth (opportunitiesforyouth.org) — Feasible

This is a WordPress site with a public REST API (`/wp-json/wp/v2/posts`). It follows the exact same pattern as YesHub and Global South. Categories include Fellowship, Conferences, Short Courses, Scholarships, etc.

**Edit: `supabase/functions/fetch-jobs/index.ts`**
- Add a new `fetchOpportunitiesForYouthJobs()` function following the same WordPress REST API pattern
- Fetch categories from `/wp-json/wp/v2/categories`
- Fetch 2 pages of 50 posts each with `_embed` for featured images
- Map categories to our normalized types (fellowship, scholarship, conference, internships, etc.)
- Set `source: "opportunitiesforyouth"`, `location: "Global"`
- Parse title to extract company using existing `extractCompany()` helper
- Include in the `allJobs` array for upsert alongside existing sources
- Update the response to report this source's count

### Source 2: Afrorama (afrorama.org) — Not Feasible

Afrorama runs on **Circle.so**, a community platform with no public API. The job board is rendered client-side and there's no REST endpoint to pull structured data from. Scraping would be required, which conflicts with the project's approach of using direct public APIs only.

**Alternative**: If you know of other Africa-focused job boards built on WordPress or with public APIs, those could be added instead.

### Technical Notes
- The edge function already handles multiple sources and batched upserts — adding one more source fits naturally
- The `source,external_id` unique constraint prevents duplicates
- The hourly cron job will automatically pick up the new source
- No database changes needed

