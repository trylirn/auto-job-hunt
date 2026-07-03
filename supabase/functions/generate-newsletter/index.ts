import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Listing = {
  title: string;
  company: string;
  location: string | null;
  job_type: string | null;
  slug: string | null;
  listing_type: string | null;
  is_remote: boolean | null;
  posted_at: string | null;
};

type Region =
  | "Remote"
  | "Americas"
  | "Europe"
  | "Sub-Saharan Africa"
  | "MENA"
  | "Asia"
  | "Oceania"
  | "Global / Multi-region";

function classifyRegion(l: Listing): Region {
  const loc = (l.location || "").toLowerCase();
  const jt = (l.job_type || "").toLowerCase();

  // Remote first — but only if no specific country tie OR location explicitly says remote/global
  const isRemote =
    l.is_remote === true || jt === "remote" || /\bremote\b/.test(loc);

  // Region keyword maps
  const americas = [
    "united states", "usa", "u.s.a", "u.s.", "canada", "mexico", "brazil",
    "argentina", "chile", "colombia", "peru", "venezuela", "ecuador", "bolivia",
    "uruguay", "paraguay", "guatemala", "honduras", "el salvador", "nicaragua",
    "costa rica", "panama", "cuba", "haiti", "dominican", "jamaica", "trinidad",
    "caribbean", "latin america", "americas", "north america", "south america",
    "central america",
  ];
  const europe = [
    "united kingdom", "uk", "england", "scotland", "wales", "ireland",
    "germany", "france", "spain", "portugal", "italy", "netherlands", "belgium",
    "switzerland", "austria", "sweden", "norway", "denmark", "finland",
    "poland", "czech", "slovakia", "hungary", "romania", "bulgaria", "greece",
    "croatia", "serbia", "ukraine", "estonia", "latvia", "lithuania", "iceland",
    "europe", "european",
  ];
  const ssa = [
    "nigeria", "kenya", "ghana", "south africa", "ethiopia", "uganda",
    "tanzania", "rwanda", "senegal", "ivory coast", "côte d'ivoire", "cote d'ivoire",
    "cameroon", "zambia", "zimbabwe", "malawi", "mozambique", "angola",
    "botswana", "namibia", "mali", "burkina faso", "niger", "benin", "togo",
    "sierra leone", "liberia", "gambia", "guinea", "congo", "drc", "sudan",
    "south sudan", "somalia", "djibouti", "eritrea", "madagascar", "lesotho",
    "eswatini", "swaziland", "burundi", "central african republic", "chad",
    "sub-saharan africa", "west africa", "east africa", "southern africa",
    "africa",
  ];
  const mena = [
    "egypt", "morocco", "tunisia", "algeria", "libya", "saudi arabia", "uae",
    "united arab emirates", "qatar", "kuwait", "bahrain", "oman", "yemen",
    "jordan", "lebanon", "syria", "iraq", "iran", "israel", "palestine",
    "turkey", "mena", "middle east", "north africa",
  ];
  const asia = [
    "india", "pakistan", "bangladesh", "sri lanka", "nepal", "bhutan",
    "afghanistan", "china", "japan", "south korea", "korea", "mongolia",
    "taiwan", "hong kong", "vietnam", "thailand", "indonesia", "philippines",
    "malaysia", "singapore", "cambodia", "laos", "myanmar", "burma",
    "kazakhstan", "uzbekistan", "kyrgyzstan", "tajikistan", "turkmenistan",
    "asia", "south asia", "southeast asia", "central asia", "east asia",
  ];
  const oceania = [
    "australia", "new zealand", "fiji", "papua new guinea", "samoa", "tonga",
    "vanuatu", "solomon islands", "oceania", "pacific",
  ];

  const hit = (arr: string[]) => arr.some((k) => loc.includes(k));

  if (hit(americas)) return "Americas";
  if (hit(europe)) return "Europe";
  if (hit(ssa)) return "Sub-Saharan Africa";
  if (hit(mena)) return "MENA";
  if (hit(asia)) return "Asia";
  if (hit(oceania)) return "Oceania";

  if (isRemote || /\bglobal\b|worldwide|anywhere/.test(loc)) return "Remote";
  return "Global / Multi-region";
}

