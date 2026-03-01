import { useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { JobCard } from "@/components/JobCard";
import { JobCardSkeleton } from "@/components/JobCardSkeleton";
import { JobPagination } from "@/components/JobPagination";
import { useJobs } from "@/hooks/useJobs";
import { GraduationCap } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

const Opportunities = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useJobs({
    search: debouncedSearch,
    page,
    listingType: "opportunities",
  });

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Opportunities — Fellowships, Grants & Scholarships | JobFlow</title>
        <meta name="description" content="Discover fellowships, scholarships, grants, conferences, and internship opportunities." />
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
        <div className="mb-6 flex items-center justify-between">
          {data && (
            <p className="text-sm text-muted-foreground">
              {data.totalCount} opportunit{data.totalCount !== 1 ? "ies" : "y"} found
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-start">
            {Array.from({ length: 6 }).map((_, i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
        ) : data?.jobs.length ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-start">
              {data.jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
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
              Try adjusting your search
            </p>
          </div>
        )}
      </main>

      <footer className="border-t bg-card">
        <div className="container py-6 text-center text-sm text-muted-foreground">
          <p>JobFlow — Discover opportunities that match your ambitions.</p>
        </div>
      </footer>
    </div>
  );
};

export default Opportunities;
