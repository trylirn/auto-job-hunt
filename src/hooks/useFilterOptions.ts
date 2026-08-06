import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FilterOptions {
  jobLocations: string[];
}

async function fetchDistinctLocations(): Promise<string[]> {
  const { data } = await supabase
    .from("jobs")
    .select("location")
    .is("archived_at", null)
    .not("location", "is", null)
    .limit(2000);
  const set = new Set<string>();
  (data ?? []).forEach((r: { location: string | null }) => {
    if (r.location) set.add(r.location);
  });
  return Array.from(set).sort();
}

export function useFilterOptions() {
  return useQuery<FilterOptions>({
    queryKey: ["filter-options"],
    queryFn: async () => ({ jobLocations: await fetchDistinctLocations() }),
    staleTime: 1000 * 60 * 10,
  });
}
