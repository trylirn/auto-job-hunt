

## Plan: 2 Changes

### 1. Similar Jobs Recommendations on Job Detail Page

Add a "Similar Jobs" section at the bottom of the job detail page that shows 4-6 related jobs.

**Approach:**
- Add a `useSimilarJobs(jobId, jobType, location, tags)` hook in `useJobs.ts` that queries jobs with matching `job_type` or `location`, excluding the current job, limited to 6 results
- Add a `SimilarJobs` component that renders a horizontal grid of compact job cards
- Render it below the Apply/Share section in `JobDetail.tsx`

**Files:**
| File | Change |
|------|--------|
| `src/hooks/useJobs.ts` | Add `useSimilarJobs()` hook |
| `src/components/SimilarJobs.tsx` | New component — grid of clickable job cards |
| `src/pages/JobDetail.tsx` | Import and render `SimilarJobs` below the main card |

### 2. Replace All Remaining Non-Eplicant Branding

The `og:image` and `twitter:image` across all pages still point to a Lovable-generated screenshot URL (`pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/...lovable.app...`). The `index.html` canonical and og:url still use `auto-job-hunt.lovable.app`.

**Fix:**
- Change `og:image` / `twitter:image` everywhere to use the Eplicant logo: `https://eplicant.com/logo.png`
- Fix `index.html` canonical and og:url to `https://eplicant.com/`

**Files:**
| File | Change |
|------|--------|
| `index.html` | canonical, og:url, og:image, twitter:image → eplicant.com |
| `src/pages/JobDetail.tsx` | og:image → eplicant.com/logo.png |
| `src/pages/Index.tsx` | og:image, twitter:image → eplicant.com/logo.png |
| `src/pages/Opportunities.tsx` | og:image, twitter:image → eplicant.com/logo.png |

