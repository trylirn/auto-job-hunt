import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { mirrorUpsert } from "../_shared/eplicant-client.ts";
import { requireCronAuth } from "../_shared/require-cron.ts";
import {
  GREENHOUSE_COMPANIES,
  LEVER_COMPANIES,
  ASHBY_COMPANIES,
  BREEZY_COMPANIES,
} from "./ats-companies.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NormalizedJob {
  title: string;
  company: string;
  location: string | null;
  job_type: string | null;
  category: string | null;
  listing_type?: string | null;
  description: string | null;
  url: string;
  source: string;
  external_id: string;
  posted_at: string | null;
  salary: string | null;
  tags: string[] | null;
  company_logo: string | null;
  is_remote: boolean;
}

async function timedFetch(input: string | URL, init: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

const OPPORTUNITY_CATEGORIES = new Set([
  "fellowship",
  "scholarship",
  "funding",
  "internships",
  "internship",
  "grant",
  "grants",
  "conference",
  "training",
  "trainings",
  "award",
  "awards",
  "competition",
  "competitions",
  "program",
  "programme",
  "course",
  "short course",
  "opportunity",
]);

const JOB_CATEGORIES = new Set([
  "jobs",
  "job",
  "vacancy",
  "vacancies",
  "consultancy",
  "consultant",
  "remote jobs",
  "ngo",
  "government",
  "education",
  "private sector",
]);

const OPPORTUNITY_KEYWORDS = [
  /\bfellowship\b/i,
  /\bscholarship\b/i,
  /\bgrant\b/i,
  /\bfunding\b/i,
  /\baward\b/i,
  /\bconference\b/i,
  /\btraining\b/i,
  /\bbootcamp\b/i,
  /\bshort course\b/i,
  /\bcompetition\b/i,
  /\bchallenge\b/i,
  /\baccelerator\b/i,
  /\bincubator\b/i,
  /\bmentorship\b/i,
  /\bvolunteer programme\b/i,
  /\bvolunteer program\b/i,
  /\bphd\b/i,
  /\bpostdoctoral\b/i,
  /\binternship\b/i,
];

const JOB_KEYWORDS = [
  /\bjob\b/i,
  /\bjobs\b/i,
  /\bvacancy\b/i,
  /\bvacancies\b/i,
  /\bhiring\b/i,
  /\brecruit(?:ing|ment)?\b/i,
  /\bconsultant\b/i,
  /\bconsultancy\b/i,
  /\bofficer\b/i,
  /\bmanager\b/i,
  /\bspecialist\b/i,
  /\bcoordinator\b/i,
  /\bdirector\b/i,
  /\bassistant\b/i,
  /\banalyst\b/i,
  /\baccountant\b/i,
  /\bengineer\b/i,
  /\blead\b/i,
  /\badvisor\b/i,
];

function categoryToListingType(category: string | null): "job" | "opportunity" | null {
  if (!category) return null;
  const c = category.toLowerCase().trim();
  if (OPPORTUNITY_CATEGORIES.has(c)) return "opportunity";
  if (JOB_CATEGORIES.has(c)) return "job";
  return null;
}

function normalizeCategory(category: string | null, title: string, description = ""): string | null {
  const raw = (category || "").toLowerCase().trim();
  const text = `${title} ${description.replace(/<[^>]*>/g, " ")}`;

  if (/\bfellowship\b/i.test(text)) return "fellowship";
  if (/\bscholarship\b/i.test(text)) return "scholarship";
  if (/\bgrant\b|\bfunding\b/i.test(text)) return "grant";
  if (/\bconference\b/i.test(text)) return "conference";
  if (/\binternship\b/i.test(text)) return "internship";
  if (/\btraining\b|\bbootcamp\b|\bshort course\b|\bcompetition\b|\bchallenge\b|\baccelerator\b|\bincubator\b|\baward\b/i.test(text)) return "opportunity";
  if (OPPORTUNITY_CATEGORIES.has(raw)) return raw;
  if (JOB_CATEGORIES.has(raw) || JOB_KEYWORDS.some((re) => re.test(text))) return "jobs";
  return raw || null;
}

// Strong opportunity signals that must appear in the TITLE (not just description)
// for a listing to be classified as an opportunity. A job description that
// mentions "grants" or "internship program" should not flip a real role like
// "Grants Coordinator" into an opportunity.
const TITLE_OPPORTUNITY_RE =
  /\b(fellowship|fellowships|scholarship|scholarships|bursary|bursaries|prize|prizes|call for (applications|proposals|papers|nominations|abstracts)|grant programme|grant program|funding (opportunity|call|programme|program)|bootcamp|accelerator|incubator|competition|challenge|hackathon|conference|summit|symposium|masterclass|webinar|training programme|training program|short course|phd (student|position|scholarship|programme|program|candidate|studentship)|postdoctoral|post-doctoral|traineeship|internship programme|internship program|open call|applications open|apply now for|scholarships? for|awards? programme|awards? program)\b/i;

// Job role words that, when in the TITLE, mean this is a paid position — even
// if the description mentions grants/fellowships/internships as part of the work.
const TITLE_JOB_ROLE_RE =
  /\b(coordinator|director|manager|specialist|officer|analyst|engineer|assistant|consultant|advisor|adviser|associate|lead|head of|chief|president|vice president|vp|executive|administrator|architect|developer|designer|writer|editor|producer|strategist|planner|supervisor|technician|accountant|auditor|controller|counsel|attorney|lawyer|nurse|physician|therapist|teacher|professor|researcher|scientist|programmer|operator|clerk|receptionist|secretary|treasurer|ambassador|representative|liaison|facilitator|trainer|instructor|mentor|recruiter|specialist|steward|surveyor|inspector|examiner|reviewer|editor-in-chief|deputy)\b/i;

function classifyListing(title: string, category: string | null, description = ""): "job" | "opportunity" {
  // 1. Title-first: explicit opportunity phrasing in the title wins.
  if (TITLE_OPPORTUNITY_RE.test(title)) return "opportunity";

  // 2. Title-first: a clear job role in the title means it's a job, regardless
  //    of description keywords like "grants" or "internship program".
  if (TITLE_JOB_ROLE_RE.test(title)) return "job";

  // 3. Fall back to source-provided category.
  const normalizedCategory = normalizeCategory(category, title, description);
  const byCategory = categoryToListingType(normalizedCategory);
  if (byCategory) return byCategory;

  // 4. Last resort: keyword scoring across title + description.
  const text = `${title} ${description.replace(/<[^>]*>/g, " ")}`;
  const opportunityHits = OPPORTUNITY_KEYWORDS.filter((re) => re.test(text)).length;
  const jobHits = JOB_KEYWORDS.filter((re) => re.test(text)).length;

  if (opportunityHits > 0 && opportunityHits >= jobHits) return "opportunity";
  return "job";
}

function extractCompany(title: string): string {
  const atMatch = title.match(/\bat\s+(.+)$/i);
  const dashMatch = title.match(/[–—-]\s*(.+)$/);
  if (atMatch) return atMatch[1].trim();
  if (dashMatch) return dashMatch[1].trim();
  return "Unknown";
}

async function fetchYeshubJobs(): Promise<NormalizedJob[]> {
  try {
    const catRes = await timedFetch("https://yeshub.ng/wp-json/wp/v2/categories?per_page=100");
    const categories: Record<number, string> = {};
    if (catRes.ok) {
      const cats = await catRes.json();
      for (const c of cats) {
        categories[c.id] = (c.name || "").toLowerCase();
      }
    }

    const res = await timedFetch("https://yeshub.ng/wp-json/wp/v2/posts?per_page=50&_embed");
    if (!res.ok) return [];
    const posts = await res.json();

    return posts.map((p: any) => {
      const catIds: number[] = p.categories || [];
      const catName = catIds.length > 0 ? categories[catIds[0]] || null : null;
      const featuredMedia = p._embedded?.["wp:featuredmedia"]?.[0]?.source_url || null;
      const title = (p.title?.rendered || "").replace(/<[^>]*>/g, "").trim();
      const description = (p.content?.rendered || "").trim();

      const normalizedCategory = normalizeCategory(catName, title, description);

      return {
        title,
        company: extractCompany(title),
        location: "Nigeria",
        job_type: normalizedCategory || "jobs",
        category: normalizedCategory,
        listing_type: classifyListing(title, normalizedCategory, description),
        description,
        url: p.link,
        source: "yeshub",
        external_id: String(p.id),
        posted_at: p.date || null,
        salary: null,
        tags: catIds.map((id: number) => categories[id]).filter(Boolean),
        company_logo: featuredMedia,
        is_remote: false,
      };
    });
  } catch (e) {
    console.error("YesHub fetch error:", e);
    return [];
  }
}

const OPINION_CATEGORY_ID = 2;

const JOBSTOAPPLY_CATEGORY_MAP: Record<number, string> = {
  1528: "jobs",        // Jobs
  1533: "jobs",        // Remote Jobs
  1529: "jobs",        // NGO
  1530: "jobs",        // Government
  1531: "jobs",        // Education
  1532: "jobs",        // Private Sector
  1534: "fellowship",  // Fellowships
  1535: "scholarship", // Scholarships
  1536: "funding",     // Grants
  1523: "funding",     // Awards
  1537: "opportunity", // Trainings
  1: "opportunity",    // Uncategorized
};

const JOBSTOAPPLY_REMOTE_IDS = new Set([1533]);

async function fetchJobsToApplyJobs(): Promise<NormalizedJob[]> {
  try {
    const catRes = await timedFetch("https://jobstoapply.com/wp-json/wp/v2/categories?per_page=100");
    const categories: Record<number, string> = {};
    if (catRes.ok) {
      const cats = await catRes.json();
      for (const c of cats) {
        categories[c.id] = (c.name || "").toLowerCase();
      }
    }

    const allPosts: any[] = [];
    for (let page = 1; page <= 2; page++) {
      const res = await timedFetch(
        `https://jobstoapply.com/wp-json/wp/v2/posts?per_page=50&page=${page}&_embed`
      );
      if (!res.ok) break;
      const posts = await res.json();
      allPosts.push(...posts);
    }

    return allPosts.map((p: any) => {
      const catIds: number[] = p.categories || [];
      let catName: string | null = null;
      for (const id of catIds) {
        if (JOBSTOAPPLY_CATEGORY_MAP[id]) {
          catName = JOBSTOAPPLY_CATEGORY_MAP[id];
          break;
        }
      }
      if (!catName && catIds.length > 0) {
        catName = categories[catIds[0]] || "opportunity";
      }

      const isRemote = catIds.some((id) => JOBSTOAPPLY_REMOTE_IDS.has(id));
      const featuredMedia = p._embedded?.["wp:featuredmedia"]?.[0]?.source_url || null;
      const title = (p.title?.rendered || "").replace(/<[^>]*>/g, "").trim();
      const description = (p.content?.rendered || "").trim();

      const normalizedCategory = normalizeCategory(catName, title, description);

      return {
        title,
        company: extractCompany(title),
        location: "Global",
        job_type: normalizedCategory || "jobs",
        category: normalizedCategory,
        listing_type: classifyListing(title, normalizedCategory, description),
        description,
        url: p.link,
        source: "jobstoapply",
        external_id: String(p.id),
        posted_at: p.date || null,
        salary: null,
        tags: catIds.map((id: number) => categories[id]).filter(Boolean),
        company_logo: featuredMedia,
        is_remote: isRemote,
      };
    });
  } catch (e) {
    console.error("JobsToApply fetch error:", e);
    return [];
  }
}

const GSO_CATEGORY_MAP: Record<number, string> = {
  20: "jobs",
  25: "fellowship",
  18: "scholarship",
  19: "internships",
  26: "funding",
  1: "opportunity",
};

async function fetchOpportunitiesForYouthJobs(): Promise<NormalizedJob[]> {
  try {
    const catRes = await timedFetch("https://opportunitiesforyouth.org/wp-json/wp/v2/categories?per_page=100");
    const categories: Record<number, string> = {};
    if (catRes.ok) {
      const cats = await catRes.json();
      for (const c of cats) {
        categories[c.id] = (c.name || "").toLowerCase();
      }
    }

    const allPosts: any[] = [];
    for (let page = 1; page <= 2; page++) {
      const res = await timedFetch(
        `https://opportunitiesforyouth.org/wp-json/wp/v2/posts?per_page=50&page=${page}&_embed`
      );
      if (!res.ok) break;
      const posts = await res.json();
      allPosts.push(...posts);
    }

    return allPosts.map((p: any) => {
      const catIds: number[] = p.categories || [];
      const catName = catIds.length > 0 ? categories[catIds[0]] || null : null;
      const featuredMedia = p._embedded?.["wp:featuredmedia"]?.[0]?.source_url || null;
      const title = (p.title?.rendered || "").replace(/<[^>]*>/g, "").trim();
      const description = (p.content?.rendered || "").trim();

      const normalizedCategory = normalizeCategory(catName, title, description);

      return {
        title,
        company: extractCompany(title),
        location: "Global",
        job_type: normalizedCategory || "jobs",
        category: normalizedCategory,
        listing_type: classifyListing(title, normalizedCategory, description),
        description,
        url: p.link,
        source: "opportunitiesforyouth",
        external_id: String(p.id),
        posted_at: p.date || null,
        salary: null,
        tags: catIds.map((id: number) => categories[id]).filter(Boolean),
        company_logo: featuredMedia,
        is_remote: false,
      };
    });
  } catch (e) {
    console.error("Opportunities for Youth fetch error:", e);
    return [];
  }
}

const YUTHAXIS_CATEGORY_MAP: Record<number, string> = {
  32: "jobs",
  31: "internships",
  36: "fellowship",
  33: "scholarship",
  38: "funding",
  5527: "jobs",
};

async function fetchYuthAxisJobs(): Promise<NormalizedJob[]> {
  try {
    const catRes = await timedFetch("https://yuthaxis.com/wp-json/wp/v2/categories?per_page=100");
    const categories: Record<number, string> = {};
    if (catRes.ok) {
      const cats = await catRes.json();
      for (const c of cats) {
        categories[c.id] = (c.name || "").toLowerCase();
      }
    }

    const allPosts: any[] = [];
    for (let page = 1; page <= 2; page++) {
      const res = await timedFetch(
        `https://yuthaxis.com/wp-json/wp/v2/posts?per_page=50&page=${page}&_embed`
      );
      if (!res.ok) break;
      const posts = await res.json();
      allPosts.push(...posts);
    }

    return allPosts.map((p: any) => {
      const catIds: number[] = p.categories || [];
      let catName: string | null = null;
      for (const id of catIds) {
        if (YUTHAXIS_CATEGORY_MAP[id]) {
          catName = YUTHAXIS_CATEGORY_MAP[id];
          break;
        }
      }
      if (!catName && catIds.length > 0) {
        catName = categories[catIds[0]] || "opportunity";
      }

      const featuredMedia = p._embedded?.["wp:featuredmedia"]?.[0]?.source_url || null;
      const title = (p.title?.rendered || "").replace(/<[^>]*>/g, "").trim();
      const description = (p.content?.rendered || "").trim();

      const normalizedCategory = normalizeCategory(catName, title, description);

      return {
        title,
        company: extractCompany(title),
        location: "Global",
        job_type: normalizedCategory || "jobs",
        category: normalizedCategory,
        listing_type: classifyListing(title, normalizedCategory, description),
        description,
        url: p.link,
        source: "yuthaxis",
        external_id: String(p.id),
        posted_at: p.date || null,
        salary: null,
        tags: catIds.map((id: number) => categories[id]).filter(Boolean),
        company_logo: featuredMedia,
        is_remote: false,
      };
    });
  } catch (e) {
    console.error("YuthAxis fetch error:", e);
    return [];
  }
}

const NGOJOBS_EXCLUDE_CATEGORIES = new Set([7, 6, 8, 9]);
const NGOJOBS_CATEGORY_MAP: Record<number, string> = {
  159: "scholarship",
  1: "opportunity",
};

async function fetchRemotiveJobs(): Promise<NormalizedJob[]> {
  try {
    const res = await timedFetch("https://remotive.com/api/remote-jobs?limit=200");
    if (!res.ok) return [];
    const json = await res.json();
    const jobs: any[] = json.jobs || [];

    return jobs.map((j: any) => ({
        title: j.title || "Untitled",
        company: j.company_name || "Unknown",
        location: j.candidate_required_location || "Remote",
        job_type: "Remote",
        category: (j.category || "jobs").toLowerCase(),
        listing_type: "job",
        description: j.description || null,
        url: j.url,
        source: "remotive",
        external_id: String(j.id),
        posted_at: j.publication_date || null,
        salary: j.salary || null,
        tags: j.tags || null,
        company_logo: j.company_logo || null,
        is_remote: true,
      }));
  } catch (e) {
    console.error("Remotive fetch error:", e);
    return [];
  }
}

async function fetchReliefWebUSJobs(): Promise<NormalizedJob[]> {
  // ReliefWeb deprecated complex GET query-string filters on /v1/jobs (returns
  // 410 Gone). The v1 API is still live but filters/sort/limit must be POSTed
  // as a JSON body. Docs: https://apidoc.reliefweb.int/
  // ReliefWeb v1 was decommissioned (410 Gone). v2 requires an "approved
  // appname" registered at https://apidoc.reliefweb.int/parameters#appname
  // and returns 403 otherwise. Set RELIEFWEB_APPNAME as a Supabase secret;
  // if unset, we skip the source cleanly.
  try {
    const appname = Deno.env.get("RELIEFWEB_APPNAME");
    if (!appname) {
      console.warn("ReliefWeb skipped: RELIEFWEB_APPNAME secret not set");
      return [];
    }
    const url = `https://api.reliefweb.int/v2/jobs?appname=${encodeURIComponent(appname)}`;
    const body = {
      profile: "full",
      limit: 100,
      sort: ["date.created:desc"],
      // Worldwide now — the remote-only gate below decides what we keep.
      query: { value: "remote OR telecommute OR \"home-based\"", operator: "OR" },
    };
    const res = await timedFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error("ReliefWeb HTTP", res.status);
      return [];
    }
    const json = await res.json();
    const items: any[] = json.data || [];
    return items.map((it: any) => {
      const f = it.fields || {};
      const country = Array.isArray(f.country) ? f.country[0]?.name : null;
      const city = Array.isArray(f.city) ? f.city[0]?.name : null;
      const location = [city, country || "United States"].filter(Boolean).join(", ");
      const orgs = Array.isArray(f.source) ? f.source.map((s: any) => s.name).filter(Boolean) : [];
      const careerCats = Array.isArray(f.career_categories)
        ? f.career_categories.map((c: any) => c.name).filter(Boolean)
        : [];
      const themes = Array.isArray(f.theme) ? f.theme.map((t: any) => t.name).filter(Boolean) : [];
      const applyUrl = f.how_to_apply || null;
      const bodyHtml = f["body-html"] || (f.body ? `<p>${String(f.body).replace(/\n/g, "</p><p>")}</p>` : "");
      const desc = applyUrl ? `${bodyHtml}\n<p><a href="${applyUrl}">Apply here</a></p>` : bodyHtml;
      return {
        title: f.title || "Untitled",
        company: orgs[0] || "Unknown",
        location,
        job_type: "jobs",
        category: "jobs",
        listing_type: "job",
        description: desc || null,
        url: f.url_alias || f.url || `https://reliefweb.int/node/${it.id}`,
        source: "reliefweb",
        external_id: String(it.id),
        posted_at: f.date?.created || null,
        salary: null,
        tags: [...careerCats, ...themes].slice(0, 8),
        company_logo: null,
        is_remote: false,
      } as NormalizedJob;
    });
  } catch (e) {
    console.error("ReliefWeb fetch error:", e);
    return [];
  }
}



