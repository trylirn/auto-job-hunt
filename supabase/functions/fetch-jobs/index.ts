import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { mirrorUpsert } from "../_shared/eplicant-client.ts";
import { requireCronAuth } from "../_shared/require-cron.ts";

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

function classifyListing(title: string, category: string | null, description = ""): "job" | "opportunity" {
  const normalizedCategory = normalizeCategory(category, title, description);
  const byCategory = categoryToListingType(normalizedCategory);
  if (byCategory) return byCategory;

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

async function fetchRemotiveUSJobs(): Promise<NormalizedJob[]> {
  try {
    const res = await timedFetch("https://remotive.com/api/remote-jobs?limit=50");
    if (!res.ok) return [];
    const json = await res.json();
    const jobs: any[] = json.jobs || [];

    return jobs
      .filter((j: any) => {
        const loc = (j.candidate_required_location || "").toLowerCase();
        return loc.includes("usa") || loc.includes("united states") || loc.includes("u.s.a") || loc.includes("north america") || loc === "worldwide";
      })
      .map((j: any) => ({
        title: j.title || "Untitled",
        company: j.company_name || "Unknown",
        location: "United States",
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
  try {
    const url = "https://api.reliefweb.int/v1/jobs?appname=eplicant.com";
    const body = {
      profile: "full",
      limit: 50,
      sort: ["date.created:desc"],
      filter: { field: "country.name", value: "United States of America" },
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
    ] = await Promise.all([
      fetchYeshubJobs(),
      fetchGlobalSouthJobs(),
      fetchOpportunitiesForYouthJobs(),
      fetchYuthAxisJobs(),
      fetchNgoJobsInAfricaJobs(),
      fetchRemotiveUSJobs(),
      fetchJobsToApplyJobs(),
      fetchReliefWebUSJobs(),
    ]);
    console.log(
      `Fetched source counts: YesHub=${yeshubJobs.length}, GlobalSouth=${globalSouthJobs.length}, OFY=${ofy4Jobs.length}, YuthAxis=${yuthAxisJobs.length}, NGOAfrica=${ngoJobsAfrica.length}, Remotive=${remotiveJobs.length}, JobsToApply=${jobsToApplyJobs.length}, ReliefWeb=${reliefwebJobs.length}`
    );

    const allJobs = [...yeshubJobs, ...globalSouthJobs, ...ofy4Jobs, ...yuthAxisJobs, ...ngoJobsAfrica, ...remotiveJobs, ...jobsToApplyJobs, ...reliefwebJobs];

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
        fetched: { yeshub: yeshubJobs.length, globalsouth: globalSouthJobs.length, opportunitiesforyouth: ofy4Jobs.length, yuthaxis: yuthAxisJobs.length, ngojobsinafrica: ngoJobsAfrica.length, remotive: remotiveJobs.length, jobstoapply: jobsToApplyJobs.length, reliefweb: reliefwebJobs.length, total: allJobs.length },
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
