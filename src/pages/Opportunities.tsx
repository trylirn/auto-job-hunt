import { useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { OpportunityFilters } from "@/components/OpportunityFilters";
import { JobCard } from "@/components/JobCard";
import { JobListItem } from "@/components/JobListItem";
import { JobCardSkeleton } from "@/components/JobCardSkeleton";
import { JobPagination } from "@/components/JobPagination";
import { ViewToggle } from "@/components/ViewToggle";
import { useJobs } from "@/hooks/useJobs";
import { GraduationCap } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

const Opportunities = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const debouncedSearch = useDebounce(search, 300);

  const hasActiveFilters = !!category || !!location || !!dateRange;

  const { data, isLoading } = useJobs({
    search: debouncedSearch,
    location,
    dateRange: dateRange as "24h" | "week" | "month" | "",
    page,
    listingType: "opportunities",
    opportunityCategory: category,
  });

  const clearFilters = useCallback(() => {
    setCategory("");
    setLocation("");
    setDateRange("");
    setPage(1);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Opportunities — Fellowships, Grants & Scholarships | Eplicant</title>
        <meta name="description" content="Discover fellowships, scholarships, grants, conferences, and internship opportunities." />
        <link rel="canonical" href="https://auto-job-hunt.lovable.app/opportunities" />
        <meta property="og:title" content="Opportunities — Fellowships, Grants & Scholarships | Eplicant" />
        <meta property="og:description" content="Discover fellowships, scholarships, grants, conferences, and internship opportunities." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://auto-job-hunt.lovable.app/opportunities" />
        <meta property="og:image" content="https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/efd56ee5-8a5e-49bb-89ba-4f7e8643961a/id-preview-92a29c77--87d973e3-d02d-4b67-b29b-996d6d79bb82.lovable.app-1772372990864.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Opportunities — Fellowships, Grants & Scholarships | Eplicant" />
        <meta name="twitter:description" content="Discover fellowships, scholarships, grants, conferences, and internship opportunities." />
      </Helmet>
      <Header />

      {/* Hero */}
      <section className="border-b bg-card">
        <div className="container py-12 md:py-16">
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Opportunities
          </h1>
          <p className="mt-3 max-w-xl text-lg text-muted-foreground">
            Fellowships, scholarships, grants, conferences & internships.
          </p>
          <div className="mt-6 max-w-2xl">
            <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
          </div>
        </div>
      </section>

      {/* Main */}
      <main className="container py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <OpportunityFilters
            category={category}
            onCategoryChange={(v) => { setCategory(v); setPage(1); }}
            location={location}
            onLocationChange={(v) => { setLocation(v); setPage(1); }}
            dateRange={dateRange}
            onDateRangeChange={(v) => { setDateRange(v); setPage(1); }}
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />
          <div className="flex items-center gap-3">
            {data && (
              <p className="text-sm text-muted-foreground">
                {data.totalCount} opportunit{data.totalCount !== 1 ? "ies" : "y"} found
              </p>
            )}
            <ViewToggle value={viewMode} onChange={setViewMode} />
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-start">
            {Array.from({ length: 6 }).map((_, i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
        ) : data?.jobs.length ? (
          <>
            {viewMode === "grid" ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-start">
                {data.jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {data.jobs.map((job) => (
                  <JobListItem key={job.id} job={job} />
                ))}
              </div>
            )}
            <div className="mt-8">
              <JobPagination
                currentPage={page}
                totalPages={data.totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <GraduationCap className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold">No opportunities found</h2>
            <p className="mt-1 text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </main>

      <footer className="border-t bg-card">
        <div className="container py-6 text-center text-sm text-muted-foreground">
          <p>Eplicant — Discover opportunities that match your ambitions.</p>
        </div>
      </footer>
    </div>
  );
};

export default Opportunities;
