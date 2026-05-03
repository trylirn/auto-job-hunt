import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { mirrorUpdate } from "../_shared/eplicant-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You clean and structure job/opportunity descriptions. You will be given raw HTML from a WordPress blog. Your task is to extract and return clean, well-structured HTML with only the essential information.

RULES:
- Remove ALL SEO spam, chatgpt:// links, YesHub branding, social share buttons, and irrelevant content
- Do NOT rewrite or fabricate content — only reorganize what exists
- Use <h3> for section headings, <ul>/<li> for lists, <p> for paragraphs
- Keep it concise and scannable
- For OPPORTUNITIES (fellowships, scholarships, grants, conferences, internships): use applicant-centric language — "This program offers...", "Applicants will receive...", "You can apply for...". DO NOT say "is hiring", "is recruiting", "join the team". Frame everything from the applicant's perspective.

STRUCTURE (jobs):
1. <h3>Overview</h3> — Brief role summary (1-2 sentences)
2. <h3>Key Responsibilities</h3>
3. <h3>Requirements</h3>
4. <h3>Benefits</h3>
5. <h3>Location</h3>
6. <h3>How to Apply</h3>
7. <h3>Deadline</h3>

STRUCTURE (opportunities — applicant tone):
1. <h3>Overview</h3> — What the opportunity offers applicants
2. <h3>Eligibility</h3> — Who can apply
3. <h3>Benefits</h3> — What applicants will receive (funding, training, mentorship, etc.)
4. <h3>How to Apply</h3>
5. <h3>Deadline</h3>

Also extract:
- apply_url: actual application URL (Google Forms, mailto, company career page). Ignore chatgpt:// / yeshub.ng / share links.
- company_name: actual hiring organization. PRIORITIZE the title. Don't use blog/source name. Null if unknown.
- detected_location: COUNTRY name OR REGION name. Never a city, state, or province alone. Rules:
  • If a city/state/province is mentioned (e.g. "Lagos", "California", "Bavaria", "Ontario"), infer and return the COUNTRY (e.g. "Nigeria", "USA", "Germany", "Canada").
  • If the role spans multiple countries in the same region, return the REGION instead. Allowed regions: "Sub-Saharan Africa", "East Africa", "West Africa", "Southern Africa", "North Africa", "MENA", "Middle East", "Europe", "Western Europe", "Eastern Europe", "Latin America", "Caribbean", "South Asia", "Southeast Asia", "East Asia", "Central Asia", "Oceania", "North America".
  • Use "Global" ONLY if truly worldwide.
  • Never return a city or US state on its own.
- work_mode: "Remote", "Hybrid", or "Physical".
- listing_type: "job" or "opportunity". Fellowships, scholarships, grants, conferences, training, awards, PhD positions, short courses, competitions are opportunities.
- opportunity_category: when listing_type='opportunity', one of: "fellowship", "scholarship", "grant", "conference", "internship".
- employment_type: "Full-time", "Part-time", "Contract", or "Internship".
- apply_before: human-readable deadline (e.g., "April 30, 2026"). null if not stated.
- apply_before_iso: SAME deadline in ISO format YYYY-MM-DD (e.g., "2026-04-30"). null if not stated or ambiguous.
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

function buildUpdateData(args: Record<string, unknown>) {
  const updateData: Record<string, unknown> = {
    clean_description: args.clean_description || null,
    apply_url:
      args.apply_url &&
      typeof args.apply_url === "string" &&
      (args.apply_url.startsWith("https://") || args.apply_url.startsWith("mailto:"))
        ? args.apply_url
        : null,
  };
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

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("id, title, description, location, job_type, category")
      .is("clean_description", null)
      .not("description", "is", null)
      .limit(5);

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
