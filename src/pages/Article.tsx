import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Layout } from "@/components/Layout";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { useArticle, useArticles, readingTime, normalizeCitations } from "@/hooks/useArticles";
import { ArticleCover, formatDate } from "@/pages/Blog";
import { absoluteUrl, breadcrumbJsonLd, buildMeta, clampDescription, SITE_LOGO, SITE_NAME } from "@/lib/seo";

const ArticlePage = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const { data: article, isLoading } = useArticle(slug);
  const { data: all = [] } = useArticles();

  if (isLoading) {
    return (
      <Layout>
        <div className="container max-w-3xl space-y-4 py-16">
          <div className="h-10 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
        </div>
      </Layout>
    );
  }

  if (!article) {
    const meta = buildMeta({ title: "Article not found", description: "This article is not available.", path: `/blog/${slug}`, noindex: true });
    return (
      <Layout>
        <Seo {...meta} statusCode={404} />
        <div className="container py-20 text-center">
          <h1 className="font-display text-3xl">Article not found</h1>
          <p className="mt-3 text-muted-foreground">
            <Link to="/blog" className="text-primary underline underline-offset-2">Back to Career Advice</Link>
          </p>
        </div>
      </Layout>
    );
  }

  const path = `/blog/${article.slug}`;
  const description = article.meta_description || article.excerpt || clampDescription(article.content_markdown.replace(/[#*_>`]/g, ""));
  const meta = buildMeta({
    title: article.seo_title || article.title,
    description,
    path,
    image: article.cover_image_url || undefined,
    type: "article",
  });
  const citations = normalizeCitations(article.citations);
  const minutes = readingTime(article.content_markdown);
  const related = all
    .filter((a) => a.slug !== article.slug)
    .sort((a, b) => Number(b.category === article.category) - Number(a.category === article.category))
    .slice(0, 3);

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: meta.description,
    image: article.cover_image_url || SITE_LOGO,
    datePublished: article.published_at,
    author: { "@type": "Person", name: article.author_name || "Editorial Team" },
    publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: SITE_LOGO } },
    mainEntityOfPage: absoluteUrl(path),
    keywords: (article.tags ?? []).join(", "),
  };

  return (
    <Layout>
      <Seo
        {...meta}
        jsonLd={[
          articleLd,
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Career Advice", path: "/blog" },
            { name: article.title, path },
          ]),
        ]}
      />
      <article className="container max-w-3xl py-10 md:py-14">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-1.5">/</span>
          <Link to="/blog" className="hover:text-foreground">Career Advice</Link>
        </nav>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {article.category}
        </p>
        <h1 className="mt-3 font-display text-3xl leading-tight md:text-5xl">{article.title}</h1>
        {article.excerpt && <p className="mt-4 text-lg text-muted-foreground">{article.excerpt}</p>}
        <p className="mt-5 text-sm text-muted-foreground">
          By {article.author_name || "Editorial Team"} · {formatDate(article.published_at)} · {minutes} min read
        </p>

        {article.cover_image_url && (
          <ArticleCover src={article.cover_image_url} title={article.title} className="mt-8 aspect-[16/9] rounded-sm" />
        )}

        <div className="prose prose-neutral mt-8 max-w-none dark:prose-invert prose-headings:font-display prose-a:text-primary">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => {
                const external = href && /^https?:\/\//.test(href) && !href.includes("eplicant.com");
                return (
                  <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                    {children}
                  </a>
                );
              },
              h1: ({ children }) => <h2>{children}</h2>,
            }}
          >
            {article.content_markdown}
          </ReactMarkdown>
        </div>

        {(article.tags ?? []).length > 0 && (
          <ul className="mt-8 flex flex-wrap gap-1.5" aria-label="Tags">
            {article.tags!.map((t) => (
              <li key={t}>
                <Link to={`/blog?tag=${encodeURIComponent(t)}`} className="rounded-full border border-rule px-2.5 py-0.5 text-xs text-muted-foreground hover:text-foreground">
                  #{t}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {citations.length > 0 && (
          <section className="mt-10 border-t border-rule pt-6">
            <h2 className="font-display text-xl">Sources</h2>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
              {citations.map((c, i) => {
                const label = c.title || c.source || c.url || `Source ${i + 1}`;
                return (
                  <li key={i}>
                    {c.url ? (
                      <a href={c.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
                        {label}
                      </a>
                    ) : (
                      label
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        <aside className="mt-10 rounded-sm border border-rule bg-card p-6 md:flex md:items-center md:justify-between md:gap-6">
          <div>
            <h2 className="font-display text-2xl">Ready for your next remote role?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Fully remote jobs from established employers, updated daily.</p>
          </div>
          <Button asChild className="mt-4 rounded-sm md:mt-0">
            <Link to="/">Browse remote jobs</Link>
          </Button>
        </aside>
      </article>

      {related.length > 0 && (
        <section className="border-t border-rule bg-card">
          <div className="container py-10">
            <h2 className="font-display text-2xl">More career advice</h2>
            <ul className="mt-5 grid gap-5 sm:grid-cols-3">
              {related.map((a) => (
                <li key={a.id}>
                  <Link to={`/blog/${a.slug}`} className="group block">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">{a.category}</p>
                    <p className="mt-1 font-display text-lg leading-snug group-hover:text-primary">{a.title}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default ArticlePage;
