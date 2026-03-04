## Plan: Share Text Enhancement, Dynamic Country Filters, WhatsApp Float Button

### 1. Enhance Share Text with Job Summary

Update `ShareButtons` to accept additional props (`location`, `jobType`, `salary`) and build a richer share message:

- **Format**: `"🚀 Hiring: {title} at {company} | {location} | {jobType}\n\nApply here: {jobUrl}"`
- WhatsApp and Twitter will use this richer text; LinkedIn only supports URL sharing (no custom text)
- Copy link will copy the full summary text + URL instead of just the URL
- Also the website [Eplicant.com](http://Eplicant.com) not [https://auto-job-hunt.lovable.app](https://auto-job-hunt.lovable.app/job/b71a2d49-2dee-45d9-ae24-b4672426ed7e) . I want the Share buttons to carry [eplicant.com](http://eplicant.com) instead of the lovable domain.

### 2. Dynamic Country Filter (from actual DB data)

Replace the hardcoded `COUNTRIES` array in both `JobFilters` and `OpportunityFilters` with data fetched from the database using the existing `useFilterOptions` hook:

- Update `useFilterOptions` to return distinct locations from jobs, filtered by `listing_type` (job vs opportunity)
- Both filter components will receive `availableLocations` as a prop and render only countries that have actual listings
- The AI already extracts country-only locations — this just surfaces what's in the DB

### 3. WhatsApp Floating Button (Bottom-Right)

Replace the full-width bottom banner with a floating circular button in the bottom-right corner:

- Green circle with WhatsApp icon
- Tooltip on hover: "Join us on WhatsApp for instant job alerts"
- Dismissible (X button appears on hover)
- Stays fixed at bottom-right on all pages

### Files to Change


| File                                    | Change                                               |
| --------------------------------------- | ---------------------------------------------------- |
| `src/components/ShareButtons.tsx`       | Add richer share text with job summary               |
| `src/pages/JobDetail.tsx`               | Pass additional props to ShareButtons                |
| `src/components/WhatsAppBanner.tsx`     | Convert to floating circular button                  |
| `src/components/JobFilters.tsx`         | Accept dynamic locations prop, remove hardcoded list |
| `src/components/OpportunityFilters.tsx` | Accept dynamic locations prop, remove hardcoded list |
| `src/hooks/useFilterOptions.ts`         | Fetch distinct locations split by listing_type       |
| `src/pages/Index.tsx`                   | Pass locations to JobFilters                         |
| `src/pages/Opportunities.tsx`           | Pass locations to OpportunityFilters                 |
