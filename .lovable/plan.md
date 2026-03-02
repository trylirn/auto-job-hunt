

## Plan: Build Webhook Dispatcher for Social Media Posting

### What We're Building

A backend function that automatically sends new job listings to your Zapier webhooks whenever they're added to the database. Zapier then posts them to LinkedIn and X/Twitter on your behalf.

### How It Works

```text
New job inserted into database
  └─► Database trigger fires
        └─► Calls "post-to-socials" backend function
              └─► Sends job data to your Zapier webhook URLs
                    ├─► Zapier Zap #1 → Posts to LinkedIn
                    └─► Zapier Zap #2 → Posts to X/Twitter
```

### What I'll Build (Code Changes)

1. **Create `post-to-socials` Edge Function** — receives job data, formats a nice post message, and sends it to your Zapier webhook URLs (stored as secrets)

2. **Create a database trigger** — when a new job is inserted into the `jobs` table AND has a `clean_description` (meaning it's been processed by AI), it calls the Edge Function automatically

3. **Register the function** in config

### What You Need to Do on Zapier (Step-by-Step)

**Before I build anything, here's your Zapier setup — do this first:**

#### Zap #1: LinkedIn Posting

1. Go to [zapier.com](https://zapier.com) and sign up (free tier: 100 tasks/month)
2. Click **"Create a Zap"**
3. **Trigger step**: Search for **"Webhooks by Zapier"** → choose **"Catch Hook"** → click Continue → Zapier gives you a **webhook URL** (copy it — you'll give it to me later)
4. **Action step**: Search for **"LinkedIn"** → choose **"Create Share Update"** → connect your LinkedIn account when prompted
5. Map the fields:
   - **Message**: Click in the field → select `message` from the webhook data (this is the formatted post text I'll send)
   - **Visibility**: Choose "Anyone" (public)
6. Turn the Zap ON

#### Zap #2: X/Twitter Posting

1. Click **"Create a Zap"** again
2. **Trigger step**: **"Webhooks by Zapier"** → **"Catch Hook"** → get the webhook URL (different from the LinkedIn one)
3. **Action step**: Search for **"Twitter"** (or "X") → choose **"Create Tweet"** → connect your X account
4. Map the fields:
   - **Message**: Select `message` from the webhook data
5. Turn the Zap ON

#### After You Create Both Zaps

You'll have **two webhook URLs** that look like:
- `https://hooks.zapier.com/hooks/catch/12345/abcdef/` (LinkedIn)
- `https://hooks.zapier.com/hooks/catch/12345/ghijkl/` (Twitter)

Give me both URLs and I'll store them securely as secrets in your backend.

### Files to Create/Change

- `supabase/functions/post-to-socials/index.ts` — new Edge Function
- `supabase/config.toml` — register the new function
- Database migration — add trigger on `jobs` table to call the function on new inserts

### Post Format

Each social post will look something like:
> 🚀 **New Opportunity**: Senior Developer at Google
> 📍 Lagos, Nigeria | 💼 Remote
> 
> Apply now: https://eplicant.com/job/abc123

### Important Notes

- **Zapier free tier** gives you 100 tasks/month. Each post to each platform = 1 task. So ~50 new jobs/month can be posted to both platforms on the free plan.
- The trigger only fires for **newly inserted** jobs (not updates to existing ones)
- If you later want to add Facebook or WhatsApp, you just create another Zap and give me the webhook URL — no code changes needed

### Next Step

Go create those two Zaps on Zapier and come back with the webhook URLs. Then I'll build everything.

