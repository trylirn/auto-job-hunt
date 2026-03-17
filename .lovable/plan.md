

## Plan: Dual-Write to Eplicant DB + Replace AI with OpenAI

### Overview

Keep Lovable Cloud as the primary database. After every successful write to Lovable Cloud, also write the same data to your external Eplicant Supabase project. Replace the Lovable AI gateway in `clean-job-descriptions` with direct OpenAI API calls.

### 1. Store Eplicant credentials as secrets

Add 2 new secrets:
- `EPLICANT_SUPABASE_URL` → `https://noplslnmxaixrjyyyazy.supabase.co`
- `EPLICANT_SUPABASE_KEY` → `sb_publishable_QpoH3K24vkEeFgOV1-Q5rA_Nybb968I`
- `OPENAI_API_KEY` → your OpenAI key

### 2. Create a shared dual-write helper

Create `supabase/functions/_shared/eplicant-client.ts` that initializes a second Supabase client pointing at Eplicant. Each edge function that writes data will import this and mirror writes.

### 3. Update `fetch-jobs/index.ts`

After the existing upsert to Lovable Cloud succeeds, also upsert the same batch to the Eplicant client. Failures on Eplicant are logged but don't block the main pipeline.

### 4. Update `clean-job-descriptions/index.ts`

Two changes:
- **Replace AI**: Swap `https://ai.gateway.lovable.dev/v1/chat/completions` with `https://api.openai.com/v1/chat/completions` using `OPENAI_API_KEY`. Use model `gpt-4o-mini` (cost-efficient, supports tool calling).
- **Dual-write**: After updating a job in Lovable Cloud, also update the same job in Eplicant.

### 5. Update `db-backup/index.ts`

Also fetch from Eplicant (or keep as-is since Lovable Cloud is primary).

### 6. Ensure Eplicant DB has matching schema

You'll need to run the same `CREATE TABLE` SQL on your Eplicant project. The backup SQL you already downloaded contains the schema — just run it on Eplicant via the Supabase SQL editor.

### Files Changed

| File | Change |
|------|--------|
| (secrets) | Add `EPLICANT_SUPABASE_URL`, `EPLICANT_SUPABASE_KEY`, `OPENAI_API_KEY` |
| `supabase/functions/_shared/eplicant-client.ts` | New — shared Eplicant Supabase client |
| `supabase/functions/fetch-jobs/index.ts` | Add dual-write after upsert |
| `supabase/functions/clean-job-descriptions/index.ts` | Replace Lovable AI → OpenAI + add dual-write |
| `supabase/functions/db-backup/index.ts` | No change (backs up primary) |

### Security Note

Your OpenAI key and Eplicant credentials will be stored as encrypted backend secrets, never exposed to the frontend.

