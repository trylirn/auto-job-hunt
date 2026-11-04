import { useState, useCallback, useMemo } from "react";
import { useParams, Link, useSearchParams, Navigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { HUB_MIN_JOBS, clampDescription } from "@/lib/seo";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JobCard } from "@/components/JobCard";
import { JobCardSkeleton } from "@/components/JobCardSkeleton";
import { JobPagination } from "@/components/JobPagination";
import { useJobs } from "@/hooks/useJobs";
import { COUNTRY_HUBS, getCountryHubBySlug, hubHeading, LEGACY_CITY_REDIRECTS } from "@/data/countryHubs";
import { Briefcase, MapPin } from "lucide-react";

const SITE = "https://eplicant.com";

export default function LocationPage() {
  const params = useParams<{ country?: string }>();
  const slug = params.country ?? "";

  const hub = useMemo(() => {
    const h = getCountryHubBySlug(slug);
    return h
      ? {
          slug: h.slug,
          displayName: h.name,
          blurb: h.blurb,
          keywords: h.keywords,
          locationQuery: h.locationQuery,
          urlPath: `/jobs/in/${h.slug}`,
        }
      : null;
  }, [slug]);

  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const setPage = useCallback(
    (p: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (p <= 1) next.delete("page");
        else next.set("page", String(p));
        return next;
      });
    },
    [setSearchParams]
  );

  const { data, isLoading } = useJobs({
    location: hub?.locationQuery ?? "",
    page,
    pageSize: 24,
    listingType: "jobs",
  });

  if (!hub) return <Navigate to="/jobs/in" replace />;

  const canonical = `${SITE}${hub.urlPath}`;
  const heading = hubHeading({ slug: hub.slug, name: hub.displayName });
  const title = `${heading} — Eplicant`;
  const description = clampDescription(hub.blurb);

  const jobs = data?.jobs ?? [];
  // Hubs with only a handful of jobs are thin pages: keep them out of the index.
  // Same rule (HUB_MIN_JOBS) is used by the edge function and the sitemap.
  const thinHub = !isLoading && (data?.totalCount ?? 0) < HUB_MIN_JOBS;

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: heading,
    itemListElement: jobs.slice(0, 20).map((j, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE}/job/${j.slug ?? j.id}`,
      name: j.title,
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "Remote jobs by country", item: SITE + "/jobs/in" },
      { "@type": "ListItem", position: 3, name: hub.displayName, item: canonical },
    ],
  };

  const otherHubs = COUNTRY_HUBS.filter((h) => h.slug !== hub.slug).slice(0, 12);

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title={title}
        description={description}
        canonical={canonical}
        image={`${SITE}/logo.png`}
        noindex={thinHub}
        jsonLd={[itemListLd, breadcrumbLd]}
      />

      <Header />

      <section className="border-b bg-card">
        <div className="container py-8 md:py-12">
          <nav className="text-xs text-muted-foreground mb-3" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span className="mx-1.5">/</span>
            <Link to="/jobs/in" className="hover:text-foreground">Remote jobs by country</Link>
            <span className="mx-1.5">/</span>
            <span>{hub.displayName}</span>
          </nav>
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-4xl">
            {heading}
          </h1>
          <p className="mt-3 max-w-3xl text-base text-muted-foreground md:text-lg">
            {hub.blurb}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {hub.keywords.map((k) => (
              <span
                key={k}
                className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground"
              >
                <MapPin className="h-3 w-3" /> {k}
              </span>
            ))}
          </div>
        </div>
      </section>

      <main className="container py-6 md:py-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold md:text-xl">
            Open remote roles
          </h2>
          {data && (
            <p className="text-sm text-muted-foreground">
              {data.totalCount} job{data.totalCount !== 1 ? "s" : ""} found
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 items-start">
            {Array.from({ length: 6 }).map((_, i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
        ) : jobs.length ? (
          <>
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 items-start">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
            {data && data.totalPages > 1 && (
              <div className="mt-6 md:mt-8">
                <JobPagination
                  currentPage={page}
                  totalPages={data.totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 font-display text-xl font-semibold">
              No remote roles for {hub.displayName} right now
            </h3>
            <p className="mt-1 text-muted-foreground">
              Check back soon — new remote jobs are added daily.
            </p>
            <Link to="/" className="mt-4 text-sm text-primary hover:underline">
              Browse all remote jobs →
            </Link>
          </div>
        )}
      </main>

      <section className="border-t bg-card">
        <div className="container py-8 md:py-12">
          <h2 className="font-display text-lg font-semibold md:text-xl mb-4">
            Other countries
          </h2>
          <ul className="flex flex-wrap gap-2">
            {otherHubs.map((h) => (
              <li key={h.slug}>
                <Link
                  to={`/jobs/in/${h.slug}`}
                  className="inline-flex items-center gap-1 rounded-full border bg-background px-3 py-1.5 text-sm hover:border-primary/40 hover:text-foreground"
                >
                  <MapPin className="h-3 w-3" /> Remote jobs from {h.name}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Link to="/jobs/in" className="text-sm text-primary hover:underline">
              Browse all countries →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

/** Legacy city URLs (`/jobs/in/:city` and `/jobs/in/cities/:city`) → country hub. */
export function LegacyCityRedirect() {
  const params = useParams<{ city?: string; country?: string }>();
  const slug = (params.country ?? params.city ?? "").toLowerCase();
  const target = LEGACY_CITY_REDIRECTS[slug];
  if (target) return <Navigate to={target} replace />;
  if (getCountryHubBySlug(slug)) return <Navigate to={`/jobs/in/${slug}`} replace />;
  return <Navigate to="/jobs/in" replace />;
}
