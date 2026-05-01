import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { mirrorUpdate } from "../_shared/eplicant-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TOOL = {
  type: "function" as const,
  function: {
    name: "save_country",
    description: "Return the country only.",
    parameters: {
      type: "object",
      properties: {
        country: {
          type: "string",
          description:
            "Single country name only (e.g. 'Nigeria', 'USA', 'United Kingdom', 'Global'). No cities. 'Global' only if truly worldwide.",
        },
      },
      required: ["country"],
      additionalProperties: false,
    },
  },
};

function looksDirty(loc: string | null): boolean {
  if (!loc) return true;
  const v = loc.trim();
  if (!v || v.toLowerCase() === "unknown") return true;
  if (v.includes(",")) return true;
  // very long values likely include city/region
  if (v.length > 30) return true;
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const openaiKey = Deno.env.get("OPENAI_API_KEY")!;

  const url = new URL(req.url);
  const batch = Math.min(Number(url.searchParams.get("batch") ?? "20"), 50);

  const { data: rows, error } = await supabase
    .from("jobs")
    .select("id, title, location, description, clean_description")
    .or("location.is.null,location.eq.Unknown,location.ilike.%,%")
    .limit(batch);

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
                "Extract the country (one only) from the job/opportunity content. Return COUNTRY ONLY — never cities. Use 'Global' only if explicitly worldwide/remote-anywhere. If unsure between countries, pick the most prominently mentioned. If no clear country, return 'Global'.",
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
      const country = (args.country as string)?.trim();
      if (!country) continue;
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
