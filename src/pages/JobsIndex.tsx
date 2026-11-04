import { useQuery } from "@tanstack/react-query";
import { StaticPageSeo } from "@/components/Seo";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRY_HUBS } from "@/data/countryHubs";
import { HIDDEN_SOURCE_FILTER } from "@/hooks/useJobs";
import { Globe } from "lucide-react";

/** Live-count jobs per hub so we only display ones with ≥1 result. */
function useHubCounts() {
  return useQuery({
    queryKey: ["hub-counts"],
    queryFn: async () => {
      const countFor = async (q: string) => {
        const { count } = await supabase
          .from("jobs")
          .select("id", { count: "exact", head: true })
          .is("archived_at", null)
          .or(HIDDEN_SOURCE_FILTER)
          .ilike("location", `%${q}%`);
        return count ?? 0;
      };
      const countries = await Promise.all(
        COUNTRY_HUBS.map(async (h) => ({ ...h, count: await countFor(h.locationQuery) }))
      );
      return { countries: countries.filter((c) => c.count > 0) };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export default function JobsIndex() {
  const { data, isLoading } = useHubCounts();

  // Sort: worldwide remote first, then alphabetical.
  const countries = (data?.countries ?? []).slice().sort((a, b) => {
    const order = (s: string) => (s === "usa-global" ? 0 : 1);
    const oa = order(a.slug);
    const ob = order(b.slug);
    if (oa !== ob) return oa - ob;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="min-h-screen bg-background">
      <StaticPageSeo path="/jobs/in" />

      <Header />

      <section className="border-b bg-card">
        <div className="container py-8 md:py-12">
          <nav className="text-xs text-muted-foreground mb-3" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span className="mx-1.5">/</span>
            <span>Remote jobs by country</span>
          </nav>
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-4xl">
            Browse remote jobs by country
          </h1>
          <p className="mt-3 max-w-3xl text-base text-muted-foreground md:text-lg">
            Every role on Eplicant is fully remote. Pick a country to see work-from-anywhere
            jobs open to candidates there.
          </p>
        </div>
      </section>

      <main className="container py-6 md:py-10 space-y-10">
        <section>
          <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5" /> By country
          </h2>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : countries.length ? (
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {countries.map((h) => (
                <li key={h.slug}>
                  <Link
                    to={`/jobs/in/${h.slug}`}
                    className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-sm hover:border-primary/40"
                  >
                    <span className="truncate">{h.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{h.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No countries with live jobs right now.</p>
          )}
        </section>

      </main>

      <Footer />
    </div>
  );
}
