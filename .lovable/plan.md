

## Plan: SEO-Friendly Job URL Slugs

### What
Replace UUID-based job URLs (`/job/a7758acc-...`) with slug-based URLs (`/job/vacancies-for-sales-representative-sr`) generated from the job title.

### How

**1. Add `slug` column to `jobs` table (migration)**
- Add a `slug` text column (nullable initially)
- Create a unique index on `slug`
- Backfill existing jobs: generate slugs from titles using `lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'))` + append first 8 chars of UUID for uniqueness
- Add a database trigger to auto-generate slugs on INSERT/UPDATE when slug is null

```sql
ALTER TABLE public.jobs ADD COLUMN slug text;
-- Backfill
UPDATE public.jobs SET slug = lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || left(id::text, 8);
-- Unique index
CREATE UNIQUE INDEX jobs_slug_unique ON public.jobs(slug);
-- Trigger function for new inserts
CREATE OR REPLACE FUNCTION generate_job_slug() ...
```

**2. Update routing & lookup**
- `App.tsx`: Change route to `/job/:slug`
- `JobDetail.tsx`: Look up job by `slug` instead of `id`
- `useJobs.ts`: Add `useJobBySlug(slug)` query that fetches `.eq("slug", slug).single()`

**3. Update all internal links**
- `JobCard.tsx`: Link to `/job/${job.slug}`
- `JobListItem.tsx`: Link to `/job/${job.slug}`

**4. Update all external URLs**
- `JobDetail.tsx`: canonical, og:url, JSON-LD, ShareButtons all use slug
- `supabase/functions/sitemap/index.ts`: Fetch slug, use `/job/${slug}`
- `supabase/functions/post-to-socials/index.ts`: Use slug in apply URL

**5. Update `Job` type**
- `src/types/job.ts`: Add `slug: string | null`

**6. Backward compatibility**
- Add a second route `/job/id/:id` that redirects UUID URLs to the slug URL (so existing Google-indexed links and shared links still work)

### Files to Change

| File | Change |
|------|--------|
| Migration SQL | Add `slug` column, backfill, unique index, trigger |
| `src/types/job.ts` | Add `slug` field |
| `src/hooks/useJobs.ts` | Add `useJobBySlug()`, keep `useJob()` for redirect |
| `src/App.tsx` | Add `/job/:slug` route + `/job/id/:id` redirect route |
| `src/pages/JobDetail.tsx` | Use slug for lookup and all URLs |
| `src/components/JobCard.tsx` | Link using slug |
| `src/components/JobListItem.tsx` | Link using slug |
| `supabase/functions/sitemap/index.ts` | Use slug in URLs |
| `supabase/functions/post-to-socials/index.ts` | Use slug in URLs |

