# LinkedIn auto-posting, weekly newsletter, country filter

## 1. Auto-post new jobs to LinkedIn via Buffer

New jobs get published straight to LinkedIn (not queued as scheduled drafts), checked every 15 minutes.

How it works:

- A new backend function collects jobs added since the last run that have not been posted yet, and sends each one to Buffer for immediate publishing on your LinkedIn channel.
- Each post carries the job title, company, location/work mode, a short line, the direct job link on eplicant.com, and a few hashtags.
- A small tracking table records which job was posted, when, and the Buffer post ID, so nothing is ever posted twice and failures can be retried.
- Safety cap: at most 3 posts per run (max ~18/hour) so LinkedIn doesn't rate-limit or flag the account. Backlog rolls over to the next run.
- Himalayas-sourced jobs stay excluded, matching the rest of the site.

Timing note: this runs 144 times per day. Frequent checks keep the database awake even when there is nothing new, which adds a little to Cloud cost. An alternative is posting on the same 15-minute rhythm as job fetching (96 runs/day, max 15 min delay).

What I need from you:

- Buffer access token (I'll request it as a secret when building).
- Your LinkedIn channel ID in Buffer — or I can call Buffer's API with your token to list channels and pick the LinkedIn one automatically.

I'll verify by triggering a real run and confirming the post appears in Buffer/LinkedIn before calling it done.

## 2. Weekly newsletter — Sunday evening

The newsletter generator already exists and works; its schedule currently runs Monday 07:00 UTC. Change it to Sunday 18:00 UTC (19:00 Lagos) and confirm a generated issue appears on the Newsletter page.

## 3. Country filter dropdown cleanup

Wire the existing `src/lib/countries.ts` mapper into the listing browser so the dropdown shows clean country names instead of the 189 raw strings (cities, codes like "APJ"). "All countries" stays the default, regional/worldwide entries sort to the bottom, and the selection stays in the URL as today.

## Technical detail

- New edge function `post-to-buffer`: service-role client, `requireCronAuth`, queries `jobs` where `archived_at is null`, `source <> 'himalayas'`, `created_at > now() - interval '2 hours'`, and no row in the new tracking table; posts via Buffer GraphQL `https://api.buffer.com/graphql` (`createPost`/`postCreate` mutation with `shareNow: true`), stores result.
- New table `public.job_social_posts (id, job_id fk, platform text, external_post_id text, status text, error text, created_at)`, RLS on, no anon/authenticated grants, `GRANT ALL ... TO service_role` only.
- Secrets: `BUFFER_ACCESS_TOKEN`, `BUFFER_LINKEDIN_CHANNEL_ID`.
- `pg_cron` job `post-jobs-to-linkedin` at `*/10 * * * *` with `x-cron-token` from `app_secrets`, same pattern as existing jobs.
- Reschedule `generate-weekly-newsletter` to `0 18 * * 0`.
- `ListingBrowser.tsx`: replace the `useMemo` option-building block with `countriesFromLocations(filterOptions?.jobLocations ?? [])`, mapping to `{ value: query, label: name }`.