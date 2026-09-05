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

/** Resolve the LinkedIn channel id, preferring an explicit secret. */
async function resolveLinkedInChannel(
  token: string,
): Promise<{ id: string | null; via: string; detail?: unknown }> {
  const explicit = Deno.env.get("BUFFER_LINKEDIN_CHANNEL_ID");
  if (explicit) return { id: explicit, via: "secret" };

  const acct = await graphql(
    token,
    `query Account { account { id organizations { id name } } }`,
  );
  // deno-lint-ignore no-explicit-any
  const orgs = (acct.body as any)?.data?.account?.organizations;
  const orgId = Array.isArray(orgs) ? orgs[0]?.id : null;
  if (!orgId) return { id: null, via: "none", detail: acct.body };

  const chans = await graphql(
    token,
    `query Channels($input: ChannelsInput!) {
      channels(input: $input) { id name service }
    }`,
    { input: { organizationId: orgId } },
  );
  // deno-lint-ignore no-explicit-any
  const list = (chans.body as any)?.data?.channels;
  if (Array.isArray(list)) {
    const li = list.find((c: { service?: string }) =>
      (c.service || "").toLowerCase().includes("linkedin")
    );
    if (li?.id) return { id: li.id, via: "graphql" };
  }
  return { id: null, via: "none", detail: chans.body };
}

/** Publish immediately to the given Buffer channel. */
async function publish(
  token: string,
  channelId: string,
  text: string,
): Promise<{ ok: boolean; id?: string; error?: string; via: string }> {
  const gql = await graphql(
    token,
    `mutation CreatePost($input: CreatePostInput!) {
      createPost(input: $input) {
        __typename
        ... on PostActionSuccess { post { id status } }
        ... on UnauthorizedError { message }
        ... on InvalidInputError { message }
        ... on NotFoundError { message }
        ... on LimitReachedError { message }
        ... on RestProxyError { message }
        ... on UnexpectedError { message }
      }
    }`,
    {
      input: {
        channelId,
        text,
        assets: [],
        mode: "shareNow",
        needsApproval: false,
        schedulingType: "automatic",
        source: "eplicant-auto",
      },
    },
  );
  // deno-lint-ignore no-explicit-any
  const res = (gql.body as any)?.data?.createPost;
  if (res?.post?.id) return { ok: true, id: res.post.id, via: "graphql" };
  return {
    ok: false,
    via: "graphql",
    error: JSON.stringify(gql.body).slice(0, 800),
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
