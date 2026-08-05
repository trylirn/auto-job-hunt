# Paragraph spacing, email-only applications, and the remote-only pivot

## 1. Job descriptions lose paragraph breaks

When a recruiter types a description into the Post a Job form, it is saved as plain text with newline characters. The job detail page renders descriptions as HTML, and HTML collapses newlines into single spaces — so every paragraph runs together.

Fix: detect plain-text descriptions (no HTML tags present) and convert blank-line-separated blocks into real paragraphs before rendering, and single newlines into line breaks. Descriptions that already contain HTML keep rendering as they do today. Sanitisation stays in place.

Also improve the submit form itself: a short hint under the description field ("Leave a blank line between paragraphs"), and preserve the recruiter's line breaks exactly as typed.

## 2. Applications by email only

The form currently requires an application URL. Change it to a choice:

- Apply by link (current behaviour, URL required)
- Apply by email (an application email address required instead)

When email is chosen, the job stores a `mailto:` application target with a prefilled subject line ("Application - {job title}"), so the Apply button on the job page opens the recruiter's mail client. The detail page shows "Apply by email" with the address instead of "Apply on company site". Validation adapts to whichever mode is selected, and at least one of the two is always required.

## 3. Remote-only pivot

Decisions confirmed: existing non-remote jobs keep showing until they age out (45 days), and the Opportunities section will be phased out gradually and removed once fewer than 20 remain.

### Source fetching
Every source adapter gets a remote gate before insert: a listing is kept only if the source flags it remote, or the title/location/description clearly indicates remote, work-from-home, distributed, or telecommute. Anything hybrid or on-site is dropped. Remotive is already fully remote and passes through untouched; the WordPress-based sources and ReliefWeb are the ones that need the filter. The updater schedule, dedupe, and cleaning pipeline are not otherwise touched.

Also drop the current "United States only" restriction on ReliefWeb/Remotive so remote roles worldwide are captured.

### Messaging and UI
- Homepage headline, subheadline, meta title/description, and Open Graph copy reframed around remote international-development roles.
- Post a Job page states clearly that only remote roles are accepted, with a remote confirmation checkbox that must be ticked.
- The "Remote" work-mode filter becomes redundant once the board is remote-only; it stays for now while legacy non-remote rows age out, then can be removed.
- Location filters and city hub pages get reframed as "remote roles open to candidates in X" rather than "jobs in X".
- Footer, About, and newsletter copy updated to the remote-only positioning.
- Newsletter generation groups remote roles by region eligibility rather than office location.

### Opportunities phase-out
Nothing removed yet. Add a soft notice on the Opportunities page and stop linking it from the primary navigation, keeping it reachable from the footer. When the count drops below 20, the route, sitemap entries, and remaining links get removed in a follow-up change.

## 4. Where to source remote roles

Recommended, all with usable public APIs or feeds:

- **Remotive** (already integrated) — remote-only, broad.
- **Remote OK** — public JSON feed, remote-only.
- **Working Nomads** — remote-only feed.
- **Himalayas** — remote-only, public JSON.
- **ReliefWeb** — keep, filtered to remote/home-based; this is where genuine international-development remote roles live.
- **Idealist and DevelopmentAid** — sector-relevant; only worth adding if a feed is available without scraping.

### Breezy HR
There is no global Breezy job search API. Breezy exposes a public JSON endpoint per company (`https://{company}.breezy.hr/json`), so roles can only be pulled company by company. A practical approach is to maintain a list of development-sector organisations that use Breezy and poll each of their endpoints, filtering for remote roles. That is a separate piece of work; it needs the organisation list first. The same pattern applies to Greenhouse, Lever, and Ashby, which are far more common in this sector and would give better coverage for the same effort.

## Technical notes

- Description rendering: a small helper that checks for HTML tags and, when absent, splits on blank lines into `<p>` blocks before sanitising; used by the job detail page and any description preview.
- Submit form: schema becomes a discriminated choice on apply method; the `apply_url` column stores either the https URL or a `mailto:` link, so no schema change is required.
- Remote filter lives in the shared normalisation step of the fetch function so every adapter inherits it.
- No database migration needed for any part of this.
