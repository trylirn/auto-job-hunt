## Plan: Simplifications & Content Updates

### 1. Remove "Post a Job" feature

- `src/App.tsx` — remove `Submit` and `SubmitSuccess` imports and the `/submit` and `/submit/success` routes.
- `src/components/Header.tsx` — remove the "Post a Job — $195" button and the unused `Button` import.
- `src/components/Footer.tsx` — remove the "Post a Job" link from the Company column.
- Delete `src/pages/Submit.tsx` and `src/pages/SubmitSuccess.tsx`.
- Delete the `job_submissions` table and `company-logos` storage bucket via migration (cleanup of unused infra). Keep the `is_featured`/`featured_until`/`payment_status` columns on `jobs` since they're harmless and may be reused later.
- `src/pages/Terms.tsx` — remove paid-listings clause.

### 2. Minimise the newsletter in the footer

- `src/components/Footer.tsx` — collapse the 4-column grid to a single content row plus a tiny bottom strip. The newsletter becomes a small inline form on the bottom strip (just one icon + email input + button, ~24px tall) rather than a full column. Remove the "Newsletter" heading and column structure.

### 3. Expand Privacy, Terms, About content

Each page gets significantly more substance (multiple paragraphs per section, more sections):

- **Terms** — add: Eligibility, User Conduct, Intellectual Property, External Links, Account & Security note (none required), Indemnification, Termination, Governing Law, Severability, Updates, Contact. Remove paid-listings clause.
- **Privacy** — add: Who We Are, Information We Collect (expanded with subsections), How We Use Information, Legal Basis, Data Retention, Data Sharing & Third Parties, International Data Transfers, Your Rights (GDPR/CCPA-style list), Children's Privacy, Security, Cookies, Changes, Contact.
- **About** — add: Mission, What We Do, Who We Serve (international development sector), Our Values, Why International Development, Get Involved.

### 4. Remove all references to job aggregation and AI usage

The site is positioned strictly as **a job board for international development job seekers**.

- `src/pages/About.tsx` — rewrite. Remove "aggregate listings from trusted public sources, clean them with AI". Replace with copy positioning Eplicant as a curated job board for the international development sector.
- `src/pages/Index.tsx` — FAQ items need rewording:
  - "Eplicant is a career platform built to help job seekers discover verified jobs and opportunities across the Globe." → reposition as "Eplicant is a job board for international development professionals…"
  - "How often are jobs updated?" answer — drop "Our team ensures listings are current" wording that hints at curation pipelines; keep simple "New jobs and opportunities are added every day."
  - Hero stats card — change "Updated hourly" to "Updated daily".
  - Remove "AI-cleaned"-style language anywhere if present.
- `src/pages/Privacy.tsx` — keep only generic data handling, no aggregation references.
- `src/pages/Terms.tsx` — change "Eplicant aggregates publicly listed jobs and opportunities" to "Eplicant publishes jobs and opportunities for the international development sector."
- `src/pages/Newsletter.tsx` — copy reads fine; no changes needed.
- `src/components/Footer.tsx` — tagline "Discover jobs and opportunities that match your ambitions." → "Jobs and opportunities for the international development sector."
- `index.html` meta description — replace "Thousands of jobs updated automatically" with "Jobs and opportunities for international development professionals."
- `src/pages/Index.tsx` Helmet description, OG, Twitter — same replacement.
- `src/pages/Opportunities.tsx` Helmet description, OG, Twitter — keep generic, no AI/aggregation references (currently fine).
- `src/pages/JobDetail.tsx` — no changes needed (copy already neutral).

### 5. Update subscription form copy

Both subscription components show new copy:

- `src/components/EmailSubscriber.tsx`:
  - Heading stays "Get jobs in your inbox"
  - Description: "Join over 10,000 subscribers receiving our weekly newsletter."
  - Remove the "No spam." sentence.
- `src/components/Footer.tsx` (mini newsletter):
  - Tiny one-liner under the form: "Join 10,000+ subscribers." (no spam mention)

### Files changed


| File                                 | Change                                                    |
| ------------------------------------ | --------------------------------------------------------- |
| `src/App.tsx`                        | Drop Submit routes/imports                                |
| `src/components/Header.tsx`          | Drop "Post a Job" CTA                                     |
| `src/components/Footer.tsx`          | Minimise newsletter, drop Post a Job link, update tagline |
| `src/components/EmailSubscriber.tsx` | New copy, remove spam mention                             |
| `src/pages/Submit.tsx`               | Deleted                                                   |
| `src/pages/SubmitSuccess.tsx`        | Deleted                                                   |
| `src/pages/About.tsx`                | Expanded, no AI/aggregation references                    |
| `src/pages/Privacy.tsx`              | Significantly expanded                                    |
| `src/pages/Terms.tsx`                | Significantly expanded, remove paid-listings clause       |
| `src/pages/Index.tsx`                | FAQ + meta wording, hero stats label                      |
| `index.html`                         | Meta description                                          |
| Migration                            | Drop `job_submissions` table and `company-logos` bucket   |