async function fetchNgoJobsInAfricaJobs(): Promise<NormalizedJob[]> {
  try {
    const catRes = await timedFetch("https://ngojobsinafrica.com/wp-json/wp/v2/categories?per_page=100");
    const categories: Record<number, string> = {};
    if (catRes.ok) {
      const cats = await catRes.json();
      for (const c of cats) {
        categories[c.id] = (c.name || "").toLowerCase();
      }
    }

    const allPosts: any[] = [];
    for (let page = 1; page <= 2; page++) {
      const res = await timedFetch(
        `https://ngojobsinafrica.com/wp-json/wp/v2/posts?per_page=50&page=${page}&_embed`
      );
      if (!res.ok) break;
      const posts = await res.json();
      allPosts.push(...posts);
    }

    return allPosts
      .filter((p: any) => {
        const catIds: number[] = p.categories || [];
        return !catIds.some((id: number) => NGOJOBS_EXCLUDE_CATEGORIES.has(id));
      })
      .map((p: any) => {
        const catIds: number[] = p.categories || [];
        let catName: string | null = null;
        for (const id of catIds) {
          if (NGOJOBS_CATEGORY_MAP[id]) {
            catName = NGOJOBS_CATEGORY_MAP[id];
            break;
          }
        }
        if (!catName && catIds.length > 0) {
          catName = categories[catIds[0]] || "opportunity";
        }

        const featuredMedia = p._embedded?.["wp:featuredmedia"]?.[0]?.source_url || null;
        const title = (p.title?.rendered || "").replace(/<[^>]*>/g, "").trim();
        const description = (p.content?.rendered || "").trim();

        const normalizedCategory = normalizeCategory(catName, title, description);

        return {
          title,
          company: extractCompany(title),
          location: "Africa",
          job_type: normalizedCategory || "jobs",
          category: normalizedCategory,
          listing_type: classifyListing(title, normalizedCategory, description),
          description,
          url: p.link,
          source: "ngojobsinafrica",
          external_id: String(p.id),
          posted_at: p.date || null,
          salary: null,
          tags: catIds.map((id: number) => categories[id]).filter(Boolean),
          company_logo: featuredMedia,
          is_remote: false,
        };
      });
  } catch (e) {
    console.error("NGO Jobs in Africa fetch error:", e);
    return [];
  }
}

