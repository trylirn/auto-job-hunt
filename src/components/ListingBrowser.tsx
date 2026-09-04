import { Fragment, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import { useJobs } from "@/hooks/useJobs";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { countriesFromLocations } from "@/lib/countries";
import { ListingCard, ListingCardSkeleton } from "@/components/ListingCard";
import { ListingToolbar, ALL_COUNTRIES } from "@/components/ListingToolbar";
import { Pager } from "@/components/Pager";
import AdsterraNativeAd from "@/components/AdsterraNativeAd";
import { Compass } from "lucide-react";
import type { Job } from "@/types/job";

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

  const country = searchParams.get("country") || ALL_COUNTRIES;

  const handleCountryChange = useCallback(
    (v: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("page");
          if (!v || v === ALL_COUNTRIES) next.delete("country");
          else next.set("country", v);
          return next;
        },
        { replace: false }
      );
    },
    [setSearchParams]
  );

  const { data: filterOptions } = useFilterOptions();

  const countries = useMemo(
    () =>
      countriesFromLocations(filterOptions?.jobLocations ?? []).map((c) => ({
        value: c.query,
        label: c.name,
      })),
    [filterOptions]
  );


  const { data, isLoading } = useJobs({
    search: debouncedSearch,
    location: country === ALL_COUNTRIES ? "" : country,
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
        countries={countries}
        country={country}
        onCountryChange={handleCountryChange}
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
                {jobs.map((job, index) => (
                  <Fragment key={job.id}>
                    <ListingCard job={job} />

                    {index === 4 && (
                      <div className="col-span-full">
                        <AdsterraNativeAd />
                      </div>
                    )}
                  </Fragment>
                ))}
              </div>
            ) : (
              <div className="border-t border-rule">
                {jobs.map((job, index) => (
                  <Fragment key={job.id}>
                    <ListingCard job={job} variant="row" />

                    {index === 4 && (
                      <div className="py-4">
                        <AdsterraNativeAd />
                      </div>
                    )}
                  </Fragment>
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
