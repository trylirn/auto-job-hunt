import { Fragment, useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import { useJobs } from "@/hooks/useJobs";
import { ListingCard, ListingCardSkeleton } from "@/components/ListingCard";
import { ListingToolbar } from "@/components/ListingToolbar";
import { Pager } from "@/components/Pager";
import { Compass } from "lucide-react";
import type { Job } from "@/types/job";
import AdsterraNativeAd from "@/components/AdsterraNativeAd";

interface ListingBrowserProps {
  basePath: string;
  heading: string;
  resultNoun: string;
  searchPlaceholder?: string;
  /** Receives the current page of results so the page can emit ItemList JSON-LD. */
  onResults?: (jobs: Job[]) => void;
}

export function ListingBrowser({
  basePath,
  heading,
  resultNoun,
  searchPlaceholder,
  onResults,
}: ListingBrowserProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const debouncedSearch = useDebounce(search, 300);

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

  const handleSearchChange = useCallback(
    (v: string) => {
      setSearch(v);
      resetPage();
    },
    [resetPage]
  );

  const { data, isLoading } = useJobs({
    search: debouncedSearch,
    page,
    pageSize: 24,
    listingType: "jobs",
  });

  const jobs = data?.jobs ?? [];
  if (onResults && jobs.length) onResults(jobs);

  return (
    <>
      <ListingToolbar
        search={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder={searchPlaceholder}
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
              Try a broader search — new remote roles are added every day.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
