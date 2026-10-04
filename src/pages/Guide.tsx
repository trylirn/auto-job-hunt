import { Link, useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { GUIDES, getGuide } from "@/data/guides";
import { absoluteUrl, breadcrumbJsonLd, buildMeta, SITE_LOGO, SITE_NAME } from "@/lib/seo";
import NotFound from "./NotFound";

const GuidePage = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const guide = getGuide(slug);
  if (!guide) return <NotFound />;

  const path = `/guides/${guide.slug}`;
  const meta = buildMeta({ title: guide.metaTitle, description: guide.metaDescription, path, type: "article" });
  const others = GUIDES.filter((g) => g.slug !== guide.slug);

  return (
    <Layout>
      <Seo
        {...meta}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: guide.title,
            description: meta.description,
            image: SITE_LOGO,
            author: { "@type": "Organization", name: SITE_NAME },
            publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: SITE_LOGO } },
            mainEntityOfPage: absoluteUrl(path),
          },
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Guides", path: "/blog" },
            { name: guide.title, path },
          ]),
        ]}
      />
      <article className="container max-w-3xl py-10 md:py-14">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-1.5">/</span>
          <Link to="/blog" className="hover:text-foreground">Career advice</Link>
        </nav>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Guide</p>
        <h1 className="mt-3 font-display text-3xl leading-tight md:text-5xl">{guide.title}</h1>
        <p className="mt-5 text-lg text-muted-foreground">{guide.intro}</p>

        <div className="prose prose-neutral mt-8 max-w-none dark:prose-invert prose-headings:font-display">
          {guide.sections.map((s) => (
            <section key={s.heading}>
              <h2>{s.heading}</h2>
              {s.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
              {s.list && <ul>{s.list.map((l) => <li key={l}>{l}</li>)}</ul>}
            </section>
          ))}
        </div>

        <section className="mt-10 border-t border-rule pt-6">
          <h2 className="font-display text-xl">Related reading</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {guide.related.map((r) => (
              <li key={r.to}><Link to={r.to} className="text-primary underline underline-offset-2">{r.label}</Link></li>
            ))}
          </ul>
        </section>

        <aside className="mt-10 rounded-sm border border-rule bg-card p-6 md:flex md:items-center md:justify-between md:gap-6">
          <div>
            <h2 className="font-display text-2xl">Ready for your next remote role?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Fully remote jobs from established employers, updated daily.</p>
          </div>
          <Button asChild className="mt-4 rounded-sm md:mt-0"><Link to="/">Browse remote jobs</Link></Button>
        </aside>
      </article>

      <section className="border-t border-rule bg-card">
        <div className="container py-10">
          <h2 className="font-display text-2xl">More guides</h2>
          <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((g) => (
              <li key={g.slug}>
                <Link to={`/guides/${g.slug}`} className="font-display text-lg leading-snug hover:text-primary">{g.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </Layout>
  );
};

export default GuidePage;
