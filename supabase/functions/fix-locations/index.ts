import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { mirrorUpdate } from "../_shared/eplicant-client.ts";
import { requireCronAuth } from "../_shared/require-cron.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-token",
};

const ALLOWED_REGIONS = new Set([
  "Global",
  "Sub-Saharan Africa", "East Africa", "West Africa", "Southern Africa", "North Africa",
  "MENA", "Middle East",
  "Europe", "Western Europe", "Eastern Europe",
  "Latin America", "Caribbean",
  "South Asia", "Southeast Asia", "East Asia", "Central Asia",
  "Oceania", "North America",
]);

const TOOL = {
  type: "function" as const,
  function: {
    name: "save_country",
    description: "Return the country or region only.",
    parameters: {
      type: "object",
      properties: {
        country: {
          type: "string",
          description:
            "Country name OR a recognized region name. If only a city/state/province is given (e.g. 'Lagos', 'California', 'Bavaria'), infer and return the COUNTRY. If the role spans multiple countries in the same region, return the region instead. Allowed regions: 'Sub-Saharan Africa', 'East Africa', 'West Africa', 'Southern Africa', 'North Africa', 'MENA', 'Middle East', 'Europe', 'Western Europe', 'Eastern Europe', 'Latin America', 'Caribbean', 'South Asia', 'Southeast Asia', 'East Asia', 'Central Asia', 'Oceania', 'North America'. Use 'Global' only if truly worldwide. NEVER return a city or US state alone.",
        },
      },
      required: ["country"],
      additionalProperties: false,
    },
  },
};

// US states + common city/region keywords that signal "needs country inference"
const US_STATES = new Set([
  "alabama","alaska","arizona","arkansas","california","colorado","connecticut","delaware","florida","georgia","hawaii","idaho","illinois","indiana","iowa","kansas","kentucky","louisiana","maine","maryland","massachusetts","michigan","minnesota","mississippi","missouri","montana","nebraska","nevada","new hampshire","new jersey","new mexico","new york","north carolina","north dakota","ohio","oklahoma","oregon","pennsylvania","rhode island","south carolina","south dakota","tennessee","texas","utah","vermont","virginia","washington","west virginia","wisconsin","wyoming","dc","d.c."
]);

function looksDirty(loc: string | null): boolean {
  if (!loc) return true;
  const v = loc.trim();
  if (!v || v.toLowerCase() === "unknown") return true;
  // NOTE: "Global" is intentionally left alone. It's surfaced as "USA / Global"
  // in the UI and serves as our U.S.-priority bucket for SEO.
  if (v.includes(",")) return true;
  if (v.length > 30) return true;
  if (US_STATES.has(v.toLowerCase())) return true;
  if (/\b(province|region|state|district|county|city)\b/i.test(v)) return true;
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const authFail = requireCronAuth(req);
  if (authFail) return authFail;


  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const openaiKey = Deno.env.get("OPENAI_API_KEY")!;

  const url = new URL(req.url);
  const batch = Math.min(Number(url.searchParams.get("batch") ?? "20"), 50);

  // PostgREST .or() can't handle commas inside ilike values, so we run two queries and merge.
  const [q1, q2] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, title, location, description, clean_description")
      .or("location.is.null,location.eq.Unknown")
      .limit(batch),
    supabase
      .from("jobs")
      .select("id, title, location, description, clean_description")
      .like("location", "%,%")
      .limit(batch),
  ]);
  const error = q1.error || q2.error;
  const merged = [...(q1.data ?? []), ...(q2.data ?? [])];
  const seen = new Set<string>();
  const rows = merged.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true))).slice(0, batch);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const candidates = (rows ?? []).filter((r) => looksDirty(r.location));
  let processed = 0;

  for (const job of candidates) {
    try {
      const text =
        (job.clean_description || job.description || "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .slice(0, 4000);

      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
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
                "Extract the COUNTRY (or region) where the job/opportunity is physically based. RULES: (1) Carefully scan the description AND title for any city, state, province, office location, or parenthetical hints like 'Hybrid - Ottawa', '(Remote, Nairobi)', 'based in Berlin'. Always infer the country from such hints (Ottawa → Canada, Nairobi → Kenya, Berlin → Germany). (2) Never return a city, US state, or province alone — always the country. (3) Only return a REGION ('Sub-Saharan Africa', 'Southeast Asia', 'Latin America', 'MENA', 'Europe', etc.) when the role explicitly spans multiple countries within that region. (4) Return 'Global' ONLY if the role is truly worldwide with NO city or country mentioned anywhere. A hybrid/remote role tied to one office city is NOT global — return that office's country. (5) If unsure between countries, pick the most prominently mentioned.",
            },
            {
              role: "user",
              content: `Title: ${job.title}\nCurrent: ${job.location ?? "null"}\n\nContent:\n${text}`,
            },
          ],
          tools: [TOOL],
          tool_choice: { type: "function", function: { name: "save_country" } },
        }),
      });

      if (!resp.ok) {
        console.error("openai error", resp.status, await resp.text());
        continue;
      }
      const result = await resp.json();
      const tc = result.choices?.[0]?.message?.tool_calls?.[0];
      if (!tc) continue;
      const args = JSON.parse(tc.function.arguments);
      let country = (args.country as string)?.trim();
      if (!country) continue;

      // Reject obvious bad outputs (city/state alone)
      if (US_STATES.has(country.toLowerCase())) country = "USA";
      if (country === job.location) continue;

      const update = { location: country };
      const { error: updErr } = await supabase.from("jobs").update(update).eq("id", job.id);
      if (updErr) {
        console.error("update error", updErr.message);
        continue;
      }
      processed++;
      mirrorUpdate("jobs", job.id, update).catch((e) =>
        console.error("mirror error", e)
      );
    } catch (e) {
      console.error("loop err", e);
    }
  }

  return new Response(
    JSON.stringify({ scanned: candidates.length, processed }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
