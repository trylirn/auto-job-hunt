import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { mirrorUpdate } from "../_shared/eplicant-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You extract clean job titles and company/organization names from raw job listing titles and descriptions.

TITLE CLEANING RULES:
- Remove phrases like "Apply Now", "Apply Here", "Hiring", "is recruiting", "is hiring", "Vacancy", "Job Opening"
- Remove source site names (e.g., "YesHub", "Eplicant", "NGO Jobs in Africa")
- Remove excessive punctuation, emojis, and decorative formatting
- Keep the core job role and seniority (e.g., "Senior Data Analyst", "Program Manager")
- If there's a location in the title, keep it only if it adds value
- Return a clean, professional job title suitable for LinkedIn

COMPANY NAME RULES:
- Look for patterns like "at [Company]", "by [Company]", "[Company] is hiring", "[Company] is recruiting", "[Company] seeks", "Join [Company]"
- The company name is the ACTUAL hiring organization, NOT the blog/aggregator site
- If the title contains the company name directly (e.g., "Alliance Francaise de Lagos is recruiting..."), extract it
- For government/institutional roles, use the department or agency name
- If you truly cannot identify a company, return "Unknown"`;

const TOOL_DEFINITION = {
  type: "function" as const,
  function: {
    name: "save_job_metadata",
    description: "Save the extracted clean job title and company name",
    parameters: {
      type: "object",
      properties: {
        clean_title: {
          type: "string",
          description: "The cleaned, professional job title without fluff words like 'Apply Now', site names, etc.",
        },
        company_name: {
          type: "string",
          description: "The extracted company/organization name. Use 'Unknown' only if truly unidentifiable.",
        },
      },
      required: ["clean_title", "company_name"],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch jobs that need title/company fixing
    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("id, title, description, clean_description, company")
      .or(
        "company.eq.Unknown,company.eq.unknown,company.eq.,company.is.null," +
        "title.ilike.%Apply Now%,title.ilike.%Apply Here%,title.ilike.%is hiring%," +
        "title.ilike.%is recruiting%,title.ilike.%Vacancy%"
      )
      .limit(10);

    if (error) throw error;
    if (!jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: "No jobs need fixing" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${jobs.length} jobs for title/company extraction`);
    let processed = 0;

    for (const job of jobs) {
      try {
        const desc = (job.clean_description || job.description || "").slice(0, 2000);
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
                content: `Extract the clean job title and company name from this job listing:\n\nRaw Title: ${job.title}\n\nDescription excerpt:\n${desc}`,
              },
            ],
            tools: [TOOL_DEFINITION],
            tool_choice: { type: "function", function: { name: "save_job_metadata" } },
          }),
        });

        if (!response.ok) {
          console.error(`OpenAI error for job ${job.id}:`, response.status);
          continue;
        }

        const result = await response.json();
        const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
        if (!toolCall) continue;

        const args = JSON.parse(toolCall.function.arguments);
        const cleanTitle = args.clean_title?.trim();
        const companyName = args.company_name?.trim();

        const updates: Record<string, string> = {};
        if (cleanTitle && cleanTitle !== job.title) {
          updates.title = cleanTitle;
        }
        if (companyName && companyName !== "Unknown" && companyName !== "unknown" &&
            (job.company === "Unknown" || job.company === "unknown" || !job.company)) {
          updates.company = companyName;
        }

        if (Object.keys(updates).length > 0) {
          // Also regenerate slug if title changed
          if (updates.title) {
            const baseSlug = updates.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/-+/g, "-")
              .replace(/^-|-$/g, "");
            updates.slug = `${baseSlug}-${job.id.slice(0, 8)}`;
          }

          const { error: updateError } = await supabase
            .from("jobs")
            .update(updates)
            .eq("id", job.id);

          if (updateError) {
            console.error(`Update error for ${job.id}:`, updateError);
          } else {
            processed++;
            mirrorUpdate("jobs", job.id, updates).catch(e =>
              console.error(`Mirror error for ${job.id}:`, e)
            );
          }
        }
      } catch (e) {
        console.error(`Error processing job ${job.id}:`, e);
      }
    }

    console.log(`Fixed ${processed}/${jobs.length} job titles/companies`);
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
