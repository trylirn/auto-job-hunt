## Plan: Navigation, Deadlines, Opportunities Tone, Footer/Newsletter, Submissions

### 1. Smart "Back" navigation

Replace the hard-coded `<Link to="/">` "Back to jobs" in `JobDetail.tsx` with a button that calls `navigate(-1)` when there is browser history (check `window.history.length > 1` and `document.referrer` is same-origin); otherwise fall back to `/` (jobs) or `/opportunities` based on `job.listing_type`. Label updates to "Back".

### 2. Application deadlines (notice + auto-archive + smart delete)

**Schema migration (`jobs` table):**

- Add `apply_before_date` (date, nullable) — parsed structured date for sorting/comparison
- Add `archived_at` (timestamp, nullable) — non-null = hidden from listings

**Backfill / parsing:**

- Update `clean-job-descriptions/index.ts` so that when `apply_before` is extracted, the model also returns an ISO date (`apply_before_iso`) which we save to `apply_before_date`.
- Add a one-off helper invocation path inside `fix-company-names` (or new function) to parse existing `apply_before` strings into `apply_before_date` using a quick AI call.

**Filtering:**

- Update `useJobs` and `useSimilarJobs` to add `.is("archived_at", null)` to every listing query so archived items disappear instantly.

**UI deadline notice:**

- In `JobCard`, `JobListItem`, and `JobDetail` sidebar, when `apply_before_date` is within 7 days, show a red "Closes in N days" badge. When ≤ 1 day → "Closes today/tomorrow".

**Cron jobs (pg_cron, via insert tool):**

- New function `archive-expired-listings`: runs hourly, sets `archived_at = now()` where `apply_before_date < now() AND archived_at IS NULL`.
- Update `cleanup-old-listings`: change the 45-day delete predicate to:
`(apply_before_date IS NULL AND created_at < now() - interval '45 days') OR (apply_before_date IS NOT NULL AND apply_before_date < now()::date)`.
→ Jobs with deadlines are kept until the deadline has passed (even beyond 45 days), then deleted on the next daily run. Jobs without deadlines keep current 45-day behavior.

### 3. Opportunities tone (not "hiring")

Update the `clean-job-descriptions` system prompt's opportunity branch to use applicant-centric language ("This opportunity offers…", "Applicants should…") rather than employer/hiring tone. Add a re-clean trigger: a new edge function `reclean-opportunities` that nulls `clean_description` for `listing_type='opportunity'` rows so the existing cleaner re-processes them with the new prompt. In the JobDetail header, when `listing_type === 'opportunity'`, replace the auto-generated "{company} is hiring a {title}" sentence with "Open application: {title} via {company}".

### 4. Footer + Newsletter relocation + Legal pages

**New pages** (added to App routes):

- `/terms` — Terms of Service
- `/privacy` — Privacy Policy
- `/contact` — Contact
- `/about` — About Eplicant

**New `Footer` component** (replaces the inline footers in `Index.tsx` and `Opportunities.tsx`):

- Move the newsletter at the header to the footer, make it very tiny in the footer.
- 4 columns: Browse (Jobs, Opportunities, Newsletter), Company (About, Contact, Submit a Job), Legal (Terms, Privacy), Connect (social links)
- Copyright row at bottom
- Put a Submit a Job in the Header

**Do not Remove** the hero `EmailSubscriber` block from `Index.tsx`

### 5. Hero content beside search bar

On `Index.tsx` hero, change layout to a two-column grid on `md+`: left column keeps headline + search; right column shows a small stats card: "🟢 X live jobs · Y opportunities · Updated daily" plus quick category chips (Remote, US-based, This week) that wire into existing filters.

### 6. AI location enrichment (country-only)

The `clean-job-descriptions` prompt already extracts country. Add a one-off edge function `fix-locations` (mirrors `fix-company-names` pattern) that re-runs the AI country extractor on rows where `location` contains commas, city names, or is "Unknown"/null, using description text. Wire it into the same 30-min pg_cron schedule.

### 7. Paid submissions ($195, featured for 30 days, no account)

**Schema migration:**

- Add to `jobs`: `is_featured` (bool default false), `featured_until` (timestamptz), `submitter_email` (text), `payment_status` (text: 'pending'|'paid'), `payment_id` (text)
- Add `submission_logo_url` (text) for uploaded logos
- Public can INSERT into `jobs` only when `payment_status='pending'` (RLS) — but to keep the existing public read model safe, we instead use a separate `job_submissions` staging table that gets promoted to `jobs` after Stripe webhook confirms payment.

