## Plan: Newsletter Enhancements, SEO Fix, Job Detail Card Enrichment, Email Subscriber Form

### 1. Newsletter: Add "Copy Newsletter" button + generate fresh newsletter now

`**src/pages/Newsletter.tsx`:**

- Add a "Copy Newsletter" button below the newsletter content that copies the HTML content to clipboard as plain text
- Change the subtitle from "every Saturday" to "every Monday"
- Change the empty state text from "Check back on Saturday" to "Check back on Monday"

**Runtime:** Invoke the `generate-newsletter` edge function now to create a fresh newsletter for this week (today is Monday April 6, the cron ran at 7 AM but let's verify it worked — there's already a newsletter from today in the DB, so this may already be resolved).

### 2. Fix Google search showing Lovable logo instead of Eplicant logo

The `index.html` had its `<meta name="description">`, OG tags, and Twitter tags removed in the last diff. These need to be restored so Google uses the correct metadata and logo.

`**index.html`:**

- Re-add the `<meta name="description">` tag
- Do not Re-add `<link rel="canonical" href="https://eplicant.com/" />`
- Re-add all Open Graph tags (`og:type`, `og:url`, `og:title`, `og:description`, `og:image`)
- Re-add Twitter card tags (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`)

The Organization structured data already has the correct logo URL. The missing OG/meta tags are the likely cause of Google using the wrong logo.

### 3. Enrich Job Detail sidebar card with AI-extracted fields

The reference image shows: Apply Before, Job Type (Full-time/Part-time), Salary Range, Category, Skills. Currently the DB only has `salary`, `job_type`, `category`, `tags` columns. Missing: `apply_before` (deadline), `skills`. Also `job_type` is being overwritten with work mode (Remote/Hybrid/Physical) by the `clean-job-descriptions` function instead of actual employment type.

**Database migration — add new columns:**

- `apply_before` (text, nullable) — application deadline
- `skills` (text[], nullable) — extracted skills
- `employment_type` (text, nullable) — Full-time/Part-time/Contract/Internship (separate from `job_type` which stores work mode)

`**supabase/functions/clean-job-descriptions/index.ts`:**

- Add `apply_before`, `skills`, and `employment_type` to the OpenAI tool definition
- Update the system prompt to extract these fields
- Update `buildUpdateData` to save these fields
- Stop overwriting `job_type` with work mode — save work mode to `is_remote` (true if Remote) and employment type to `employment_type`

`**src/pages/JobDetail.tsx` (JobDetailSidebar):**

- Add "Apply Before" field showing the deadline
- Show `employment_type` as "Job Type" (Full-time, Part-time, etc.)
- Show salary range (already exists)
- Show category (already exists)
- Add skills badges section

`**src/types/job.ts`:**

- Add `apply_before`, `skills`, `employment_type` fields

### 4. Email subscriber form using Plunk

Will need the user's Plunk public key (for client-side) and secret key (for server-side if needed).

`**src/components/EmailSubscriber.tsx**` — New component:

- Dark banner style (matching the reference image)
- Email input + "Subscribe" button
- Uses Plunk's client-side API to subscribe emails
- Shows success/error feedback

`**src/pages/Index.tsx`:**

- Add `EmailSubscriber` banner below the hero section

`**src/pages/JobDetail.tsx`:**

- Add `EmailSubscriber` banner after the job description / similar jobs section

**Secrets needed:**

- `PLUNK_PUBLIC_KEY` — stored in codebase (public/publishable key)
- `PLUNK_SECRET_KEY` — stored as edge function secret (if server-side tracking needed)

### 5. Fix build errors

`**supabase/functions/fetch-jobs/index.ts` (line 439):**

- Cast `batch` to `Record<string, unknown>[]` for `mirrorUpsert`

`**supabase/functions/sitemap/index.ts` (line 25-30):**

- Fix the type definition to include `lastmod` as optional property

### Files Changed


| File                                                 | Change                                                   |
| ---------------------------------------------------- | -------------------------------------------------------- |
| `index.html`                                         | Restore OG, Twitter, canonical, description meta tags    |
| `src/pages/Newsletter.tsx`                           | Add copy button, fix "Saturday" → "Monday" text          |
| `src/pages/JobDetail.tsx`                            | Add apply_before, employment_type, skills to sidebar     |
| `src/pages/Index.tsx`                                | Add EmailSubscriber component                            |
| `src/components/EmailSubscriber.tsx`                 | New — Plunk email subscriber form                        |
| `src/types/job.ts`                                   | Add new fields                                           |
| `supabase/functions/clean-job-descriptions/index.ts` | Extract apply_before, skills, employment_type via OpenAI |
| `supabase/functions/fetch-jobs/index.ts`             | Fix type cast for mirrorUpsert                           |
| `supabase/functions/sitemap/index.ts`                | Fix lastmod type                                         |
| Database migration                                   | Add `apply_before`, `skills`, `employment_type` columns  |
