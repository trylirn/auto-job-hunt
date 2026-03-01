

## Plan: Fix Description Rendering + Improve AI Structuring Prompt

### Root Cause

The `@tailwindcss/typography` plugin is installed as a dependency but **not added to the plugins array** in `tailwind.config.ts`. This means all `prose` classes on the job detail page have zero effect — headings, lists, and paragraphs all render as unstyled plain text, exactly as shown in the screenshot.

### What will be done

**1. Enable the typography plugin** (`tailwind.config.ts`)
- Add `require("@tailwindcss/typography")` to the plugins array so `prose` classes actually work
- This single fix will make the already-clean HTML (with `<h2>`, `<h3>`, `<ul>`, `<li>` tags) render properly with visual hierarchy

**2. Improve the AI cleanup prompt for better structuring** (`supabase/functions/clean-job-descriptions/index.ts`)
- Update the system prompt to explicitly instruct the AI to organize content into clear sections: Role Summary, Key Responsibilities, Qualifications/Requirements, Location & Salary (if available), How to Apply, Deadline
- This applies to both jobs and opportunities (fellowships, scholarships, etc.)
- Force the AI to use consistent heading levels (`<h3>`) and proper `<ul>`/`<ol>` lists
- Reset existing `clean_description` values so all jobs get re-processed with the improved prompt

**3. Re-process all jobs with the new prompt** (database migration)
- Set `clean_description = NULL` for all jobs so the edge function re-cleans them with the improved, structured prompt

**4. Mobile polish**
- Reduce container padding on mobile in `JobDetail.tsx` (already using `px-4`, looks fine)
- Ensure the prose container has proper mobile font sizing with `prose-sm`

### Files to change
- `tailwind.config.ts` — add typography plugin (the critical fix)
- `supabase/functions/clean-job-descriptions/index.ts` — improved structuring prompt
- **New migration** — reset `clean_description` to null for re-processing