**Recommended approach:** new `job_submissions` table with same fields, public INSERT allowed, public SELECT only own row by submission token. After payment webhook fires, edge function copies row into `jobs` with `is_featured=true`, `featured_until=now()+30 days`, `listing_type` user-selected.

**Storage:** new `company-logos` public bucket for logo uploads.

**Payments:** Recommend Stripe (digital service, no shipping). Will run `payments--recommend_payment_provider` then `enable_stripe_payments`. Create a $195 one-time product. Implement:

- `create-submission-checkout` edge function → creates Stripe Checkout Session
- `submission-webhook` edge function → on `checkout.session.completed`, marks submission paid + promotes to `jobs`
- Featured listings: sort `is_featured desc, posted_at desc` in `useJobs` and add a "Featured" badge.

**New page `/submit**` with the requested form fields:

- Company Name, Job Title, Tags (multi-input), Location, Work Arrangement (On-site/Hybrid/Remote), Salary range with currency + period, Logo upload (optional), Job Description (rich text or markdown), Apply method (URL or email), Company invoice email, listing type (Job/Opportunity).
- All fields validated with zod (lengths, email format, URL format).
- Submit → call `create-submission-checkout` → redirect to Stripe → return URL `/submit/success`.

**Header link:** add "Post a Job — $195" CTA button.

**Featured display:** `JobCard`/`JobListItem` show a "Featured" gold badge when `is_featured && featured_until > now()`.

**Featured expiry:** the existing `archive-expired-listings` cron also clears `is_featured=false` when `featured_until < now()` (listing stays alive as a normal post if still within 45 days / pre-deadline).

### Files changed


| File                                                                   | Change                                                                      |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `src/pages/JobDetail.tsx`                                              | Smart back nav, deadline badge, opportunity tone heading, conditional copy  |
| `src/pages/Index.tsx`                                                  | Two-col hero with stats, remove inline footer + email block, use new Footer |
| `src/pages/Opportunities.tsx`                                          | Use new Footer, opportunity-centric copy                                    |
| `src/components/Header.tsx`                                            | Add "Post a Job — $195" CTA                                                 |
| `src/components/Footer.tsx` (new)                                      | Newsletter signup + nav columns + legal links                               |
| `src/components/JobCard.tsx`, `JobListItem.tsx`                        | Deadline badge, Featured badge                                              |
| `src/pages/Terms.tsx`, `Privacy.tsx`, `Contact.tsx`, `About.tsx` (new) | Static legal/info pages                                                     |
| `src/pages/Submit.tsx`, `SubmitSuccess.tsx` (new)                      | Paid submission form                                                        |
| `src/hooks/useJobs.ts`                                                 | Filter `archived_at IS NULL`, sort featured first                           |
| `src/types/job.ts`                                                     | Add new fields                                                              |
| `src/App.tsx`                                                          | Register new routes                                                         |
| `supabase/functions/clean-job-descriptions/index.ts`                   | Extract `apply_before_iso`, opportunity tone prompt                         |
| `supabase/functions/archive-expired-listings/` (new)                   | Hourly archive cron target                                                  |
| `supabase/functions/cleanup-old-listings/index.ts`                     | Deadline-aware delete logic                                                 |
| `supabase/functions/fix-locations/` (new)                              | AI country backfill                                                         |
| `supabase/functions/reclean-opportunities/` (new)                      | Null clean_description for opportunities                                    |
| `supabase/functions/create-submission-checkout/` (new)                 | Stripe checkout                                                             |
| `supabase/functions/submission-webhook/` (new)                         | Promote paid submissions                                                    |
| Migration                                                              | Add new columns, `job_submissions` table + RLS, `company-logos` bucket      |
| pg_cron (insert tool)                                                  | Schedule archive-expired hourly, fix-locations every 30 min                 |


### Open questions before implementation

1. **Payments provider** — I'll run `recommend_payment_provider`. If the job board qualifies for Paddle, do you prefer Paddle (handles taxes/MOR globally) or Stripe (more control)? Default: I'll suggest based on the eligibility check.
2. **Logo upload** — OK to create a public `company-logos` storage bucket (≤ 2 MB, png/jpg/webp/svg)?
3. **Featured duration** — Confirm 30 days featured + post stays live until deadline or 45 days, whichever is later?
4. **Legal pages content** — I'll draft generic Terms/Privacy templates referencing Eplicant; you can edit copy after. OK?