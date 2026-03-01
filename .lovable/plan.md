
## Job Board Website — Implementation Plan

### 1. Landing Page & Layout
- Clean header with logo, search bar, and filter controls
- Job listings displayed as cards in a responsive grid/list view
- Footer with basic info

### 2. Job Search & Filtering
- Search by keyword, location, and job type (full-time, part-time, remote, contract)
- Category/industry filter
- Sort by date posted or relevance
- Pagination for browsing results

### 3. Job Listing Cards
- Each card shows: job title, company name, location, job type, posted date, and a brief description
- "View Original" button linking to the source posting
- Visual badges for remote, featured, etc.

### 4. Job Detail View
- Full job description, requirements, and company info
- Link to apply on the original source
- Related/similar jobs section

### 5. Backend: Job Fetching (Lovable Cloud + Edge Functions)
- **Public API integration**: Edge function that pulls jobs from free APIs (Remotive, Arbeitnow, etc.)
- **Web scraping**: Edge function using Firecrawl to scrape additional job sites for listings
- **Data normalization**: Combine results from all sources into a unified format
- **Scheduled refresh**: Jobs are fetched/refreshed periodically (via cron) so the board stays current
- **Database**: Supabase table to store aggregated job listings, avoiding duplicates

### 6. Future-Ready: LinkedIn Auto-Posting (deferred)
- Architecture will support adding a LinkedIn posting edge function later when you're ready to set up API access
