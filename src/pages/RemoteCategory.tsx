import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Seo } from "@/components/Seo";
import { REMOTE_CATEGORIES, getRemoteCategory } from "@/data/remoteCategories";
import { useSalaryData } from "@/hooks/useSalaryData";
import { computeBenchmarks, formatUsd, LEVELS } from "@/lib/salaryBenchmarks";
import { breadcrumbJsonLd, buildMeta, faqJsonLd, absoluteUrl } from "@/lib/seo";
import NotFound from "./NotFound";

interface MiniJob { id: string; slug: string | null; title: string; company: string; salary: string | null }

function useCategoryJobs(terms: string[]) {
  return useQuery({
    queryKey: ["category-jobs", terms],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("id,slug,title,company,salary")
        .is("archived_at", null)
        .or("source.is.null,source.neq.himalayas")
        .or(terms.map((t) => `title.ilike.%${t}%`).join(","))
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as MiniJob[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

const RemoteCategoryPage = () => {
  const { category = "" } = useParams<{ category: string }>();
  const cat = getRemoteCategory(category);
  const { data: jobs = [], isLoading } = useCategoryJobs(cat?.titleTerms ?? []);
  const { data: salary } = useSalaryData();
  const bench = useMemo(
    () => (salary ? computeBenchmarks(salary.rows).benchmarks.filter((b) => b.family === cat?.family) : []),
    [salary, cat?.family]
  );
  if (!cat) return <NotFound />;

  const path = `/remote-jobs/${cat.slug}`;
  const meta = buildMeta({ title: cat.metaTitle, description: cat.metaDescription, path });
  const rows = LEVELS.map((l) => bench.find((b) => b.level === l)).filter(Boolean) as typeof bench;

  return (
    <Layout>
      <Seo
        {...meta}
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Remote jobs by type", path: "/remote-jobs" },
            { name: cat.name, path },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: jobs.slice(0, 20).map((j, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: absoluteUrl(`/job/${j.slug ?? j.id}`),
              name: j.title,
            })),
          },
          faqJsonLd(cat.faqs),
        ]}
      />
      <div className="container max-w-4xl py-10 md:py-14">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-1.5">/</span>
          <Link to="/remote-jobs" className="hover:text-foreground">Remote jobs by type</Link>
        </nav>
        <h1 className="mt-4 font-display text-3xl leading-tight md:text-5xl">{cat.metaTitle}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{cat.intro}</p>

        <section className="mt-10">
          <h2 className="font-display text-2xl">Latest remote {cat.name.toLowerCase()} jobs</h2>
          {isLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading jobs…</p>
          ) : jobs.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No live roles right now — <Link to="/" className="text-primary underline">browse all remote jobs</Link>.</p>
          ) : (
            <ul className="mt-4 divide-y divide-rule border-y border-rule">
              {jobs.map((j) => (
                <li key={j.id}>
                  <Link to={`/job/${j.slug ?? j.id}`} className="flex flex-col gap-0.5 py-3 hover:text-primary sm:flex-row sm:items-baseline sm:justify-between">
                    <span className="font-medium">{j.title}</span>
                    <span className="text-sm text-muted-foreground">{j.company}{j.salary ? ` · ${j.salary}` : ""}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl">Common remote roles</h2>
          <dl className="mt-4 space-y-4">
            {cat.roles.map((r) => (
              <div key={r.name}>
                <dt className="font-semibold">{r.name}</dt>
                <dd className="text-muted-foreground">{r.summary}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl">Skills employers ask for</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">{cat.skills.map((s) => <li key={s}>{s}</li>)}</ul>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl">What these roles pay</h2>
          {rows.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Not enough published salary ranges yet. See <Link to="/tools" className="text-primary underline">salary insights</Link>.</p>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted-foreground">Annual USD, from salary ranges published on live listings.</p>
              <table className="mt-4 w-full text-sm">
                <thead><tr className="border-b border-rule text-left"><th className="py-2">Level</th><th>Low</th><th>Median</th><th>High</th><th>Listings</th></tr></thead>
                <tbody>
                  {rows.map((b) => (
                    <tr key={b.level} className="border-b border-rule">
                      <td className="py-2">{b.level}</td><td>{formatUsd(b.low)}</td><td>{formatUsd(b.median)}</td><td>{formatUsd(b.high)}</td><td>{b.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl">Tips for applying</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">{cat.tips.map((t) => <li key={t}>{t}</li>)}</ul>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl">Frequently asked questions</h2>
          <div className="mt-4 space-y-5">
            {cat.faqs.map((f) => (
              <div key={f.question}><h3 className="font-semibold">{f.question}</h3><p className="mt-1 text-muted-foreground">{f.answer}</p></div>
            ))}
          </div>
        </section>

        <section className="mt-12 border-t border-rule pt-6">
          <h2 className="font-display text-xl">Other remote job types</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {REMOTE_CATEGORIES.filter((c) => c.slug !== cat.slug).map((c) => (
              <li key={c.slug}><Link to={`/remote-jobs/${c.slug}`} className="inline-block rounded-full border border-rule px-3 py-1 text-sm hover:text-primary">Remote {c.name.toLowerCase()} jobs</Link></li>
            ))}
          </ul>
        </section>
      </div>
    </Layout>
  );
};

export const RemoteCategoriesIndex = () => {
  const meta = buildMeta({
    title: "Remote Jobs by Type",
    description: "Browse fully remote jobs by field — engineering, design, product, data, marketing, sales, support, operations, finance and HR — with salary data and hiring advice.",
    path: "/remote-jobs",
  });
  return (
    <Layout>
      <Seo {...meta} jsonLd={[breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Remote jobs by type", path: "/remote-jobs" }])]} />
      <div className="container max-w-4xl py-10 md:py-14">
        <h1 className="font-display text-3xl md:text-5xl">Remote jobs by type</h1>
        <p className="mt-4 text-lg text-muted-foreground">Pick a field to see live remote roles, typical pay and advice on getting hired.</p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {REMOTE_CATEGORIES.map((c) => (
            <li key={c.slug} className="rounded-sm border border-rule bg-card p-5">
              <Link to={`/remote-jobs/${c.slug}`} className="font-display text-xl hover:text-primary">Remote {c.name.toLowerCase()} jobs</Link>
              <p className="mt-1 text-sm text-muted-foreground">{c.metaDescription}</p>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
};

export default RemoteCategoryPage;
