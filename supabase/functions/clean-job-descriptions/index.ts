import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { mirrorUpdate } from "../_shared/eplicant-client.ts";
import { requireCronAuth } from "../_shared/require-cron.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You clean and structure remote job listings for a remote-only job board. You will be given the raw text or HTML of a job posting sourced from a company career page or applicant tracking system (Greenhouse, Lever, Ashby, Breezy). Return clean, well-structured HTML containing only the essential information.

RULES:
- Stay faithful to the source. Reorganise, tidy and lightly rephrase for readability, but NEVER invent responsibilities, requirements, benefits, salaries, locations or deadlines that are not in the source.
- Remove boilerplate noise: cookie notices, navigation, "share this job", tracking links, application-form field labels, EEO/legal blocks longer than a sentence, and repeated company marketing filler.
- Never reference another job board or aggregator by name or link.
- Fix broken formatting: run-on text with no spacing, stray HTML entities, duplicated headings and empty tags.
- Use <h3> for section headings, <ul>/<li> for lists, <p> for paragraphs. No inline styles, no <script>, no <img>.
- Keep it concise and scannable. Omit a section entirely if the source has nothing for it.
- Neutral third-person tone ("The role involves…", "You will…"). Do not add hype.

STRUCTURE:
1. <h3>Overview</h3> — 1–3 sentence summary of the role and the company
2. <h3>Key Responsibilities</h3>
3. <h3>Requirements</h3>
4. <h3>Benefits</h3>
5. <h3>Location</h3> — remote scope / timezone / country restrictions if stated
6. <h3>How to Apply</h3>
7. <h3>Deadline</h3> — only if stated

Also extract:
- apply_url: the direct application URL for THIS posting (the ATS or company career page link, or a mailto: address). Never a social network link, never a company homepage, never another job board. null if not present.
- company_name: the actual hiring organisation. null if unclear.
- detected_location: COUNTRY name OR REGION name — never a city, state or province alone. Rules:
  • Scan the FULL description AND title for cities, states, provinces, offices or hints like "Hybrid - Ottawa", "(Remote, Nairobi)", "based in Berlin", "US-based", "EU timezones". Infer the COUNTRY (Ottawa → Canada, Nairobi → Kenya, Lagos → Nigeria, California → United States, Bavaria → Germany).
  • A remote or hybrid role tied to ONE country or office city is NOT global — return that country.
  • Only return a REGION when the role explicitly spans several countries in one region. Allowed regions: "Sub-Saharan Africa", "East Africa", "West Africa", "Southern Africa", "North Africa", "MENA", "Middle East", "Europe", "Western Europe", "Eastern Europe", "Latin America", "Caribbean", "South Asia", "Southeast Asia", "East Asia", "Central Asia", "Oceania", "North America".
  • Use "Global" ONLY when the role is open worldwide with no country or city restriction anywhere.
