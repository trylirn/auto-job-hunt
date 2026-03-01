

## Plan: Fix Horizontal Card Overflow on Mobile

### Root Cause
Two issues are causing cards to stretch horizontally on mobile:
1. The `container` class uses a fixed `padding: "2rem"` (32px per side) regardless of screen size — too much for narrow mobile screens
2. Long text content (titles, descriptions, locations) can push card width beyond its grid column

### Fix

**File: `tailwind.config.ts`** (line 10)
- Change container padding to be responsive: `"1rem"` on mobile, `"2rem"` on larger screens
- This gives more breathing room on narrow viewports

**File: `src/components/JobCard.tsx`**
- Add `overflow-hidden` and `w-full` to the wrapping `Link` element to ensure it respects grid column width
- Add `max-w-full` to the Card so it never exceeds its parent
- Ensure the title uses `break-words` in addition to `line-clamp-2`
- Add `truncate` to the location span to prevent long location strings from overflowing

### Result
Cards will stay within the viewport on all screen sizes. No horizontal scroll.

