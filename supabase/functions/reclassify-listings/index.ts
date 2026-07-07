// Reclassify listings that were misfiled as "opportunity" but are actually paid jobs.
// Uses Lovable AI Gateway (no OpenAI). Manual trigger only — auth via CRON token.
//
// Usage:
//   POST /functions/v1/reclassify-listings?batch=50&max_batches=20
//   header: x-cron-token: <CRON_TOKEN>

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireCronAuth } from "../_shared/require-cron.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-token",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "openai/gpt-5-nano";

const SYSTEM_PROMPT = `You classify listings on an international-development job board.
Return STRICT JSON: {"type":"job"|"opportunity","confidence":0..1,"reason":"<short>"}.

A "job" = a paid employment role (any level; full-time, part-time, contract, or a
consultancy assignment) with a defined role title such as Officer, Coordinator,
Manager, Specialist, Analyst, Advisor, Consultant, Assistant, Associate, Director,
Deputy Chief of Party, Chief of Party, Lead, Head, Chief, Engineer, Developer,
Administrator, Executive, Supervisor, Technician, Architect, Planner, Auditor,
Business Developer, Fundraiser, Communications, HR/Talent, Legal, Finance, etc.

An "opportunity" = fellowship, scholarship, bursary, grant funding call,
internship, traineeship, PhD/postdoctoral position, call for proposals/papers/
applicants, competition, hackathon, conference, award/prize, residency, or a
capacity-building programme (leadership programme, training programme).

Marketing wrappers like "Join X as a Y..." should be judged by the underlying
role Y, not the word "Join". If the listing describes hiring someone into a paid
role, it is a "job" even if the source category says grant/internship/conference.

Return only the JSON object, no prose.`;

interface Row {
  id: string;
  title: string;
  company: string | null;
  clean_description: string | null;
  description: string | null;
  category: string | null;
}

async function classify(row: Row): Promise<{ type: string; confidence: number; reason: string } | null> {
  const desc = (row.clean_description ?? row.description ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 600);
  const user = `Title: ${row.title}\nCompany: ${row.company ?? "unknown"}\nSource category: ${row.category ?? "unknown"}\nDescription snippet: ${desc}`;

  const body = JSON.stringify({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
  });

  const doFetch = () => fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": LOVABLE_API_KEY,
    },
    body,
  });

  let res = await doFetch();
  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 8000));
    res = await doFetch();
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err: any = new Error(`gateway ${res.status}: ${text.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) return null;
  try {
    const parsed = typeof content === "string" ? JSON.parse(content) : content;
    if (parsed && (parsed.type === "job" || parsed.type === "opportunity")) {
      return {
        type: parsed.type,
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
        reason: String(parsed.reason ?? ""),
      };
    }
  } catch {
    // ignore malformed
  }
  return null;
}

async function processBatch(supabase: any, batchSize: number, excludeIds: string[]) {
  let q = supabase
    .from("jobs")
    .select("id, title, company, clean_description, description, category")
    .eq("listing_type", "opportunity")
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(batchSize);
  if (excludeIds.length > 0) {
    // PostgREST `not.in` filter
    q = q.not("id", "in", `(${excludeIds.join(",")})`);
  }
  const { data: rows, error } = await q;

  if (error) throw new Error(`select failed: ${error.message}`);
  if (!rows || rows.length === 0) return { scanned: 0, reclassified: 0, kept: 0, errors: 0, moved: [] as any[], keptIds: [] as string[], done: true };

  const moved: { id: string; title: string; confidence: number }[] = [];
  const keptIds: string[] = [];
  let errors = 0;

  const CHUNK = 1;
  for (let i = 0; i < rows.length; i += CHUNK) {
    if (i > 0) await new Promise((r) => setTimeout(r, 800));
    const chunk = rows.slice(i, i + CHUNK);
    const results = await Promise.allSettled(chunk.map((r: Row) => classify(r)));
    for (let j = 0; j < chunk.length; j++) {
      const row = chunk[j];
      const r = results[j];
      if (r.status === "rejected") {
        errors++;
        const status = (r.reason as any)?.status;
        if (status === 429 || status === 402) {
          return {
            scanned: i + j,
            reclassified: moved.length,
            kept: keptIds.length,
            errors,
            moved,
            keptIds,
            done: false,
            halted: status,
          };
        }
        keptIds.push(row.id);
        continue;
      }
      const cls = r.value;
      if (cls && cls.type === "job" && cls.confidence >= 0.7) {
        const { error: upErr } = await supabase
          .from("jobs")
          .update({ listing_type: "job" })
          .eq("id", row.id);
        if (upErr) {
          errors++;
          console.error("update failed", row.id, upErr.message);
          keptIds.push(row.id);
        } else {
          moved.push({ id: row.id, title: row.title, confidence: cls.confidence });
        }
      } else {
        keptIds.push(row.id);
      }
    }
  }

  return {
    scanned: rows.length,
    reclassified: moved.length,
    kept: keptIds.length,
    errors,
    moved,
    keptIds,
    done: rows.length < batchSize,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authFail = await requireCronAuth(req);
  if (authFail) return authFail;

  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not set" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const batchSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("batch") ?? "50", 10)));
  const maxBatches = Math.min(50, Math.max(1, parseInt(url.searchParams.get("max_batches") ?? "1", 10)));

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const summary = {
    batches: 0,
    scanned: 0,
    reclassified: 0,
    kept: 0,
    errors: 0,
    moved: [] as any[],
    halted: null as null | number,
  };

  const excludeIds: string[] = [];
  for (let b = 0; b < maxBatches; b++) {
    let result;
    try {
      result = await processBatch(supabase, batchSize, excludeIds);
    } catch (e) {
      return new Response(
        JSON.stringify({ ...summary, error: (e as Error).message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    summary.batches++;
    summary.scanned += result.scanned;
    summary.reclassified += result.reclassified;
    summary.kept += result.kept;
    summary.errors += result.errors;
    summary.moved.push(...result.moved);
    // Exclude rows the model kept as opportunity from subsequent batches
    excludeIds.push(...((result as any).keptIds ?? []));
    if ((result as any).halted) {
      summary.halted = (result as any).halted;
      break;
    }
    if (result.done) break;
    if (result.scanned === 0) break;
  }

  // Trim moved list in response to keep payload small
  const responseBody = {
    ...summary,
    moved_sample: summary.moved.slice(0, 30),
    moved: undefined,
  };

  return new Response(JSON.stringify(responseBody, null, 2), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
