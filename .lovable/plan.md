

## Plan: Enrich All Share Buttons + Add Cron Schedules

### What's already done
- `fix-company-names` edge function — uses OpenAI, works ✅
- `cleanup-old-listings` edge function — deletes jobs >45 days ✅
- "Copy link" button — rich LinkedIn-style text ✅

### What's missing

#### 1. WhatsApp & X/Twitter share buttons still use simple text
Currently WhatsApp and X/Twitter links use `buildShareText` which produces a one-liner like "🚀 Hiring: Title at Company | Location". Need to switch them to use the rich text format.

- **WhatsApp**: Use `buildRichCopyText` output (WhatsApp supports long text via `wa.me/?text=`)
- **X/Twitter**: Use a condensed version (Twitter has ~280 char limit) — include company, title, salary, location + the URL

**File:** `src/components/ShareButtons.tsx` — Update WhatsApp href to use rich text; update X/Twitter to use a medium-detail format

#### 2. Cron schedules not created
Neither `fix-company-names` nor `cleanup-old-listings` have `pg_cron` schedules. Need to create them via SQL insert (not migration, since it contains project-specific URLs/keys):

- `fix-company-names`: Run every 30 minutes to batch-process "Unknown" companies (10 per run)
- `cleanup-old-listings`: Run daily at 3 AM UTC

Uses `pg_cron` + `pg_net` extensions and the project's anon key for auth.

### Files Changed

| File | Change |
|------|--------|
| `src/components/ShareButtons.tsx` | Use rich text for WhatsApp and condensed rich text for X/Twitter |
| Database (SQL insert) | Create two `pg_cron` schedules for fix-company-names and cleanup-old-listings |

