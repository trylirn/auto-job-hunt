import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireCronAuth } from "../_shared/require-cron.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-token",
};

const GRAPHQL_URL = "https://graph.buffer.com/";
const GRAPHQL_ALT_URL = "https://api.buffer.com/graphql";
const REST_BASE = "https://api.bufferapp.com/1";

const MAX_PER_RUN = 3;

type JobRow = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  job_type: string | null;
  employment_type: string | null;
  is_remote: boolean | null;
  slug: string | null;
};

function buildMessage(job: JobRow): string {
  const bits: string[] = [];
  if (job.location) bits.push(`📍 ${job.location}`);
  else if (job.is_remote) bits.push("📍 Remote");
  const type = job.employment_type || job.job_type;
  if (type) bits.push(`💼 ${type}`);

  const url = `https://eplicant.com/job/${job.slug || job.id}`;
  return [
    `🚀 Now hiring: ${job.title} at ${job.company}`,
    bits.length ? bits.join(" | ") : "",
    "",
    `Apply here: ${url}`,
    "",
    "#RemoteJobs #Hiring #RemoteWork #Careers",
  ]
    .filter((l) => l !== undefined)
    .join("\n");
}

async function graphql(
  token: string,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<{ ok: boolean; url: string; status: number; body: unknown }> {
  let last = { ok: false, url: "", status: 0, body: null as unknown };
  for (const url of [GRAPHQL_URL, GRAPHQL_ALT_URL]) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-buffer-client-id": "webapp-publishing",
        },
        body: JSON.stringify({ query, variables }),
      });
      const text = await res.text();
      let body: unknown;
      try {
        body = JSON.parse(text);
      } catch {
        body = text.slice(0, 500);
      }
      last = { ok: res.ok, url, status: res.status, body };
      const hasErrors =
        body && typeof body === "object" && "errors" in (body as object);
      if (res.ok && !hasErrors) return last;
    } catch (e) {
      last = { ok: false, url, status: 0, body: String(e) };
    }
  }
  return last;
}

async function restProfiles(token: string) {
  const res = await fetch(`${REST_BASE}/profiles.json?access_token=${token}`);
  const text = await res.text();
  try {
    return { status: res.status, body: JSON.parse(text) };
  } catch {
    return { status: res.status, body: text.slice(0, 500) };
  }
}

/** Resolve the LinkedIn channel/profile id, preferring an explicit secret. */
async function resolveLinkedInChannel(
  token: string,
): Promise<{ id: string | null; via: string; detail?: unknown }> {
  const explicit = Deno.env.get("BUFFER_LINKEDIN_CHANNEL_ID");
  if (explicit) return { id: explicit, via: "secret" };

  const gql = await graphql(
    token,
    `query Channels {
      account {
        currentOrganization {
          channels { id service serviceType serviceUsername }
        }
      }
    }`,
  );
  const channels =
    // deno-lint-ignore no-explicit-any
    (gql.body as any)?.data?.account?.currentOrganization?.channels;
  if (Array.isArray(channels)) {
    const li = channels.find((c: { service?: string }) =>
      (c.service || "").toLowerCase().includes("linkedin")
    );
    if (li?.id) return { id: li.id, via: "graphql" };
  }

  const rest = await restProfiles(token);
  if (Array.isArray(rest.body)) {
    const li = rest.body.find((p: { service?: string }) =>
      (p.service || "").toLowerCase().includes("linkedin")
    );
    if (li?.id) return { id: li.id, via: "rest" };
  }

  return { id: null, via: "none", detail: { gql: gql.body, rest: rest.body } };
}

