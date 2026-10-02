# LinkedIn posts, catch-up posting, new SEO pages, GSC and backlink lists

## 1. LinkedIn auto-posting (Buffer)

**Choosing jobs (each run every 30 minutes posts 1 job):**
- First choice: the newest job added in the last 6 hours that has never been posted.
- If there isn't one, post the newest job that is still live, was never posted, and was added in the last 15 days. This catches up on skipped jobs.
- Never post archived, expired, Himalayas or "opportunity" listings, or any job that was already posted.

**New post format, matching your example:**
```text
{Company} is on the lookout for a {Title}. Apply now!

🔗 Link: https://eplicant.com/job/{slug}

💰 Salary: {salary}            <- left out when the job has no salary
📍 Location: {location or "Remote"}

🧑‍💼 Share this with your network or tag someone who might benefit.

Follow Eplicant for verified opportunities.
```
The extra spaces in the title ("Customer Care Advisor .") will be removed. Job titles and salaries will be tidied so they read cleanly.

## 2. New SEO pages (written to Google's content guidelines)

Each page will be useful in its own right: an original guide of about 600–900 words, plus the live remote jobs that match the page, so no page is thin or a copy of another. Each page gets its own title, description, headings, breadcrumbs and links to related pages. It also goes into the sitemap and is linked from the footer.

**Remote jobs by type** (`/remote-jobs/{category}`), 10 pages: software engineering, design, product, data, marketing, sales, customer support, operations, finance, HR and recruiting. Each page covers the typical roles, the skills employers ask for, salary ranges taken from our own listings, and tips for applying, followed by the matching live jobs.

**Guides** (`/guides/{slug}`), 5 pages:
- How to find a legitimate remote job (and spot scams)
- Remote job interview tips
- Writing a CV for remote roles
- Remote salary guide (built on the Tools page figures)
- Working across time zones

**Checks against the Google SEO Starter Guide for every new and existing page:** a unique, descriptive title and description; one clear main heading; content written for people, not stuffed with keywords; descriptive link text; images with alt text; readable web addresses; no duplicate content; working internal links. Problems found on existing pages (Home, Tools, About, the location pages, Newsletter, Submit) will be fixed. For example, the Newsletter page still says "Monday" and "opportunities", which no longer matches the site.

## 3. Things I'll give you in chat (no site changes)
- A list of important page links to paste into Google Search Console's URL Inspection, with the new pages first.
- A list of high-quality places in the remote-work niche where eplicant.com can be listed: remote job directories, startup and launch directories, and remote-work communities. Each one comes with how to get listed.

## Already done earlier in this thread
The site's default title and description now say it's a general remote job board, and titles are no longer cut off. Once these changes are in, I'll mark the matching SEO findings as fixed. One finding can't be fixed in code: Google prefers the lovable.app address over eplicant.com. The fix is to verify eplicant.com in Search Console, and I'll walk you through it.

## Technical details
- `post-to-buffer/index.ts`: set `MAX_PER_RUN = 1`, use two queries (fresh 6-hour pool, then a 15-day backlog with `archived_at is null` and an unexpired deadline), reuse the `job_social_posts` exclusion, select `salary`, rewrite `buildMessage`, deploy, then dry-run.
- New data files: `src/data/remoteCategories.ts` and `src/data/guides.ts`. New pages: `src/pages/RemoteCategory.tsx` (reusing `ListingBrowser` with a keyword query) and `src/pages/Guide.tsx`. Routes go in `App.tsx`, and entries go in `routes.ts`, the static `sitemap.xml`, the `sitemap` edge function and `job-gone.ts` prerender metadata, so crawlers see the right titles.
- JSON-LD: BreadcrumbList and ItemList on category pages, Article on guides.
