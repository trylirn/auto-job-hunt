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
    const openaiKey = Deno.env.get("OPENAI_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Delete expired newsletters
    await supabase.from("newsletters").delete().lt("expires_at", new Date().toISOString());

    // Fetch latest jobs from the past 7 days
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("title, company, location, job_type, slug, listing_type, posted_at")
      .gte("created_at", oneWeekAgo)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) throw error;
    if (!jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No new jobs this week" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const jobsList = jobs.map((j, i) => 
      `${i + 1}. ${j.title} at ${j.company} | ${j.location || "Remote"} | ${j.job_type || "Full-time"} | Type: ${j.listing_type || "job"} | Link: https://eplicant.com/job/${j.slug}`
    ).join("\n");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a career newsletter writer for Eplicant, a platform helping job seekers find verified jobs and opportunities. Generate a weekly newsletter in clean HTML format. Use a warm, professional tone. Group listings by type (Jobs vs Opportunities) if applicable. Include at least 20 listings. Each listing should include the job title as a link, company name, location, and job type. Add a brief intro paragraph and a closing call-to-action encouraging readers to visit https://eplicant.com for more. Do NOT include <html>, <head>, or <body> tags — only the inner content HTML. Use simple, clean styling with inline CSS.`,
          },
          {
            role: "user",
            content: `Generate this week's newsletter titled "Jobs & Opportunities of the Week" from these listings:\n\n${jobsList}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI error ${response.status}: ${errText}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content from OpenAI");

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const weekLabel = `${now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;

    const { error: insertError } = await supabase.from("newsletters").insert({
      title: `Jobs & Opportunities of the Week — ${weekLabel}`,
      content,
      expires_at: expiresAt,
    });

    if (insertError) throw insertError;

    console.log("Newsletter generated successfully");
    return new Response(
      JSON.stringify({ success: true, jobs_count: jobs.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Newsletter generation error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