- work_mode: "Remote", "Hybrid", or "Physical".
- listing_type: "job" for paid employment (including paid internships and contracts). "opportunity" only for fellowships, scholarships, grants, conferences, competitions, awards, unpaid training or short courses.
- opportunity_category: only when listing_type='opportunity', one of: "fellowship", "scholarship", "grant", "conference", "internship".
- employment_type: "Full-time", "Part-time", "Contract", or "Internship".
- apply_before: human-readable deadline (e.g., "April 30, 2026"). null if not stated.
- apply_before_iso: SAME deadline as YYYY-MM-DD. null if not stated or ambiguous.
- skills: up to 8 key skills/technologies as an array. [] if none.`;

const TOOL_DEFINITION = {
  type: "function" as const,
  function: {
    name: "save_cleaned_job",
    description:
      "Save the cleaned job description, apply URL, detected location, work mode, listing type, employment type, deadline, and skills",
    parameters: {
      type: "object",
      properties: {
        clean_description: {
          type: "string",
          description:
            "Clean HTML description with only essential job information. Well-formatted with proper paragraphs, lists, and headings.",
        },
        apply_url: {
          type: "string",
          description:
            "The actual application URL (Google Forms, mailto, company career page). null if not found. Must start with https:// or mailto:",
        },
        company_name: {
          type: "string",
          description:
            "The actual hiring company/organization name extracted from the listing. null if not identifiable.",
        },
        detected_location: {
          type: "string",
          description:
            "Country name OR region name. If only a city/state/province is given, infer the country. If the role spans multiple countries in one region, return the region (e.g. 'Sub-Saharan Africa', 'Southeast Asia', 'Latin America', 'MENA', 'Europe'). Use 'Global' only if truly worldwide. Never return a city or state alone.",
        },
        work_mode: {
          type: "string",
          enum: ["Remote", "Hybrid", "Physical"],
          description: "The work mode: Remote, Hybrid, or Physical.",
        },
        listing_type: {
          type: "string",
          enum: ["job", "opportunity"],
          description: "Whether this is a 'job' or 'opportunity'.",
        },
        opportunity_category: {
          type: "string",
          enum: ["fellowship", "scholarship", "grant", "conference", "internship"],
          description:
            "Sub-category for opportunities. Only required when listing_type is 'opportunity'.",
        },
        employment_type: {
          type: "string",
          enum: ["Full-time", "Part-time", "Contract", "Internship"],
          description: "Employment type: Full-time, Part-time, Contract, or Internship.",
        },
        apply_before: {
          type: "string",
          description: "Application deadline in human-readable format, e.g. 'April 30, 2026'. null if not mentioned.",
        },
        apply_before_iso: {
          type: "string",
          description: "Same deadline in ISO YYYY-MM-DD format. null if not mentioned or ambiguous.",
        },
        skills: {
          type: "array",
          items: { type: "string" },
          description: "Up to 8 key skills or technologies required. Empty array if none found.",
        },
      },
      required: ["clean_description", "detected_location", "work_mode", "listing_type"],
      additionalProperties: false,
    },
  },
};

const SPAM_APPLY_HOSTS = [
  "facebook.com", "l.facebook.com", "m.facebook.com", "instagram.com",
  "twitter.com", "x.com", "whatsapp.com", "wa.me", "t.me", "telegram.me", "threads.net",
];

const AGGREGATOR_NAMES = [
  "global south opportunities", "gso",
  "yeshub", "yes hub",
  "opportunities for youth", "ofy",
  "yuthaxis", "yuth axis",
  "ngo jobs in africa",
  "jobstoapply", "jobs to apply",
  "wpchannel",
];

const AGGREGATOR_DOMAINS = [
  "yeshub.ng", "globalsouthopportunities.com", "opportunitiesforyouth.org",
  "yuthaxis.com", "ngojobsinafrica.com", "jobstoapply.com",
];

const NOISE_PHRASES = [
  "for more opportunities such as these",
  "join gso whatsapp channel",
  "join our whatsapp channel",
  "follow us on facebook",
  "is not the organization offering this opportunity",
  "do not send your applications",
];

function stripSourceBlogNoise(html: string): string {
  if (!html) return html;
  let out = html;

  // Remove <a>…</a> whose href references an aggregator or social domain.
  const domainRe = new RegExp(
    `<a\\b[^>]*href=["'][^"']*(?:${[...AGGREGATOR_DOMAINS, ...SPAM_APPLY_HOSTS].map(d => d.replace(/\./g, "\\.")).join("|")})[^"']*["'][^>]*>[\\s\\S]*?<\\/a>`,
    "gi",
  );
  out = out.replace(domainRe, "");

  // Remove any block-level element containing an aggregator name or noise phrase.
  const needles = [...AGGREGATOR_NAMES, ...NOISE_PHRASES].map(s => s.toLowerCase());
  out = out.replace(/<(p|div|section|h[1-6]|li|ul|ol)\b[^>]*>[\s\S]*?<\/\1>/gi, (block) => {
    const text = block.replace(/<[^>]*>/g, " ").toLowerCase();
    return needles.some(n => text.includes(n)) ? "" : block;
  });

  // Also drop stray "Disclaimer:" paragraphs even without a block wrapper.
  out = out.replace(/disclaimer\s*:[^<]{0,600}/gi, "");

  return out.replace(/\n{3,}/g, "\n\n").trim();
}

function isSpamApplyUrl(raw: string): boolean {
  if (raw.startsWith("mailto:")) return false;
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");
    if (SPAM_APPLY_HOSTS.includes(host)) return true;
    if (AGGREGATOR_DOMAINS.some(d => host === d || host.endsWith("." + d))) return true;
    if (host === "linkedin.com" && /^\/(company|showcase)\//i.test(url.pathname)) return true;
    return false;
  } catch {
    return true;
  }
}

