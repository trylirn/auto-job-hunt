import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

function formatPostMessage(job: {
  title: string;
  company: string;
  location: string | null;
  job_type: string | null;
  listing_type: string | null;
  slug?: string | null;
  id: string;
}): string {
  const emoji = job.listing_type === "opportunity" ? "🌟" : "🚀";
  const typeLabel = job.listing_type === "opportunity" ? "New Opportunity" : "Now Hiring";

  let message = `${emoji} ${typeLabel}: ${job.title} at ${job.company}`;

  const details: string[] = [];
  if (job.location) details.push(`📍 ${job.location}`);
  if (job.job_type) details.push(`💼 ${job.job_type}`);
  if (details.length > 0) message += `\n${details.join(" | ")}`;

  const jobPath = job.slug || job.id;
  message += `\n\nApply now: https://eplicant.com/job/${jobPath}`;
  message += `\n\n#Jobs #Opportunities #Careers #Hiring`;

  return message;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require a shared secret so only the DB trigger (or trusted internal callers)
  // can trigger a social post. Blocks anonymous payload injection.
  const expected = Deno.env.get("SOCIAL_WEBHOOK_TOKEN");
  if (!expected) {
    return new Response(
      JSON.stringify({ success: false, error: "server_misconfigured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  const supplied =
    req.headers.get("x-webhook-secret") ??
    (req.headers.get("authorization")?.toLowerCase().startsWith("bearer ")
      ? req.headers.get("authorization")!.slice(7).trim()
      : "");
  if (supplied !== expected) {
    return new Response(
      JSON.stringify({ success: false, error: "unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const linkedinWebhook = Deno.env.get("ZAPIER_LINKEDIN_WEBHOOK");
    const twitterWebhook = Deno.env.get("ZAPIER_TWITTER_WEBHOOK");

    if (!linkedinWebhook && !twitterWebhook) {
      console.log("No webhook URLs configured, skipping");
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "no_webhooks" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const incoming = body.record || body;
    const jobId: string | undefined = incoming?.id;
    if (!jobId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing job id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // NEVER trust the request body: re-fetch the record from the database so
    // an attacker cannot inject arbitrary title/company/apply URLs even if they
    // learn the webhook secret.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: record, error: fetchErr } = await supabase
      .from("jobs")
      .select("id,title,company,location,job_type,listing_type,slug,apply_url")
      .eq("id", jobId)
      .single();

    if (fetchErr || !record) {
      return new Response(
        JSON.stringify({ success: false, error: "job_not_found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (record.listing_type === "opportunity") {
      return new Response(
        JSON.stringify({ success: true, skipped: "opportunity_listing" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const message = formatPostMessage({
      title: record.title,
      company: record.company,
      location: record.location,
      job_type: record.job_type,
      listing_type: record.listing_type,
      slug: record.slug,
      id: record.id,
    });

    const payload = {
      message,
      title: record.title,
      company: record.company,
      location: record.location || "Not specified",
      job_type: record.job_type || "Not specified",
      listing_type: record.listing_type || "job",
      apply_url: `https://eplicant.com/job/${record.slug || record.id}`,
    };

    const results: { platform: string; status: string }[] = [];

    if (linkedinWebhook) {
      try {
        const res = await fetch(linkedinWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        results.push({ platform: "linkedin", status: res.ok ? "sent" : `error_${res.status}` });
        console.log(`LinkedIn webhook: ${res.status}`);
      } catch (e) {
        console.error("LinkedIn webhook error:", e);
        results.push({ platform: "linkedin", status: "error" });
      }
    }

    if (twitterWebhook) {
      try {
        const res = await fetch(twitterWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        results.push({ platform: "twitter", status: res.ok ? "sent" : `error_${res.status}` });
        console.log(`Twitter webhook: ${res.status}`);
      } catch (e) {
        console.error("Twitter webhook error:", e);
        results.push({ platform: "twitter", status: "error" });
      }
    }

    console.log(`Posted job "${record.title}" to ${results.length} platform(s)`);

    return new Response(
      JSON.stringify({ success: true, results }),
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
