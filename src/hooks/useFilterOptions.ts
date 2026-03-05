import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FilterOptions {
  jobLocations: string[];
  opportunityLocations: string[];
}

async function fetchDistinctLocations(listingType: string): Promise<string[]> {
  let query = supabase
    .from("jobs")
    .select("location")
    .not("location", "is", null);

  if (listingType === "jobs") {
    query = query.or("listing_type.is.null,listing_type.neq.opportunity");
  } else {
    query = query.eq("listing_type", "opportunity");
  }

  const { data, error } = await query.order("location", { ascending: true });

  if (error) throw error;

  const unique = [...new Set((data as { location: string }[]).map((r) => r.location).filter(Boolean))];
  return unique.sort((a, b) => a.localeCompare(b));
}

export function useFilterOptions() {
  return useQuery<FilterOptions>({
    queryKey: ["filter-options"],
    queryFn: async () => {
      const [jobLocations, opportunityLocations] = await Promise.all([
        fetchDistinctLocations("jobs"),
        fetchDistinctLocations("opportunities"),
      ]);
      return { jobLocations, opportunityLocations };
    },
    staleTime: 1000 * 60 * 10,
  });
}
