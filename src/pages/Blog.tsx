import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Seo } from "@/components/Seo";
import { Input } from "@/components/ui/input";
import { useArticles, readingTime } from "@/hooks/useArticles";
import { breadcrumbJsonLd, buildMeta, itemListJsonLd } from "@/lib/seo";
import { cn } from "@/lib/utils";

export function formatDate(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function ArticleCover({ src, title, className }: { src: string | null; title: string; className?: string }) {
  if (src) {
    return (
      <img src={src} alt={title} loading="lazy" className={cn("w-full object-cover", className)} />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={cn("flex w-full items-end bg-secondary p-4", className)}
    >
      <span className="font-display text-lg leading-tight text-secondary-foreground/70 line-clamp-2">
        {title}
      </span>
    </div>
  );
}

const Blog = () => {
  const { data: articles = [], isLoading } = useArticles();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const category = params.get("category") ?? "";
  const tag = params.get("tag") ?? "";

  const setParam = (k: string, v: string) =>
    setParams((prev) => {
      const n = new URLSearchParams(prev);
      if (v) n.set(k, v);
      else n.delete(k);
      return n;
    });

  const categories = useMemo(
    () => Array.from(new Set(articles.map((a) => a.category).filter(Boolean))) as string[],
    [articles]
  );
  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    articles.forEach((a) => (a.tags ?? []).forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([t]) => t);
  }, [articles]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return articles.filter(
      (a) =>
        (!category || a.category === category) &&
        (!tag || (a.tags ?? []).includes(tag)) &&
        (!term ||
          a.title.toLowerCase().includes(term) ||
          (a.excerpt ?? "").toLowerCase().includes(term))
    );
  }, [articles, q, category, tag]);

  const meta = buildMeta({
    title: "Career Advice for Remote Workers",
    description:
      "Practical career advice for remote job seekers: interview tips, salary guides, CV advice and how to find legitimate remote work.",
    path: "/blog",
  });

  return (
    <Layout>
      <Seo
        {...meta}
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Career Advice", path: "/blog" },
          ]),
          itemListJsonLd(
            "Career advice articles",
            articles.slice(0, 20).map((a) => ({ name: a.title, path: `/blog/${a.slug}` }))
          ),
        ]}
      />
      <section className="border-b border-rule bg-card">
        <div className="container py-10 md:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Career Advice
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight md:text-5xl">
            Advice for finding and thriving in remote work
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Interview tips, salary guides and practical advice for job seekers applying to fully remote roles.
          </p>
          <div className="mt-6 max-w-md">
            <label htmlFor="blog-search" className="sr-only">Search articles</label>
            <Input
              id="blog-search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setParam("q", e.target.value);
              }}
              placeholder="Search articles"
            />
          </div>
        </div>
      </section>

      <div className="container py-8 md:py-12">
        {(categories.length > 0 || tags.length > 0) && (
          <div className="mb-8 space-y-3">
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2" aria-label="Categories">
                {["", ...categories].map((c) => (
                  <button
                    key={c || "all"}
                    onClick={() => setParam("category", c)}
                    className={cn(
                      "rounded-sm border px-3 py-1.5 text-sm transition-colors",
                      category === c
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-rule bg-background text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {c || "All categories"}
                  </button>
                ))}
              </div>
            )}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5" aria-label="Tags">
                {tags.map((t) => (
                  <button
                    key={t}
                    onClick={() => setParam("tag", tag === t ? "" : t)}
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs",
                      tag === t
                        ? "border-primary text-primary"
                        : "border-rule text-muted-foreground hover:text-foreground"
                    )}
                  >
                    #{t}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-sm bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <h2 className="font-display text-2xl">
              {articles.length ? "No articles match your filters" : "Articles are on the way"}
            </h2>
            <p className="mt-2 text-muted-foreground">
              In the meantime, <Link to="/" className="text-primary underline underline-offset-2">browse remote jobs</Link>.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a) => (
              <article key={a.id} className="group overflow-hidden rounded-sm border border-rule bg-card">
                <Link to={`/blog/${a.slug}`} className="block">
                  <ArticleCover src={a.cover_image_url} title={a.title} className="aspect-[16/9]" />
                  <div className="p-5">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                      {a.category}
                    </p>
                    <h2 className="mt-2 font-display text-xl leading-snug group-hover:text-primary">
                      {a.title}
                    </h2>
                    {a.excerpt && (
                      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{a.excerpt}</p>
                    )}
                    <p className="mt-4 text-xs text-muted-foreground">
                      {formatDate(a.published_at)} · {readingTime(a.content_markdown)} min read
                    </p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Blog;
