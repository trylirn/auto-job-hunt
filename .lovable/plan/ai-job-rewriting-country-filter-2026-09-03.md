# AI job rewriting + country filter

## 1. Turn AI rewriting back on

Current state: the AI cleaner exists and uses your OpenAI key (`gpt-4o-mini`), but of 5,181 live jobs only **80** have a cleaned description. Two reasons:

- Nothing runs it on a schedule. It is only triggered "fire and forget" at the end of the 15-minute fetch run, which usually dies before the cleanup call completes.
- Each run handles at most 25 jobs, so even when it fires it never catches up with the backlog.

Changes:

- **Rewrite the AI instructions** for the current site. The prompt still talks about WordPress aggregator blogs, disclaimers and social-channel stripping from sources that no longer exist. Replace with instructions for ATS-sourced remote jobs: produce clean, well-structured HTML (Overview, Responsibilities, Requirements, Benefits, Location, How to Apply), keep facts faithful (no invented content), and keep extracting country, work mode, employment type, deadline, skills and apply URL.
- **Add a dedicated schedule**: run the cleaner every 10 minutes with the cron token, processing a batch per run and looping inside its time budget so it clears many jobs per run rather than 20.
- **Dont Backfill the 5,101 uncleaned jobs**: I'll dont also kick off runs manually after deploy so it drains within hours instead of days. Only focus on the latest 100.
- The job detail page already prefers `clean_description`, so listings improve as they're processed — no UI change needed.
- Backfill only the latest 100 jobs on the website.

Cost note: ~5,100 backlog jobs on `gpt-4o-mini` is roughly a few dollars of OpenAI usage, then a small ongoing cost for new jobs.

## 2. Country filter under the search bar

- Add a country dropdown to the listing toolbar, directly under the search input, on the home page and country/location pages.
- Options come from live job locations (distinct, non-empty), sorted alphabetically, with "All countries" as default. "Global" shows as "Remote / Worldwide", matching current labelling.
- Selecting a country filters results (existing location filter in the jobs query), resets to page 1 and stores the choice in the URL as `?country=` so back/forward and shared links keep the filter.
- Result count text updates with the filter; empty state unchanged.

## Technical notes

- `supabase/functions/clean-job-descriptions/index.ts`: new system prompt, batching loop with a time guard.
- New pg_cron entry `clean-job-descriptions-every-10min` calling the function with the cron token header.
- `src/components/ListingToolbar.tsx`: new `country` / `onCountryChange` props + shadcn `Select`.
- `src/components/ListingBrowser.tsx`: read/write `country` search param, pass to `useJobs({ location })`, reset page on change; countries from `useFilterOptions`.