/** Publish immediately. Tries GraphQL first, falls back to REST v1 now=true. */
async function publish(
  token: string,
  channelId: string,
  text: string,
): Promise<{ ok: boolean; id?: string; error?: string; via: string }> {
  const gql = await graphql(
    token,
    `mutation CreatePost($input: PostCreateInput!) {
      postCreate(input: $input) {
        __typename
        ... on PostCreateSuccess { post { id status } }
        ... on UnauthorizedError { message }
        ... on InvalidInputError { message }
        ... on NotFoundError { message }
      }
    }`,
    {
      input: {
        organizationId: undefined,
        channels: [{ id: channelId }],
        text,
        status: "sent",
        shareNow: true,
      },
    },
  );
  // deno-lint-ignore no-explicit-any
  const created = (gql.body as any)?.data?.postCreate;
  if (created?.post?.id) {
    return { ok: true, id: created.post.id, via: "graphql" };
  }

  const params = new URLSearchParams();
  params.set("access_token", token);
  params.set("text", text);
  params.set("now", "true");
  params.append("profile_ids[]", channelId);
  const res = await fetch(`${REST_BASE}/updates/create.json`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const raw = await res.text();
  // deno-lint-ignore no-explicit-any
  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    body = raw.slice(0, 400);
  }
  if (res.ok && body?.success) {
    return { ok: true, id: body?.updates?.[0]?.id, via: "rest" };
  }
  return {
    ok: false,
    via: "rest",
    error: JSON.stringify({ graphql: gql.body, rest: body }).slice(0, 800),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  const authFail = await requireCronAuth(req);
  if (authFail) return authFail;

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  const token = Deno.env.get("BUFFER_ACCESS_TOKEN");
  if (!token) return json({ success: false, error: "missing_buffer_token" }, 500);

  const url = new URL(req.url);
  const probe = url.searchParams.get("probe");
  const dryRun = url.searchParams.get("dry_run") === "1";
  const limit = Math.min(
    Number(url.searchParams.get("limit")) || MAX_PER_RUN,
    10,
  );

  try {
    if (probe === "graphql") {
      const body = await req.json().catch(() => ({}));
      const out = await graphql(token, body.query ?? "{ __typename }", body.variables ?? {});
      return json(out);
    }

    if (probe === "channels") {
      const gql = await graphql(
        token,
        `query Channels {
          account {
            currentOrganization { id name channels { id service serviceId name } }
          }
        }`,
      );
      return json({ graphql: gql });
    }


    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const { data: candidates, error: jobsErr } = await supabase
      .from("jobs")
      .select(
        "id,title,company,location,job_type,employment_type,is_remote,slug,created_at",
      )
      .is("archived_at", null)
      .eq("listing_type", "job")
      .or("source.is.null,source.neq.himalayas")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(40);
    if (jobsErr) throw jobsErr;

    const rows = (candidates || []) as JobRow[];
    if (rows.length === 0) return json({ success: true, posted: 0, reason: "no_new_jobs" });

    const { data: alreadyPosted } = await supabase
      .from("job_social_posts")
      .select("job_id")
      .eq("platform", "linkedin")
      .in("job_id", rows.map((r) => r.id));
    const posted = new Set((alreadyPosted || []).map((r) => r.job_id));

    const queue = rows.filter((r) => !posted.has(r.id)).slice(0, limit);
    if (queue.length === 0) return json({ success: true, posted: 0, reason: "all_posted" });

    const channel = await resolveLinkedInChannel(token);
    if (!channel.id) {
      return json(
        { success: false, error: "linkedin_channel_not_found", detail: channel.detail },
        500,
      );
    }

    if (dryRun) {
      return json({
        success: true,
        dry_run: true,
        channel: channel.id,
        via: channel.via,
        preview: queue.map(buildMessage),
      });
    }

    const results: { job: string; ok: boolean; via: string; error?: string }[] = [];
    for (const job of queue) {
      const out = await publish(token, channel.id, buildMessage(job));
      results.push({ job: job.title, ok: out.ok, via: out.via, error: out.error });
      await supabase.from("job_social_posts").upsert(
        {
          job_id: job.id,
          platform: "linkedin",
          external_post_id: out.id ?? null,
          status: out.ok ? "sent" : "failed",
          error: out.ok ? null : out.error ?? null,
        },
        { onConflict: "job_id,platform" },
      );
      if (!out.ok) break; // stop early on credential/API failures
    }

    console.log(`Buffer LinkedIn run: ${results.filter((r) => r.ok).length}/${queue.length} posted`);
    return json({
      success: results.every((r) => r.ok),
      channel_via: channel.via,
      posted: results.filter((r) => r.ok).length,
      results,
    });
  } catch (error) {
    console.error("post-to-buffer error", error);
    return json({ success: false, error: (error as Error).message }, 500);
  }
});
