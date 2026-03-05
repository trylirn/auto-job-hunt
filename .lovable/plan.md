

## Plan: Fix LinkedIn Automation, Add Share Buttons, WhatsApp Banner, and FAQ

### 1. Fix LinkedIn Posting (Root Cause Found)

The database trigger (`notify_new_job_to_socials`) tries to read `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from `vault.decrypted_secrets`, but **neither exists in the vault**. The trigger silently returns without calling the edge function.

**Fix**: Replace the current trigger approach. Instead of using `pg_net` from a DB trigger (which requires vault secrets), use a **database webhook** (pg_net directly with hardcoded project URL) or simpler: store the required URL/key in vault via a migration.

**Migration**: Insert `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` into `vault.secrets` so the existing trigger can find them.

Your Zapier configuration (screenshot) looks correct — `message`, `title`, `apply_url` mapped properly. The issue is purely that the edge function never gets called.

### 2. Add Social Share Buttons on Job Detail Page

Add share buttons below the Apply button on `JobDetail.tsx`:
- **WhatsApp**: `https://wa.me/?text=...`
- **LinkedIn**: `https://www.linkedin.com/sharing/share-offsite/?url=...`
- **Twitter/X**: `https://twitter.com/intent/tweet?text=...&url=...`
- **Copy Link**: Copy job URL to clipboard

Use lucide icons + simple anchor buttons in a row.

### 3. WhatsApp Channel Floating Banner

Create a `WhatsAppBanner` component — a fixed-position bar at the bottom of the screen (or a floating button) visible on all pages:
- Text: "Join Us on WhatsApp"
- Link: `https://whatsapp.com/channel/0029VbBrMe45a23vftujJO22`
- Green WhatsApp-themed styling
- Add it to `App.tsx` so it shows on every page

### 4. FAQ Section on Homepage

Add an FAQ accordion section to `Index.tsx` above the footer using the existing `Accordion` component. Questions like:
- "What is Eplicant?"
- "How often are jobs updated?"
- "Are these jobs verified?"
- "How do I apply?"
- "What's the difference between Jobs and Opportunities?"

### Files to Change

| File | Change |
|------|--------|
| New migration | Insert `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` into vault |
| `src/pages/JobDetail.tsx` | Add share buttons (WhatsApp, LinkedIn, Twitter, Copy) |
| `src/components/WhatsAppBanner.tsx` | New floating "Join us on WhatsApp" banner |
| `src/App.tsx` | Include `WhatsAppBanner` globally |
| `src/pages/Index.tsx` | Add FAQ accordion section before footer |

