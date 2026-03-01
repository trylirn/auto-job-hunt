

## Plan: Fix HTML Tags, Smart Apply Button, Mobile Overflow

### Issues from screenshots

1. **JobCard shows raw HTML tags** — Line 78 of `JobCard.tsx` renders `job.description` as plain text inside `{job.description}`. Since descriptions are HTML from YesHub, the tags show literally (`<p>`, `<a href=...>`, etc.).

2. **Apply button doesn't use links from description** — For YesHub jobs, the description often contains application links (Google Forms, etc.). The Apply button currently just scrolls to the description instead of opening the actual application link.

3. **Long URLs overflow on mobile** — URLs in the description (like the Google Forms link) don't wrap and overflow the card.

### What will be done

**1. Fix JobCard description preview** (`src/components/JobCard.tsx`)
- Strip HTML tags from `job.description` before rendering the preview text
- Use a simple regex replace: `description.replace(/<[^>]*>/g, '')` to get plain text for the card preview

**2. Smart Apply button** (`src/pages/JobDetail.tsx`)
- Extract the first `<a href="...">` link from the job description HTML
- If a link is found, the Apply button opens that link directly
- If no link is found, scroll to the description section (where email instructions may be)
- Remove the source-based logic entirely

**3. Fix mobile overflow** (`src/pages/JobDetail.tsx`)
- Add `break-words` / `overflow-wrap: break-word` to the prose container so long URLs wrap properly on mobile
- Add `overflow-hidden` to the card to prevent any horizontal overflow

### Files to change
- `src/components/JobCard.tsx` — strip HTML tags from description preview
- `src/pages/JobDetail.tsx` — extract application URL from description, fix overflow

