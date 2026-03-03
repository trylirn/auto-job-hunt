

## Plan: Multiple Improvements

### 1. Add Logo as Website Logo and Favicon
- Copy the uploaded logo (`Screenshot_2026-03-03_at_11.06.02.png`) to `public/logo.png`
- Update `index.html` to use it as favicon
- Update `Header.tsx` to show the logo image instead of the Briefcase icon

### 2. AI: Extract Company Names Properly
- Update the AI prompt in `clean-job-descriptions/index.ts` to also extract `company_name` from the listing content
- Add `company_name` to the `save_cleaned_job` tool parameters
- Update the DB write to set the `company` column with the AI-detected company name

### 3. AI: Extract Country-Only Locations
- Update the AI prompt to instruct it to return **country only** (e.g., "Nigeria", "Kenya", "USA", "Global") instead of city+country
- This makes the Location filter cleaner and country-based
- The `useFilterOptions` hook already pulls distinct locations, so no frontend change needed

### 4. Separate Opportunity Filters from Job Filters
- Create a new `OpportunityFilters` component with category options: Fellowships, Scholarships, Grants, Conferences, Internships (instead of Work Mode: Remote/Hybrid/Physical)
- Update `Opportunities.tsx` to use `OpportunityFilters` instead of `JobFilters`
- Add an `opportunity_category` or reuse `category` column — the AI already classifies these, so update the AI prompt to also extract a sub-category for opportunities
- Update `useJobs` to support an `opportunityCategory` filter parameter

### 5. Fix Zapier Webhook Configuration
- Looking at the screenshots: the Zap is using `Object.to_json(1. Raw Output)` for all fields, which sends the entire raw JSON blob
- The `post-to-socials` Edge Function sends specific named fields: `message`, `title`, `company`, `location`, `job_type`, `listing_type`, `apply_url`
- **Zapier guidance**: In the LinkedIn action step, map fields individually:
  - **Comment** → select `message` (not Raw Output)
  - **Content - Title** → select `title`
  - **Content - Description** → select `message`
  - **Content - URL** → select `apply_url`
- The user needs to first **test the trigger** by sending a sample webhook, then Zapier will show the individual fields to map

### Technical Details

**AI prompt changes** (`clean-job-descriptions/index.ts`):
- Add `company_name` extraction: "Extract the actual hiring company name. Look for 'at [Company]', 'by [Company]', or company mentioned in the description. Do not use the blog/source site name."
- Change location instruction to: "Return ONLY the country name (e.g., 'Nigeria', 'Kenya', 'USA', 'Global'). Do not include cities."
- Add `opportunity_category` extraction with enum: `["fellowship", "scholarship", "grant", "conference", "internship", "other"]`

**New `OpportunityFilters` component**:
- Category dropdown: Fellowship, Scholarship, Grant, Conference, Internship
- Location dropdown (countries, same as jobs)
- Date posted dropdown (same as jobs)
- No "Work mode" filter (irrelevant for opportunities)

**`useJobs` hook update**:
- Add `opportunityCategory` parameter that filters on the `category` column

**Zapier fix — user instructions to provide after implementation**:
- Send a test webhook first so Zapier can see the individual fields
- Then re-map the LinkedIn fields to use `message`, `title`, `apply_url` individually instead of `Raw Output`

### Files to Change
- `public/logo.png` — copy uploaded logo
- `index.html` — favicon reference
- `src/components/Header.tsx` — use logo image
- `supabase/functions/clean-job-descriptions/index.ts` — AI prompt updates (company, country-only location, opportunity category)
- `src/components/OpportunityFilters.tsx` — new component
- `src/pages/Opportunities.tsx` — use new filters
- `src/hooks/useJobs.ts` — add opportunity category filter
- `src/components/JobFilters.tsx` — minor: ensure it's Jobs-only context

