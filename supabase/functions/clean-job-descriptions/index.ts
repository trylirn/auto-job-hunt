import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch jobs that haven't been cleaned yet
    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("id, title, description, location, job_type")
      .is("clean_description", null)
      .not("description", "is", null)
      .limit(20);

    if (error) throw error;
    if (!jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${jobs.length} jobs for AI cleanup`);
    let processed = 0;

    for (const job of jobs) {
      try {
        const response = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${lovableApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-lite",
              messages: [
                {
                  role: "system",
                  content: `You clean and structure job/opportunity descriptions. You will be given raw HTML from a WordPress blog. Your task is to extract and return clean, well-structured HTML with only the essential information.

RULES:
- Remove ALL SEO spam, chatgpt:// links, YesHub branding, social share buttons, and irrelevant content
- Do NOT rewrite or fabricate content — only reorganize what exists
- Use <h3> for section headings, <ul>/<li> for lists, <p> for paragraphs
- Keep it concise and scannable

STRUCTURE the output into these sections (skip any section if info is not available):
1. <h3>Overview</h3> — Brief role/opportunity summary (1-2 sentences)
2. <h3>Key Responsibilities</h3> — Bulleted list of duties
3. <h3>Requirements</h3> — Qualifications, skills, experience needed
4. <h3>Benefits</h3> — Salary, perks, benefits if mentioned
5. <h3>Location</h3> — Where the role is based
6. <h3>How to Apply</h3> — Application instructions and deadline
7. <h3>Deadline</h3> — Application deadline if mentioned

For non-job opportunities (scholarships, fellowships, grants, programs):
1. <h3>Overview</h3> — What the opportunity is about
2. <h3>Eligibility</h3> — Who can apply
3. <h3>Benefits</h3> — What's offered (funding, training, etc.)
4. <h3>How to Apply</h3> — Steps to apply
5. <h3>Deadline</h3> — When to apply by

Also extract:
- The actual application URL if present (Google Forms, email mailto links, company career page URLs). Ignore chatgpt:// URLs, yeshub.ng URLs, and social media share links.
- The SPECIFIC location where the role/opportunity is based. Look for city names, country names, or regions mentioned in the description. Examples: "Lagos, Nigeria", "Nairobi, Kenya", "Remote", "Washington DC, USA", "Multiple Locations". If truly global or location not specified, use "Global".
- The work mode: determine if this is "Remote", "Hybrid", or "Physical" based on the description. If explicitly mentions remote work, use "Remote". If mentions hybrid/flexible, use "Hybrid". If mentions a specific office/location where you must be present, use "Physical". Default to "Physical" if unclear.`,
                },
                {
                  role: "user",
                  content: `Clean this job description and extract details:\n\nTitle: ${job.title}\nCurrent location: ${job.location || "Unknown"}\nCurrent job_type: ${job.job_type || "Unknown"}\n\nHTML:\n${job.description}`,
                },
              ],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "save_cleaned_job",
                    description:
                      "Save the cleaned job description, apply URL, detected location, and work mode",
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
                        detected_location: {
                          type: "string",
                          description:
                            "The specific location where the role is based, e.g. 'Lagos, Nigeria', 'Nairobi, Kenya', 'Remote', 'Washington DC, USA', 'Multiple Locations', 'Global'. Be as specific as possible.",
                        },
                        work_mode: {
                          type: "string",
                          enum: ["Remote", "Hybrid", "Physical"],
                          description:
                            "The work mode: Remote, Hybrid, or Physical. Default to Physical if unclear.",
                        },
                      },
                      required: ["clean_description", "detected_location", "work_mode"],
                      additionalProperties: false,
                    },
                  },
                },
              ],
              tool_choice: {
                type: "function",
                function: { name: "save_cleaned_job" },
              },
            }),
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          console.error(`AI error for job ${job.id}:`, response.status, errText);
          continue;
        }

        const result = await response.json();
        const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
        if (!toolCall) {
          console.error(`No tool call for job ${job.id}`);
          continue;
        }

        const args = JSON.parse(toolCall.function.arguments);
        const cleanDesc = args.clean_description || null;
        const applyUrl = args.apply_url || null;
        const detectedLocation = args.detected_location || null;
        const workMode = args.work_mode || null;

        const updateData: Record<string, unknown> = {
          clean_description: cleanDesc,
          apply_url: applyUrl && (applyUrl.startsWith("https://") || applyUrl.startsWith("mailto:")) ? applyUrl : null,
        };

        if (detectedLocation) {
          updateData.location = detectedLocation;
        }

        if (workMode && ["Remote", "Hybrid", "Physical"].includes(workMode)) {
          updateData.job_type = workMode;
        }

        const { error: updateError } = await supabase
          .from("jobs")
          .update(updateData)
          .eq("id", job.id);

        if (updateError) {
          console.error(`Update error for job ${job.id}:`, updateError);
        } else {
          processed++;
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
