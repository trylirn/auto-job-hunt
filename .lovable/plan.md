

## Plan: Fix Job Card Stretching

### Problem
The `h-full` class on each Card forces all cards in a grid row to stretch to the height of the tallest card. Cards with shorter titles or no description end up with large empty spaces, which looks poor especially on desktop (3-column grid).

### Fix

**File: `src/components/JobCard.tsx`** (line 24)
- Remove `h-full` from the Card component
- This lets each card be its natural height

**File: `src/pages/Index.tsx`** (lines 91, 98)
- Add `items-start` to the grid containers so cards align to the top instead of stretching: `grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 items-start`

**File: `src/pages/Opportunities.tsx`** (lines 67, 74)
- Same `items-start` addition to the grid containers

### Result
Cards will size to their content and align to the top of each row — no more awkward stretching.

