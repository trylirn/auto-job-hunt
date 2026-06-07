import { useState, useCallback, useMemo } from "react";
import { useParams, Link, useSearchParams, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JobCard } from "@/components/JobCard";
import { JobCardSkeleton } from "@/components/JobCardSkeleton";
import { JobPagination } from "@/components/JobPagination";
import { useJobs } from "@/hooks/useJobs";
import { COUNTRY_HUBS, getCountryHubBySlug, LEGACY_CITY_REDIRECTS } from "@/data/countryHubs";
import { CITY_HUBS, getCityHubBySlug } from "@/data/cityHubs";
import { Briefcase, MapPin } from "lucide-react";

const SITE = "https://eplicant.com";

interface LocationPageProps {
  mode: "country" | "city";
}

export default function LocationPage({ mode }: LocationPageProps) {
  const params = useParams<{ country?: string; city?: string }>();
  const slug = (mode === "country" ? params.country : params.city) ?? "";

  const hub = useMemo(() => {
    if (mode === "country") {
      const h = getCountryHubBySlug(slug);
      return h
        ? {
            slug: h.slug,
            displayName: h.name,
            subtitle: h.name,
            blurb: h.blurb,
            keywords: h.keywords,
            locationQuery: h.locationQuery,
            urlPath: `/jobs/in/${h.slug}`,
          }
        : null;
    }
    const h = getCityHubBySlug(slug);
    return h
      ? {
          slug: h.slug,
          displayName: h.city,
          subtitle: `${h.city}, ${h.country}`,
          blurb: h.blurb,
          keywords: h.keywords,
          locationQuery: h.locationQuery,
          urlPath: `/jobs/in/cities/${h.slug}`,
        }
      : null;
  }, [mode, slug]);

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
  });

  if (!hub) return <Navigate to="/jobs/in" replace />;

  const canonical = `${SITE}${hub.urlPath}`;
  const title =
    mode === "country"
      ? `Jobs in ${hub.displayName} — International Development & UN Roles | Eplicant`
      : `Jobs in ${hub.displayName} — International Development & UN Roles | Eplicant`;
  const description = `Latest international development, UN, and NGO jobs in ${hub.subtitle}. ${hub.blurb}`;

  const jobs = data?.jobs ?? [];

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Jobs in ${hub.displayName}`,
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
      { "@type": "ListItem", position: 2, name: "Jobs by location", item: SITE + "/jobs/in" },
      { "@type": "ListItem", position: 3, name: hub.displayName, item: canonical },
    ],
  };

  const otherHubs =
    mode === "country"
      ? COUNTRY_HUBS.filter((h) => h.slug !== hub.slug).slice(0, 12)
      : CITY_HUBS.filter((h) => h.slug !== hub.slug).slice(0, 12);

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
            <Link to="/jobs/in" className="hover:text-foreground">Jobs by location</Link>
            <span className="mx-1.5">/</span>
            <span>Jobs in {hub.displayName}</span>
          </nav>
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-4xl">
            Jobs in {hub.subtitle}
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
            Open roles in {hub.displayName}
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
              No open roles in {hub.displayName} right now
            </h3>
            <p className="mt-1 text-muted-foreground">
              Check back soon — new jobs are added daily.
            </p>
            <Link to="/" className="mt-4 text-sm text-primary hover:underline">
              Browse all jobs →
            </Link>
          </div>
        )}
      </main>

      <section className="border-t bg-card">
        <div className="container py-8 md:py-12">
          <h2 className="font-display text-lg font-semibold md:text-xl mb-4">
            {mode === "country" ? "Other countries" : "Other cities"}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {otherHubs.map((h) => {
              const isCity = "city" in h;
              const label = isCity ? h.city : h.name;
              const to = isCity ? `/jobs/in/cities/${h.slug}` : `/jobs/in/${h.slug}`;
              return (
                <li key={h.slug}>
                  <Link
                    to={to}
                    className="inline-flex items-center gap-1 rounded-full border bg-background px-3 py-1.5 text-sm hover:border-primary/40 hover:text-foreground"
                  >
                    <MapPin className="h-3 w-3" /> Jobs in {label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-4">
            <Link to="/jobs/in" className="text-sm text-primary hover:underline">
              Browse all locations →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

/** Legacy /jobs/in/:city redirect — preserves backlinks from the old 8 city URLs. */
export function LegacyCityRedirect() {
  const { city = "" } = useParams<{ city: string }>();
  const target = LEGACY_CITY_REDIRECTS[city.toLowerCase()];
  if (target) return <Navigate to={target} replace />;
  // If it matches a current country hub slug, route there
  if (getCountryHubBySlug(city)) return <Navigate to={`/jobs/in/${city}`} replace />;
  if (getCityHubBySlug(city)) return <Navigate to={`/jobs/in/cities/${city}`} replace />;
  return <Navigate to="/jobs/in" replace />;
}
