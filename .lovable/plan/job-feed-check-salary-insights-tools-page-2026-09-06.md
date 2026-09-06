# Job feed check + Salary Insights tools page

## 1. Job updates — what I found

The feed is running, not broken:

- The 15-minute fetch ran as recently as 08:15 today and processed 1,460 listings from 3,101 fetched across Greenhouse, Lever, Ashby and Breezy.
- All scheduled tasks (fetch, cleanup, description cleaning, LinkedIn posting) show successful runs in the last 24 hours.
- Newest listing added: today 03:15. Only 16 brand-new listings arrived in the last 24 hours because existing listings are refreshed rather than re-added, so the "newest" date barely moves.

Two real issues worth fixing:

- Every run logs errors trying to copy listings to the secondary database (`noplslnmxaixrjyyyazy`) — that address no longer resolves, so the mirror is dead and each run wastes time on failing calls. Fix: skip the mirror when its address is unreachable/unset, and stop logging one error per batch.
- Freshly added listings cluster at 03:00 daily, right after the daily purge. Fix: relax nothing about quality, but log per-source insert counts so low intake is visible, and confirm the "posted within 30 days" gate isn't silently rejecting most new postings.

## 2. Tools page with Salary Insights Calculator

New page at `/tools` plus a "Tools" link in the header (desktop and mobile menu).

The page shows:

- Short intro explaining the benchmarks come from real pay ranges published on live listings.
- **Salary Insights Calculator**: pick a job family (Engineering, Product, Design, Data, Marketing, Sales, Support, Operations, Finance) and an experience level (Junior, Mid, Senior, Lead/Staff, Director+). It shows the low / median / high range, sample size, and a note when data is thin.
- A benchmark table of all families and levels so people can browse without selecting.
- Adsterra ad placed mid-page between the calculator and the table, plus one below the table.
- Trust line: number of listings the benchmarks are drawn from and the date range.

Data note: 454 live listings currently publish a pay range (out of 4,861). That's enough for credible benchmarks in the bigger families, and the page will say "not enough data yet" instead of inventing numbers for thin cells.

## Technical detail

- `src/lib/salaryBenchmarks.ts`: parse salary strings (`$130K – $140K`, `CA$95,000 – CA$143,750`, `$213.6K`, trailing `• Offers Equity` noise), normalise K-suffixes and thousands separators, drop non-USD unless converted-by-label (keep currency symbol grouping — only USD rows feed the benchmarks, others shown separately as "USD only"), infer job family from title keywords and level from title tokens (intern/junior/associate, mid default, senior, staff/lead/principal, director/head/vp). Export `computeBenchmarks(jobs)` returning median/p25/p75/count per family+level.
- `src/hooks/useSalaryData.ts`: single Supabase query selecting `title,salary,created_at` where `archived_at is null`, `salary is not null`, source `<> 'himalayas'`, cached via react-query.
- `src/pages/Tools.tsx`: `Layout` + `Seo` (title "Remote Salary Insights Calculator", description under 160 chars), single H1, selects from shadcn `Select`, results card, benchmark table, two `AdsterraNativeAd` slots.
- Route `/tools` in `src/App.tsx`; entry in `src/lib/routes.ts` (indexable, weekly, 0.6) so sitemap/llms.txt pick it up; `Tools` item in `NAV` in `src/components/Header.tsx`.
- `supabase/functions/_shared/eplicant-client.ts` / `fetch-jobs`: guard the mirror behind a reachability check and a single aggregated warning per run instead of per-batch errors.