async function fetchGlobalSouthJobs(): Promise<NormalizedJob[]> {
  try {
    // Fetch categories for tag mapping
    const catRes = await timedFetch("https://www.globalsouthopportunities.com/wp-json/wp/v2/categories?per_page=100");
    const categories: Record<number, string> = {};
    if (catRes.ok) {
      const cats = await catRes.json();
      for (const c of cats) {
        categories[c.id] = (c.name || "").toLowerCase();
      }
    }

    const allPosts: any[] = [];
    // Fetch 2 pages of 50 for good volume
    for (let page = 1; page <= 2; page++) {
      const res = await timedFetch(
        `https://www.globalsouthopportunities.com/wp-json/wp/v2/posts?per_page=50&page=${page}&_embed`
      );
      if (!res.ok) break;
      const posts = await res.json();
      allPosts.push(...posts);
    }

    return allPosts
      .filter((p: any) => {
        const catIds: number[] = p.categories || [];
        return !catIds.includes(OPINION_CATEGORY_ID);
      })
      .map((p: any) => {
        const catIds: number[] = p.categories || [];
        // Map to our normalized category using known IDs
        let catName: string | null = null;
        for (const id of catIds) {
          if (GSO_CATEGORY_MAP[id]) {
            catName = GSO_CATEGORY_MAP[id];
            break;
          }
        }
        if (!catName && catIds.length > 0) {
          catName = categories[catIds[0]] || "opportunity";
        }

        const featuredMedia = p._embedded?.["wp:featuredmedia"]?.[0]?.source_url || null;
        const title = (p.title?.rendered || "").replace(/<[^>]*>/g, "").trim();
        const description = (p.content?.rendered || "").trim();

        const normalizedCategory = normalizeCategory(catName, title, description);

        return {
          title,
          company: extractCompany(title),
          location: "Global",
          job_type: normalizedCategory || "jobs",
          category: normalizedCategory,
          listing_type: classifyListing(title, normalizedCategory, description),
          description,
          url: p.link,
          source: "globalsouth",
          external_id: String(p.id),
          posted_at: p.date || null,
          salary: null,
          tags: catIds.map((id: number) => categories[id]).filter(Boolean),
          company_logo: featuredMedia,
          is_remote: false,
        };
      });
  } catch (e) {
    console.error("Global South fetch error:", e);
    return [];
  }
}


