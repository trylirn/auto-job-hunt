import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { mirrorUpdate } from "../_shared/eplicant-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You extract company/organization names from job listing titles and descriptions.

RULES:
- Look for patterns like "at [Company]", "by [Company]", "[Company] is hiring", "[Company] is recruiting", "[Company] seeks", "Join [Company]"
- The company name is the ACTUAL hiring organization, NOT the blog/aggregator site (e.g., not "YesHub", not "Eplicant")
- If the title contains the company name directly (e.g., "Alliance Francaise de Lagos is recruiting..."), extract it
- For government/institutional roles, use the department or agency name
- If you truly cannot identify a company, return "Unknown"
- Return ONLY the company name, nothing else`;

const TOOL_DEFINITION = {
  type: "function" as const,
  function: {
    name: "save_company_name",
    description: "Save the extracted company name",
    parameters: {
      type: "object",
      properties: {
        company_name: {
          type: "string",
          description: "The extracted company/organization name. Use 'Unknown' only if truly unidentifiable.",
        },
      },
      required: ["company_name"],
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

    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("id, title, description, clean_description")
      .or("company.eq.Unknown,company.eq.unknown,company.eq.,company.is.null")
      .limit(10);

    if (error) throw error;
    if (!jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: "No jobs with Unknown company" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${jobs.length} jobs for company name extraction`);
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
                content: `Extract the company/organization name from this job listing:\n\nTitle: ${job.title}\n\nDescription excerpt:\n${desc}`,
              },
            ],
            tools: [TOOL_DEFINITION],
            tool_choice: { type: "function", function: { name: "save_company_name" } },
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
        const companyName = args.company_name?.trim();

        if (companyName && companyName !== "Unknown" && companyName !== "unknown") {
          const { error: updateError } = await supabase
            .from("jobs")
            .update({ company: companyName })
            .eq("id", job.id);

          if (updateError) {
            console.error(`Update error for ${job.id}:`, updateError);
          } else {
            processed++;
            mirrorUpdate("jobs", job.id, { company: companyName }).catch(e =>
              console.error(`Mirror error for ${job.id}:`, e)
            );
          }
        }
      } catch (e) {
        console.error(`Error processing job ${job.id}:`, e);
      }
    }

    console.log(`Fixed ${processed}/${jobs.length} company names`);
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
