import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import { useJobs } from "@/hooks/useJobs";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { ListingCard, ListingCardSkeleton } from "@/components/ListingCard";
import { ListingToolbar, type FilterState } from "@/components/ListingToolbar";
import { Pager } from "@/components/Pager";
import { Compass } from "lucide-react";
import type { Job } from "@/types/job";

const EMPTY_FILTERS: FilterState = {
  region: "",
  workMode: "",
  category: "",
  location: "",
  dateRange: "",
};

interface ListingBrowserProps {
  mode: "jobs" | "opportunities";
  basePath: string;
  heading: string;
  resultNoun: string;
  searchPlaceholder?: string;
  /** Receives the current page of results so the page can emit ItemList JSON-LD. */
  onResults?: (jobs: Job[]) => void;
}

export function ListingBrowser({
  mode,
  basePath,
  heading,
  resultNoun,
  searchPlaceholder,
  onResults,
}: ListingBrowserProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [view, setView] = useState<"grid" | "list">("grid");

  const debouncedSearch = useDebounce(search, 300);
  const { data: filterOptions } = useFilterOptions();

  const setPage = useCallback(
    (p: number) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (p <= 1) next.delete("page");
          else next.set("page", String(p));
          return next;
        },
        { replace: false }
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [setSearchParams]
  );

  const resetPage = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("page");
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  const handleFilterChange = useCallback(
    (key: keyof FilterState, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      resetPage();
    },
    [resetPage]
  );

  const handleSearchChange = useCallback(
    (v: string) => {
      setSearch(v);
      resetPage();
    },
    [resetPage]
  );

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    resetPage();
  }, [resetPage]);

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some(Boolean),
    [filters]
  );

  const { data, isLoading } = useJobs({
    search: debouncedSearch,
    jobType: mode === "jobs" ? filters.workMode : "",
    opportunityCategory: mode === "opportunities" ? filters.category : "",
    location: filters.location,
    dateRange: filters.dateRange as "24h" | "week" | "month" | "",
    region: filters.region as "us" | "non-us" | "",
    page,
    pageSize: 24,
    listingType: mode,
  });

  const jobs = data?.jobs ?? [];
  if (onResults && jobs.length) onResults(jobs);

  const locations =
    (mode === "jobs"
      ? filterOptions?.jobLocations
      : filterOptions?.opportunityLocations) ?? [];

  return (
    <>
      <ListingToolbar
        search={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder={searchPlaceholder}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
        locations={locations}
        mode={mode}
        view={view}
        onViewChange={setView}
        resultCount={data?.totalCount}
        resultNoun={resultNoun}
      />

      <section aria-label={heading} className="mt-8">
        <h2 className="sr-only">{heading}</h2>

        {isLoading ? (
          <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        ) : jobs.length ? (
          <>
            {view === "grid" ? (
              <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {jobs.map((job) => (
                  <ListingCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <div className="border-t border-rule">
                {jobs.map((job) => (
                  <ListingCard key={job.id} job={job} variant="row" />
                ))}
              </div>
            )}

            <div className="mt-10">
              <Pager
                currentPage={page}
                totalPages={data?.totalPages ?? 1}
                onPageChange={setPage}
                basePath={basePath}
              />
            </div>
          </>
        ) : (
          <div className="border border-rule bg-card px-6 py-20 text-center">
            <Compass
              className="mx-auto h-8 w-8 text-muted-foreground"
              aria-hidden="true"
            />
            <h3 className="mt-4 font-display text-2xl">Nothing matches yet</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Try a broader search or clear a filter — new listings are added
              every day.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
