import { useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { JobFilters } from "@/components/JobFilters";
import { JobCard } from "@/components/JobCard";
import { JobListItem } from "@/components/JobListItem";
import { JobCardSkeleton } from "@/components/JobCardSkeleton";
import { JobPagination } from "@/components/JobPagination";
import { ViewToggle } from "@/components/ViewToggle";
import { useJobs } from "@/hooks/useJobs";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { Briefcase } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Index = () => {
  const [search, setSearch] = useState("");
  const [jobType, setJobType] = useState("");
  const [location, setLocation] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const debouncedSearch = useDebounce(search, 300);
  const { data: filterOptions } = useFilterOptions();

  const hasActiveFilters = !!jobType || !!location || !!dateRange;

  const { data, isLoading } = useJobs({
    search: debouncedSearch,
    jobType,
    location,
    dateRange: dateRange as "24h" | "week" | "month" | "",
    page,
    listingType: "jobs"
  });

  const clearFilters = useCallback(() => {
    setJobType("");
    setLocation("");
    setDateRange("");
    setPage(1);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Eplicant — Find Your Next Opportunity</title>
        <meta name="description" content="Thousands of jobs updated automatically. Search remote, full-time, and freelance opportunities worldwide." />
        <link rel="canonical" href="https://eplicant.com/" />
        <meta property="og:title" content="Eplicant — Find Your Next Opportunity" />
        <meta property="og:description" content="Thousands of jobs updated automatically. Search remote, full-time, and freelance opportunities worldwide." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://eplicant.com/" />
        <meta property="og:image" content="https://eplicant.com/logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Eplicant — Find Your Next Opportunity" />
        <meta name="twitter:description" content="Thousands of jobs updated automatically. Search remote, full-time, and freelance opportunities worldwide." />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          "itemListElement": [
            { "@type": "SiteNavigationElement", "position": 1, "name": "Jobs", "url": "https://eplicant.com/" },
            { "@type": "SiteNavigationElement", "position": 2, "name": "Opportunities", "url": "https://eplicant.com/opportunities" },
            { "@type": "SiteNavigationElement", "position": 3, "name": "Remote Jobs", "url": "https://eplicant.com/?location=Remote" }
          ]
        })}</script>
      </Helmet>
      <Header />

      {/* Hero */}
      <section className="border-b bg-card">
        <div className="container py-8 md:py-16">
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Find your next opportunity
          </h1>
          <p className="mt-2 max-w-xl text-base text-muted-foreground md:text-lg">Thousands of jobs available to be taken.</p>
          <div className="mt-4 md:mt-6 max-w-2xl">
            <SearchBar value={search} onChange={(v) => {setSearch(v);setPage(1);}} />
          </div>
        </div>
      </section>

      {/* Main */}
      <main className="container py-6 md:py-8">
        <div className="mb-4 md:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <JobFilters
            jobType={jobType}
            onJobTypeChange={(v) => {setJobType(v);setPage(1);}}
            location={location}
            onLocationChange={(v) => {setLocation(v);setPage(1);}}
            dateRange={dateRange}
            onDateRangeChange={(v) => {setDateRange(v);setPage(1);}}
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
            availableLocations={filterOptions?.jobLocations ?? []}
          />

          <div className="flex items-center gap-3">
            {data &&
            <p className="text-sm text-muted-foreground whitespace-nowrap">
                {data.totalCount} job{data.totalCount !== 1 ? "s" : ""} found
              </p>
            }
            <ViewToggle value={viewMode} onChange={setViewMode} />
          </div>
        </div>

        {isLoading ?
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 items-start">
            {Array.from({ length: 6 }).map((_, i) =>
          <JobCardSkeleton key={i} />
          )}
          </div> :
        data?.jobs.length ?
        <>
            {viewMode === "grid" ?
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 items-start">
                {data.jobs.map((job) =>
            <JobCard key={job.id} job={job} />
            )}
              </div> :
          <div className="flex flex-col gap-2">
                {data.jobs.map((job) =>
            <JobListItem key={job.id} job={job} />
            )}
              </div>
          }
            <div className="mt-6 md:mt-8">
              <JobPagination
              currentPage={page}
              totalPages={data.totalPages}
              onPageChange={setPage} />
            </div>
          </> :
        <div className="flex flex-col items-center justify-center py-16 md:py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold">No jobs found</h2>
            <p className="mt-1 text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        }
      </main>

      {/* FAQ */}
      <section className="border-t bg-card">
        <div className="container py-10 md:py-16 max-w-3xl">
          <h2 className="font-display text-xl font-bold md:text-2xl mb-6">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="what">
              <AccordionTrigger>What is Eplicant?</AccordionTrigger>
              <AccordionContent>
                Eplicant is a job and opportunity Job site that automatically collects and organizes listings from verified sources across Africa and beyond, making it easy to discover roles that match your ambitions.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="updated">
              <AccordionTrigger>How often are jobs updated?</AccordionTrigger>
              <AccordionContent>
                Our system fetches new listings every hour and uses AI to clean and categorize them, so you always see fresh, well-organized opportunities.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="verified">
              <AccordionTrigger>Are these jobs verified?</AccordionTrigger>
              <AccordionContent>
                We verify our Job listings from reputable sources and use AI to improve their quality.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="apply">
              <AccordionTrigger>How do I apply for a job?</AccordionTrigger>
              <AccordionContent>
                Click on any listing to view its details, then use the "Apply" button to be redirected to the original application page where you can submit your application.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="difference">
              <AccordionTrigger>What's the difference between Jobs and Opportunities?</AccordionTrigger>
              <AccordionContent>
                Jobs are traditional employment listings (full-time, part-time, contract). Opportunities include fellowships, scholarships, grants, conferences, and other career-development programs.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <footer className="border-t bg-card">
        <div className="container py-6 text-center text-sm text-muted-foreground">
          <p>Eplicant — Discover opportunities that match your ambitions.</p>
        </div>
      </footer>
    </div>);
};

export default Index;