function fmtListing(l: Listing): string {
  const loc = l.location || (l.is_remote ? "Remote" : "—");
  const type = l.job_type || "Full-time";
  return `- ${l.title} | ${l.company} | ${loc} | ${type} | https://eplicant.com/job/${l.slug}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  const authFail = requireCronAuth(req);
  if (authFail) return authFail;


  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Delete expired newsletters
    await supabase
      .from("newsletters")
      .delete()
      .lt("expires_at", new Date().toISOString());

    const oneWeekAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    // Fetch JOBS — many of them
    const { data: jobsRaw, error: jobsErr } = await supabase
      .from("jobs")
      .select(
        "title, company, location, job_type, slug, listing_type, is_remote, posted_at",
      )
      .eq("listing_type", "job")
      .is("archived_at", null)
      .gte("created_at", oneWeekAgo)
      .order("created_at", { ascending: false })
      .limit(120);
    if (jobsErr) throw jobsErr;

    // Fetch OPPORTUNITIES — keep small
    const { data: oppsRaw, error: oppsErr } = await supabase
      .from("jobs")
      .select(
        "title, company, location, job_type, slug, listing_type, is_remote, posted_at",
      )
      .eq("listing_type", "opportunity")
      .is("archived_at", null)
      .gte("created_at", oneWeekAgo)
      .order("created_at", { ascending: false })
      .limit(10);
    if (oppsErr) throw oppsErr;

    const jobs = (jobsRaw || []) as Listing[];
    const opps = (oppsRaw || []) as Listing[];

    if (jobs.length === 0 && opps.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No new listings this week" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Group jobs by region
    const regionOrder: Region[] = [
      "Remote",
      "Americas",
      "Europe",
      "Sub-Saharan Africa",
      "MENA",
      "Asia",
      "Oceania",
      "Global / Multi-region",
    ];
    const grouped: Record<Region, Listing[]> = {
      "Remote": [],
      "Americas": [],
      "Europe": [],
      "Sub-Saharan Africa": [],
      "MENA": [],
      "Asia": [],
      "Oceania": [],
      "Global / Multi-region": [],
    };
    for (const j of jobs) grouped[classifyRegion(j)].push(j);

    let jobsBlock = "";
    for (const r of regionOrder) {
      if (grouped[r].length === 0) continue;
      jobsBlock += `\n## ${r} (${grouped[r].length})\n`;
      jobsBlock += grouped[r].map(fmtListing).join("\n");
      jobsBlock += "\n";
    }

    const oppsBlock = opps.length
      ? `\n## Opportunities (${opps.length})\n${opps.map(fmtListing).join("\n")}\n`
      : "";

    const userContent =
      `Generate this week's newsletter titled "Jobs of the Week" from the listings below.\n\n` +
      `=== JOBS (${jobs.length} total) — grouped by region ===\n${jobsBlock}\n` +
      `=== OPPORTUNITIES (${opps.length} total) ===\n${oppsBlock}`;

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
            content:
              `You are the newsletter writer for Eplicant, a job board for international development professionals. ` +
              `Write a weekly HTML newsletter with a warm, professional tone.\n\n` +
              `STRUCTURE (in this exact order):\n` +
              `1. A short intro paragraph (2-3 sentences).\n` +
              `2. A large "Jobs This Week" section, broken into sub-headings BY REGION exactly as provided in the input ` +
              `(Remote, Americas, Europe, Sub-Saharan Africa, MENA, Asia, Oceania, Global / Multi-region). ` +
              `Skip any region that has zero listings. Include EVERY job listed under each region — do not truncate or summarise. ` +
              `Render each job as: <strong><a href="LINK">Title</a></strong> — Company · Location · Type.\n` +
              `3. A smaller "Opportunities" section at the bottom (fellowships, scholarships, grants), only if any are provided. Keep it brief.\n` +
              `4. A short closing CTA pointing readers to https://eplicant.com.\n\n` +
              `RULES:\n` +
              `- Jobs MUST significantly outweigh opportunities visually and in count.\n` +
              `- Use clean HTML with simple inline styles. Use <h2> for region headings and <ul><li> for listings.\n` +
              `- Do NOT include <html>, <head>, or <body> tags.\n` +
              `- Do NOT mention AI, aggregation, scraping, or data sources.\n` +
              `- Never invent listings — only use what's provided.`,
          },
          { role: "user", content: userContent },
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
    const expiresAt = new Date(
      now.getTime() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const weekLabel = now.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const { error: insertError } = await supabase.from("newsletters").insert({
      title: `Jobs of the Week — ${weekLabel}`,
      content,
      expires_at: expiresAt,
    });
    if (insertError) throw insertError;

    console.log(
      `Newsletter generated: ${jobs.length} jobs, ${opps.length} opportunities`,
    );
    return new Response(
      JSON.stringify({
        success: true,
        jobs_count: jobs.length,
        opportunities_count: opps.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Newsletter generation error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
