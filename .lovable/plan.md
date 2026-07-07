## Goal

Move listings that are actually **jobs** (paid roles like Coordinator, Officer, Manager, Specialist, Analyst, Assistant, Consultant, Director, Lead, etc.) out of the **Opportunities** feed and back into **Jobs / Homepage**, using Lovable AI as the classifier.

A quick DB check confirms the problem is still there — sample of active `listing_type='opportunity'` rows whose titles are clearly paid roles:

- "Deputy Chief of Party" (category=grant)
- "Legal Officer" (category=grant)
- "Fundraising Specialist" (category=grant)
- "Part-Time Communications Coordinator" (category=grant)
- "Wildlife Funds Manager" (category=grant)
- "Project Manager" (category=grant)
- "Personal Assistant" (category=opportunity)
- "HR & Talent Acquisition Manager" (category=grant)
- "Training and Capacity Development Lead" (category=internship)
- "Business Developer" (category=job but listing_type=opportunity)
- …and many more

Root cause of the leftovers: rows created before the last classifier fix in `fetch-jobs` still carry the old wrong `listing_type`, and a handful of titles use ambiguous marketing wrappers ("Join X as a Y…") that a regex can't safely resolve — an LLM can.

## Scope

**In scope**
- New Supabase Edge Function `reclassify-listings` that:
  1. Reads active rows where `listing_type = 'opportunity'` (batched, e.g. 50 per call).
  2. For each row, asks Lovable AI (`google/gemini-2.5-flash`, cheap + fast) to classify as `job` or `opportunity` using title + short description snippet.
  3. Updates `listing_type = 'job'` on rows the model marks `job` (with a confidence gate).
  4. Returns a JSON summary (`scanned`, `reclassified`, `kept`, `errors`, sample of moved titles).
- Auth: require `x-cron-secret: $CRON_SECRET` header (same pattern the other admin functions use via `_shared/require-cron.ts`) so it can only be triggered manually.
- Run it once via `supabase--curl_edge_functions` to backfill, then leave it deployed for future manual sweeps.

**Explicitly out of scope (not touched)**
- `supabase/functions/fetch-jobs/index.ts` — the source updater. No edits.
- The OpenAI integration / `OPENAI_API_KEY` — untouched. This function uses Lovable AI Gateway (`LOVABLE_API_KEY`) only.
- `clean-job-descriptions`, `fix-company-names`, `fix-locations`, `archive-expired-listings`, cron schedules, RLS, `jobs` schema.
- Frontend (`Index.tsx`, `Opportunities.tsx`, filters) — no changes needed; they already read `listing_type`.

## How it works (technical)

1. **Function file**: `supabase/functions/reclassify-listings/index.ts`
   - `require-cron.ts` auth guard.
   - Service-role Supabase client.
   - Query:
     ```sql
     select id, title, company, clean_description, description, category
     from jobs
     where listing_type = 'opportunity'
       and archived_at is null
     order by created_at desc
     limit :batch;
     ```
   - For each row, call Lovable AI Gateway (`https://ai.gateway.lovable.dev/v1`, header `Lovable-API-Key: $LOVABLE_API_KEY`, model `google/gemini-2.5-flash`) with a strict JSON-mode prompt:
     - System: "You classify listings on an international-development job board. Return JSON `{ "type": "job" | "opportunity", "confidence": 0..1, "reason": string }`. A **job** = paid employment role (any level, FT/PT/contract/consultancy assignment with a defined role title like Officer, Coordinator, Manager, Specialist, Analyst, Advisor, Consultant, Assistant, Director, Lead, Engineer, etc.). An **opportunity** = fellowship, scholarship, bursary, grant funding call, internship, traineeship, PhD/postdoc position, call for proposals/papers/applicants, competition, hackathon, conference, award/prize, residency, or capacity-building programme."
     - User: title + company + first ~400 chars of `clean_description ?? description`.
   - If `type === 'job'` and `confidence >= 0.7`, update `listing_type = 'job'`.
   - Concurrency: process 5 rows in parallel per batch (small, avoids gateway 429).
   - Handle Lovable AI failures gracefully:
     - `429` → back off and stop the batch, return partial summary.
     - `402` → return an explicit "credits exhausted" error to the caller.
   - Query param `?batch=50&max_batches=20` so it can be paginated across calls without timing out.

2. **Deploy** with `supabase--deploy_edge_functions`.

3. **Backfill run** via `supabase--curl_edge_functions` with `x-cron-secret`, repeated until `reclassified == 0` for a batch (currently ~900 rows to scan; at 50/batch that's ~18 calls).

4. **Report back** with counts + a sample of titles moved.

## Deliverables

- `supabase/functions/reclassify-listings/index.ts` (new)
- Function deployed and executed to clear the current backlog
- Short summary of how many rows moved from Opportunities → Jobs
