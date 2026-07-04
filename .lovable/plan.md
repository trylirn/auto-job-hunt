I found the likely break: the backend and public listings are up, but the scheduled update jobs are now getting `401 unauthorized`. The security hardening made the update functions require a cron secret, but the existing schedules still call them with the public key, so new listings have stopped being imported. The newest inserted listing is from July 3 around 11:02 UTC, which matches what you’re seeing.

Plan:

1. Restore scheduled source updates safely
   - Update the scheduled backend jobs so they send a private backend-only token, not the public key.
   - Keep the protected functions locked down; do not reopen them to anonymous public calls.
   - Fix the affected schedules for: fetching jobs, cleanup/archive, company-name fixing, location fixing, and newsletter generation where needed.

2. Deploy the protected function changes
   - Ensure the functions that are called by schedules accept the intended private token.
   - Deploy the updated functions immediately after code changes.

3. Trigger a fresh import after the fix
   - Run the job-fetching function once after deployment so the site updates immediately instead of waiting for the next hourly schedule.
   - Confirm new rows are inserted and visible publicly.

4. Fix jobs vs opportunities separation
   - Tighten source classification so fellowship/scholarship/grant/program/training/conference/internship items go to Opportunities.
   - Keep actual employment/consultancy/role vacancies on Jobs.
   - Correct existing misclassified rows in the database with a targeted migration.

5. Verify public visibility
   - Confirm the homepage and Opportunities page both return visible listings from the public API.
   - Confirm the latest visible job timestamp is current after the refresh.
   - Check function logs for successful fetch counts and no authorization errors.