// ---------------------------------------------------------------------------
// Remote-first job feeds
// ---------------------------------------------------------------------------

async function fetchWorkingNomadsJobs(): Promise<NormalizedJob[]> {
  try {
    const res = await timedFetch("https://www.workingnomads.com/api/exposed_jobs/", {}, 12000);
    if (!res.ok) {
      console.error(`WorkingNomads ${res.status}`);
      return [];
    }
    const jobs: any[] = await res.json();
    return jobs.slice(0, 300).map((j: any) => ({
      title: j.title || "Untitled",
      company: j.company_name || "Unknown",
      location: j.location || "Remote",
      job_type: "Remote",
      category: (j.category_name || "jobs").toLowerCase(),
      listing_type: "job",
      description: j.description || null,
      url: j.url,
      source: "workingnomads",
      external_id: String(j.id ?? j.slug ?? j.url),
      posted_at: j.pub_date || null,
      salary: null,
      tags: j.tags ? String(j.tags).split(",").map((t: string) => t.trim()).filter(Boolean) : null,
      company_logo: null,
      is_remote: true,
    }));
  } catch (e) {
    console.error("WorkingNomads fetch error:", e);
    return [];
  }
}

async function fetchHimalayasJobs(): Promise<NormalizedJob[]> {
  try {
    const res = await timedFetch("https://himalayas.app/jobs/api?limit=100", {}, 12000);
    if (!res.ok) {
      console.error(`Himalayas ${res.status}`);
      return [];
    }
    const json = await res.json();
    const jobs: any[] = json.jobs || json.data || [];
    return jobs.map((j: any) => ({
      title: j.title || "Untitled",
      company: j.companyName || j.company || "Unknown",
      location: Array.isArray(j.locationRestrictions) && j.locationRestrictions.length
        ? j.locationRestrictions.join(", ")
        : "Remote",
      job_type: "Remote",
      category: (Array.isArray(j.categories) ? j.categories[0] : j.category) || "jobs",
      listing_type: "job",
      description: j.description || j.excerpt || null,
      url: j.applicationLink || j.guid || j.url,
      source: "himalayas",
      external_id: String(j.guid ?? j.id ?? j.applicationLink),
      posted_at: j.pubDate ? new Date(Number(j.pubDate) * 1000).toISOString() : null,
      salary: j.minSalary && j.maxSalary ? `${j.minSalary}-${j.maxSalary} ${j.salaryCurrency ?? ""}`.trim() : null,
      tags: Array.isArray(j.categories) ? j.categories : null,
      company_logo: j.companyLogo || null,
      is_remote: true,
    }));
  } catch (e) {
    console.error("Himalayas fetch error:", e);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Curated ATS company boards (Greenhouse, Lever, Ashby, Breezy HR)
// ---------------------------------------------------------------------------

/** Run tasks with bounded concurrency so 300 board calls never stall a cron run. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R[]>): Promise<R[]> {
  const out: R[] = [];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor++];
      try {
        out.push(...(await fn(item)));
      } catch (_e) {
        // individual board failures are logged inside fn
      }
    }
  });
  await Promise.all(workers);
  return out;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchGreenhouseBoards(): Promise<NormalizedJob[]> {
  return mapLimit(GREENHOUSE_COMPANIES, 8, async (c) => {
    try {
      const res = await timedFetch(
        `https://boards-api.greenhouse.io/v1/boards/${c.slug}/jobs?content=true`,
        {},
        8000
      );
      if (!res.ok) {
        console.log(`Greenhouse skip ${c.slug} (${res.status})`);
        return [];
      }
      const json = await res.json();
      return (json.jobs || []).map((j: any) => ({
        title: j.title || "Untitled",
        company: c.name,
        location: j.location?.name || "Remote",
        job_type: null,
        category: "jobs",
        listing_type: "job",
        description: j.content ? stripHtml(j.content) : null,
        url: j.absolute_url,
        source: "greenhouse",
        external_id: `${c.slug}-${j.id}`,
        posted_at: j.updated_at || null,
        salary: null,
        tags: null,
        company_logo: null,
        is_remote: false,
      }));
    } catch (e) {
      console.log(`Greenhouse error ${c.slug}: ${(e as Error).message}`);
      return [];
    }
  });
}

async function fetchLeverBoards(): Promise<NormalizedJob[]> {
  return mapLimit(LEVER_COMPANIES, 8, async (c) => {
    try {
      const res = await timedFetch(
        `https://api.lever.co/v0/postings/${c.slug}?mode=json`,
        {},
        8000
      );
      if (!res.ok) {
        console.log(`Lever skip ${c.slug} (${res.status})`);
        return [];
      }
      const postings = await res.json();
      if (!Array.isArray(postings)) return [];
      return postings.map((j: any) => ({
        title: j.text || "Untitled",
        company: c.name,
        location: j.categories?.location || "Remote",
        job_type: j.categories?.commitment || null,
        category: "jobs",
        listing_type: "job",
        description: j.descriptionPlain || (j.description ? stripHtml(j.description) : null),
        url: j.hostedUrl || j.applyUrl,
        source: "lever",
        external_id: `${c.slug}-${j.id}`,
        posted_at: j.createdAt ? new Date(j.createdAt).toISOString() : null,
        salary: null,
        tags: j.categories?.team ? [j.categories.team] : null,
        company_logo: null,
        is_remote: /remote/i.test(j.workplaceType || j.categories?.location || ""),
      }));
    } catch (e) {
      console.log(`Lever error ${c.slug}: ${(e as Error).message}`);
      return [];
    }
  });
}

async function fetchAshbyBoards(): Promise<NormalizedJob[]> {
  return mapLimit(ASHBY_COMPANIES, 8, async (c) => {
    try {
      const res = await timedFetch(
        `https://api.ashbyhq.com/posting-api/job-board/${c.slug}?includeCompensation=true`,
        {},
        8000
      );
      if (!res.ok) {
        console.log(`Ashby skip ${c.slug} (${res.status})`);
        return [];
      }
      const json = await res.json();
      return (json.jobs || []).map((j: any) => ({
        title: j.title || "Untitled",
        company: c.name,
        location: j.location || "Remote",
        job_type: j.employmentType || null,
        category: "jobs",
        listing_type: "job",
        description: j.descriptionPlain || (j.descriptionHtml ? stripHtml(j.descriptionHtml) : null),
        url: j.applyUrl || j.jobUrl,
        source: "ashby",
        external_id: `${c.slug}-${j.id}`,
        posted_at: j.publishedAt || null,
        salary: j.compensation?.compensationTierSummary || null,
        tags: j.department ? [j.department] : null,
        company_logo: null,
        is_remote: j.isRemote === true,
      }));
    } catch (e) {
      console.log(`Ashby error ${c.slug}: ${(e as Error).message}`);
      return [];
    }
  });
}

async function fetchBreezyBoards(): Promise<NormalizedJob[]> {
  return mapLimit(BREEZY_COMPANIES, 8, async (c) => {
    try {
      const res = await timedFetch(`https://${c.slug}.breezy.hr/json`, {}, 8000);
      if (!res.ok) {
        console.log(`Breezy skip ${c.slug} (${res.status})`);
        return [];
      }
      const postings = await res.json();
      if (!Array.isArray(postings)) return [];
      return postings.map((j: any) => {
        const loc = [j.location?.city, j.location?.country?.name]
          .filter(Boolean)
          .join(", ");
        return {
          title: j.name || j.position || "Untitled",
          company: c.name,
          location: j.location?.is_remote ? "Remote" : loc || "Remote",
          job_type: j.type?.name || null,
          category: "jobs",
          listing_type: "job",
          description: j.description ? stripHtml(j.description) : null,
          url: j.url,
          source: "breezy",
          external_id: `${c.slug}-${j.id}`,
          posted_at: j.published_date || j.creation_date || null,
          salary: null,
          tags: j.department ? [j.department] : null,
          company_logo: null,
          is_remote: j.location?.is_remote === true,
        };
      });
    } catch (e) {
      console.log(`Breezy error ${c.slug}: ${(e as Error).message}`);
      return [];
    }
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  const authFail = await requireCronAuth(req);
  if (authFail) return authFail;


  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Fetching jobs from all sources...");
    const [
      yeshubJobs,
      globalSouthJobs,
      ofy4Jobs,
      yuthAxisJobs,
      ngoJobsAfrica,
      remotiveJobs,
      jobsToApplyJobs,
      reliefwebJobs,
      workingNomadsJobs,
      himalayasJobs,
      greenhouseJobs,
      leverJobs,
      ashbyJobs,
      breezyJobs,
    ] = await Promise.all([
      fetchYeshubJobs(),
      fetchGlobalSouthJobs(),
      fetchOpportunitiesForYouthJobs(),
      fetchYuthAxisJobs(),
      fetchNgoJobsInAfricaJobs(),
      fetchRemotiveJobs(),
      fetchJobsToApplyJobs(),
      fetchReliefWebUSJobs(),
      fetchWorkingNomadsJobs(),
      fetchHimalayasJobs(),
      fetchGreenhouseBoards(),
      fetchLeverBoards(),
      fetchAshbyBoards(),
      fetchBreezyBoards(),
    ]);
    console.log(
      `Fetched source counts: YesHub=${yeshubJobs.length}, GlobalSouth=${globalSouthJobs.length}, OFY=${ofy4Jobs.length}, YuthAxis=${yuthAxisJobs.length}, NGOAfrica=${ngoJobsAfrica.length}, Remotive=${remotiveJobs.length}, JobsToApply=${jobsToApplyJobs.length}, ReliefWeb=${reliefwebJobs.length}, WorkingNomads=${workingNomadsJobs.length}, Himalayas=${himalayasJobs.length}, Greenhouse=${greenhouseJobs.length}, Lever=${leverJobs.length}, Ashby=${ashbyJobs.length}, Breezy=${breezyJobs.length}`
    );

    const fetchedJobs = [...yeshubJobs, ...globalSouthJobs, ...ofy4Jobs, ...yuthAxisJobs, ...ngoJobsAfrica, ...remotiveJobs, ...jobsToApplyJobs, ...reliefwebJobs, ...workingNomadsJobs, ...himalayasJobs, ...greenhouseJobs, ...leverJobs, ...ashbyJobs, ...breezyJobs];

    // Remote-only board: keep a listing only when it is explicitly flagged
    // remote or clearly described as remote/home-based in its own text.
    const REMOTE_RE = /\b(remote|work from home|work-from-home|home[- ]based|telecommut\w*|distributed team|anywhere in the world|fully remote|virtual position)\b/i;
    const NOT_REMOTE_RE = /\b(hybrid|on[- ]?site|onsite|in[- ]person|must relocate|relocation required)\b/i;

    const allJobs = fetchedJobs.filter((j: any) => {
      const haystack = `${j.title ?? ""} ${j.location ?? ""} ${j.job_type ?? ""} ${j.description ?? ""}`;
      if (NOT_REMOTE_RE.test(`${j.title ?? ""} ${j.location ?? ""}`)) return false;
      return j.is_remote === true || REMOTE_RE.test(haystack);
    }).map((j: any) => ({ ...j, is_remote: true, listing_type: "job" }));

    console.log(`Remote-only filter kept ${allJobs.length} of ${fetchedJobs.length} listings`);

    let inserted = 0;
    let skipped = 0;

    const batchSize = 50;
    for (let i = 0; i < allJobs.length; i += batchSize) {
      const batch = allJobs.slice(i, i + batchSize);
      const { error } = await supabase
        .from("jobs")
        .upsert(batch, { onConflict: "source,external_id", ignoreDuplicates: true });

      if (error) {
        console.error("Upsert error:", error);
        skipped += batch.length;
      } else {
        inserted += batch.length;
        // Mirror to Eplicant (fire-and-forget, non-blocking)
        mirrorUpsert("jobs", batch as unknown as Record<string, unknown>[], "source,external_id").catch(e =>
          console.error("Eplicant mirror error:", e)
        );
      }
    }

    console.log(`Done: ${inserted} processed, ${skipped} skipped`);

    // Fire-and-forget: trigger AI cleanup without awaiting
    fetch(
      `${supabaseUrl}/functions/v1/clean-job-descriptions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
      }
    ).then(r => r.json().then(d => console.log("AI cleanup result:", d)))
     .catch(e => console.error("AI cleanup trigger error:", e));

    // Fire-and-forget: trigger AI title + company extraction for new jobs
    fetch(
      `${supabaseUrl}/functions/v1/fix-company-names`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode: "all" }),
      }
    ).then(r => r.json().then(d => console.log("AI title/company fix result:", d)))
     .catch(e => console.error("AI title/company fix trigger error:", e));

    return new Response(
      JSON.stringify({
        success: true,
        fetched: { yeshub: yeshubJobs.length, globalsouth: globalSouthJobs.length, opportunitiesforyouth: ofy4Jobs.length, yuthaxis: yuthAxisJobs.length, ngojobsinafrica: ngoJobsAfrica.length, remotive: remotiveJobs.length, jobstoapply: jobsToApplyJobs.length, reliefweb: reliefwebJobs.length, workingnomads: workingNomadsJobs.length, himalayas: himalayasJobs.length, greenhouse: greenhouseJobs.length, lever: leverJobs.length, ashby: ashbyJobs.length, breezy: breezyJobs.length, total: allJobs.length },
        inserted,
        skipped,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
