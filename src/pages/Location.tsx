import { useState, useCallback } from "react";
import { useParams, Link, useSearchParams, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JobCard } from "@/components/JobCard";
import { JobCardSkeleton } from "@/components/JobCardSkeleton";
import { JobPagination } from "@/components/JobPagination";
import { useJobs } from "@/hooks/useJobs";
import { LOCATION_HUBS, getHubBySlug } from "@/data/locationHubs";
import { Briefcase, MapPin } from "lucide-react";

const SITE = "https://eplicant.com";

export default function Location() {
  const { city = "" } = useParams<{ city: string }>();
  const hub = getHubBySlug(city);
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

  if (!hub) return <Navigate to="/" replace />;

  const { data, isLoading } = useJobs({
    location: hub.locationQuery,
    page,
    pageSize: 24,
  });

  const canonical = `${SITE}/jobs/in/${hub.slug}`;
  const title = `Jobs in ${hub.city} — International Development & UN Roles | Eplicant`;
  const description = `Latest international development, UN, and NGO jobs in ${hub.city}, ${hub.country}. ${hub.blurb}`;

  const jobs = data?.jobs ?? [];

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Jobs in ${hub.city}`,
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
      { "@type": "ListItem", position: 2, name: "Locations", item: SITE + "/jobs/in" },
      { "@type": "ListItem", position: 3, name: hub.city, item: canonical },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={`${SITE}/logo.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <script type="application/ld+json">{JSON.stringify(itemListLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>

      <Header />

      <section className="border-b bg-card">
        <div className="container py-8 md:py-12">
          <nav className="text-xs text-muted-foreground mb-3" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span className="mx-1.5">/</span>
            <span>Jobs in {hub.city}</span>
          </nav>
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-4xl">
            Jobs in {hub.city}, {hub.country}
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
            Open roles in {hub.city}
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
              No open roles in {hub.city} right now
            </h3>
            <p className="mt-1 text-muted-foreground">
              Check back soon — new jobs are added daily.
            </p>
            <Link
              to="/"
              className="mt-4 text-sm text-primary hover:underline"
            >
              Browse all jobs →
            </Link>
          </div>
        )}
      </main>

      <section className="border-t bg-card">
        <div className="container py-8 md:py-12">
          <h2 className="font-display text-lg font-semibold md:text-xl mb-4">
            Other major hubs
          </h2>
          <ul className="flex flex-wrap gap-2">
            {LOCATION_HUBS.filter((h) => h.slug !== hub.slug).map((h) => (
              <li key={h.slug}>
                <Link
                  to={`/jobs/in/${h.slug}`}
                  className="inline-flex items-center gap-1 rounded-full border bg-background px-3 py-1.5 text-sm hover:border-primary/40 hover:text-foreground"
                >
                  <MapPin className="h-3 w-3" /> Jobs in {h.city}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Footer />
    </div>
  );
}