function buildUpdateData(args: Record<string, unknown>) {
  const rawClean = typeof args.clean_description === "string" ? args.clean_description : "";
  const updateData: Record<string, unknown> = {
    clean_description: stripSourceBlogNoise(rawClean) || null,
  };


  const candidateUrl = typeof args.apply_url === "string" ? args.apply_url.trim() : "";
  const hasValidShape = candidateUrl.startsWith("https://") || candidateUrl.startsWith("mailto:");
  if (hasValidShape && !isSpamApplyUrl(candidateUrl)) {
    updateData.apply_url = candidateUrl;
  }

  if (args.company_name) updateData.company = args.company_name;
  if (args.detected_location) updateData.location = args.detected_location;
  
  // Save work mode to is_remote flag instead of overwriting job_type
  if (args.work_mode) {
    updateData.is_remote = args.work_mode === "Remote";
  }
  
  // Save employment type to new column
  if (args.employment_type) {
    updateData.employment_type = args.employment_type;
  }

  if (args.listing_type && ["job", "opportunity"].includes(args.listing_type as string))
    updateData.listing_type = args.listing_type;
  if (args.opportunity_category) updateData.category = args.opportunity_category;
  
  // New fields
  if (args.apply_before) updateData.apply_before = args.apply_before;
  if (args.apply_before_iso && typeof args.apply_before_iso === "string" && /^\d{4}-\d{2}-\d{2}$/.test(args.apply_before_iso)) {
    updateData.apply_before_date = args.apply_before_iso;
  }
  if (args.skills && Array.isArray(args.skills) && args.skills.length > 0) {
    updateData.skills = args.skills;
  }
  
  return updateData;
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
    const openaiKey = Deno.env.get("OPENAI_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const reqUrl = new URL(req.url);
    const mode = reqUrl.searchParams.get("mode") || "dirty";
    const batchSize = Math.min(parseInt(reqUrl.searchParams.get("batch") || "40"), 100);
    const offset = parseInt(reqUrl.searchParams.get("offset") || "0");
    // Stop before the worker's wall-clock limit so we always return a result.
    const startedAt = Date.now();
    const TIME_BUDGET_MS = 110_000;

    let query = supabase
      .from("jobs")
      .select("id, title, description, location, job_type, category");

    if (mode === "all") {
      query = query
        .not("description", "is", null)
        .order("created_at", { ascending: false })
        .range(offset, offset + batchSize - 1);
    } else {
      // Newest listings first — the freshest jobs are the ones people see.
      query = query
        .is("clean_description", null)
        .not("description", "is", null)
        .is("archived_at", null)
        .order("created_at", { ascending: false })
        .limit(batchSize);
    }

    const { data: jobs, error } = await query;

    if (error) throw error;
    if (!jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${jobs.length} jobs for AI cleanup (OpenAI)`);
    let processed = 0;

    for (const job of jobs) {
      if (Date.now() - startedAt > TIME_BUDGET_MS) {
        console.log("Time budget reached, stopping this run");
        break;
      }
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              {
                role: "user",
                content: `Clean this listing and extract details:\n\nTitle: ${job.title}\nCurrent location: ${job.location || "Unknown"}\nCurrent job_type: ${job.job_type || "Unknown"}\nCurrent category: ${job.category || "Unknown"}\n\nHTML:\n${job.description}`,
              },
            ],
            tools: [TOOL_DEFINITION],
            tool_choice: { type: "function", function: { name: "save_cleaned_job" } },
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`OpenAI error for job ${job.id}:`, response.status, errText);
          continue;
        }

        const result = await response.json();
        const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
        if (!toolCall) {
          console.error(`No tool call for job ${job.id}`);
          continue;
        }

        const args = JSON.parse(toolCall.function.arguments);
        const updateData = buildUpdateData(args);

        const { error: updateError } = await supabase
          .from("jobs")
          .update(updateData)
          .eq("id", job.id);

        if (updateError) {
          console.error(`Update error for job ${job.id}:`, updateError);
        } else {
          processed++;
          // Mirror update to Eplicant
          mirrorUpdate("jobs", job.id, updateData).catch(e =>
            console.error(`Eplicant mirror error for ${job.id}:`, e)
          );
        }
      } catch (e) {
        console.error(`Error processing job ${job.id}:`, e);
      }
    }

    console.log(`Cleaned ${processed}/${jobs.length} jobs`);
    return new Response(
      JSON.stringify({ success: true, processed, total: jobs.length }),
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
