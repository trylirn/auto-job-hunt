import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { mirrorUpsert } from "../_shared/eplicant-client.ts";

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

function extractCompany(title: string): string {
  const atMatch = title.match(/\bat\s+(.+)$/i);
  const dashMatch = title.match(/[–—-]\s*(.+)$/);
  if (atMatch) return atMatch[1].trim();
  if (dashMatch) return dashMatch[1].trim();
  return "Unknown";
}

async function fetchYeshubJobs(): Promise<NormalizedJob[]> {
  try {
    const catRes = await fetch("https://yeshub.ng/wp-json/wp/v2/categories?per_page=100");
    const categories: Record<number, string> = {};
    if (catRes.ok) {
      const cats = await catRes.json();
      for (const c of cats) {
        categories[c.id] = (c.name || "").toLowerCase();
      }
    }

    const res = await fetch("https://yeshub.ng/wp-json/wp/v2/posts?per_page=50&_embed");
    if (!res.ok) return [];
    const posts = await res.json();

    return posts.map((p: any) => {
      const catIds: number[] = p.categories || [];
      const catName = catIds.length > 0 ? categories[catIds[0]] || null : null;
      const featuredMedia = p._embedded?.["wp:featuredmedia"]?.[0]?.source_url || null;
      const title = (p.title?.rendered || "").replace(/<[^>]*>/g, "").trim();
      const description = (p.content?.rendered || "").trim();

      return {
        title,
        company: extractCompany(title),
        location: "Nigeria",
        job_type: catName || "opportunity",
        category: catName,
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

async function fetchReliefWebUSJobs(): Promise<NormalizedJob[]> {
  try {
    const res = await fetch("https://api.reliefweb.int/v1/jobs?appname=eplicant.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filter: { field: "country.iso3", value: "USA" },
        fields: {
          include: [
            "title", "body", "date", "source", "country", "city",
            "type", "career_categories", "experience", "theme",
            "url_alias", "how_to_apply", "closing_date",
          ],
        },
        limit: 100,
        sort: ["date.created:desc"],
      }),
    });
    if (!res.ok) {
      console.error("ReliefWeb fetch failed:", res.status);
      return [];
    }
    const json = await res.json();
    const data: any[] = json.data || [];

    return data.map((item: any) => {
      const f = item.fields || {};
      const city = f.city?.[0]?.name || null;
      const location = city ? `${city}, United States` : "United States";
      const company = f.source?.[0]?.name || "Unknown";
      const jobType = f.type?.[0]?.name || "Job";

      const howTo: string = f.how_to_apply || "";
      const urlMatch = howTo.match(/https?:\/\/[^\s<>"')]+/);
      const applyUrl = urlMatch ? urlMatch[0] : (f.url_alias || null);

      const closing = f.closing_date ? String(f.closing_date).slice(0, 10) : null;

      const tags = [
        ...(f.career_categories || []).map((c: any) => c.name),
        ...(f.theme || []).map((t: any) => t.name),
      ].filter(Boolean);

      return {
        title: f.title || "Untitled",
        company,
        location,
        job_type: jobType,
        category: "jobs",
        description: f.body || null,
        url: f.url_alias || `https://reliefweb.int/node/${item.id}`,
        source: "reliefweb",
        external_id: String(item.id),
        posted_at: f.date?.created || null,
        salary: null,
        tags: tags.length ? tags : null,
        company_logo: null,
        is_remote: false,
        listing_type: "job",
        apply_url: applyUrl,
        apply_before_date: closing,
      } as NormalizedJob & { listing_type: string; apply_url: string | null; apply_before_date: string | null };
    });
  } catch (e) {
    console.error("ReliefWeb fetch error:", e);
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
    const catRes = await fetch("https://opportunitiesforyouth.org/wp-json/wp/v2/categories?per_page=100");
    const categories: Record<number, string> = {};
    if (catRes.ok) {
      const cats = await catRes.json();
      for (const c of cats) {
        categories[c.id] = (c.name || "").toLowerCase();
      }
    }

    const allPosts: any[] = [];
    for (let page = 1; page <= 2; page++) {
      const res = await fetch(
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

      return {
        title,
        company: extractCompany(title),
        location: "Global",
        job_type: catName || "opportunity",
        category: catName,
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
    const catRes = await fetch("https://yuthaxis.com/wp-json/wp/v2/categories?per_page=100");
    const categories: Record<number, string> = {};
    if (catRes.ok) {
      const cats = await catRes.json();
      for (const c of cats) {
        categories[c.id] = (c.name || "").toLowerCase();
      }
    }

    const allPosts: any[] = [];
    for (let page = 1; page <= 2; page++) {
      const res = await fetch(
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

      return {
        title,
        company: extractCompany(title),
        location: "Global",
        job_type: catName || "opportunity",
        category: catName,
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
    const res = await fetch("https://remotive.com/api/remote-jobs?limit=50");
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


async function fetchNgoJobsInAfricaJobs(): Promise<NormalizedJob[]> {
  try {
    const catRes = await fetch("https://ngojobsinafrica.com/wp-json/wp/v2/categories?per_page=100");
    const categories: Record<number, string> = {};
    if (catRes.ok) {
      const cats = await catRes.json();
      for (const c of cats) {
        categories[c.id] = (c.name || "").toLowerCase();
      }
    }

    const allPosts: any[] = [];
    for (let page = 1; page <= 2; page++) {
      const res = await fetch(
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

        return {
          title,
          company: extractCompany(title),
          location: "Africa",
          job_type: catName || "opportunity",
          category: catName,
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
    const catRes = await fetch("https://www.globalsouthopportunities.com/wp-json/wp/v2/categories?per_page=100");
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
      const res = await fetch(
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

        return {
          title,
          company: extractCompany(title),
          location: "Global",
          job_type: catName || "opportunity",
          category: catName,
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

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Fetching jobs from YesHub...");
    const yeshubJobs = await fetchYeshubJobs();
    console.log(`Fetched ${yeshubJobs.length} jobs from YesHub`);

    console.log("Fetching jobs from Global South Opportunities...");
    const globalSouthJobs = await fetchGlobalSouthJobs();
    console.log(`Fetched ${globalSouthJobs.length} jobs from Global South`);

    console.log("Fetching jobs from Opportunities for Youth...");
    const ofy4Jobs = await fetchOpportunitiesForYouthJobs();
    console.log(`Fetched ${ofy4Jobs.length} jobs from Opportunities for Youth`);

    console.log("Fetching jobs from YuthAxis...");
    const yuthAxisJobs = await fetchYuthAxisJobs();
    console.log(`Fetched ${yuthAxisJobs.length} jobs from YuthAxis`);

    console.log("Fetching jobs from NGO Jobs in Africa...");
    const ngoJobsAfrica = await fetchNgoJobsInAfricaJobs();
    console.log(`Fetched ${ngoJobsAfrica.length} jobs from NGO Jobs in Africa`);

    console.log("Fetching US jobs from Remotive...");
    const remotiveJobs = await fetchRemotiveUSJobs();
    console.log(`Fetched ${remotiveJobs.length} US jobs from Remotive`);

    console.log("Fetching US jobs from ReliefWeb...");
    const reliefWebJobs = await fetchReliefWebUSJobs();
    console.log(`Fetched ${reliefWebJobs.length} US jobs from ReliefWeb`);

    const allJobs = [...yeshubJobs, ...globalSouthJobs, ...ofy4Jobs, ...yuthAxisJobs, ...ngoJobsAfrica, ...remotiveJobs, ...reliefWebJobs];
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
        fetched: { yeshub: yeshubJobs.length, globalsouth: globalSouthJobs.length, opportunitiesforyouth: ofy4Jobs.length, yuthaxis: yuthAxisJobs.length, ngojobsinafrica: ngoJobsAfrica.length, remotive: remotiveJobs.length, total: allJobs.length },
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
