import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FilterOptions {
  locations: string[];
}

async function fetchDistinctLocations(): Promise<string[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select("location")
    .not("location", "is", null)
    .order("location", { ascending: true });

  if (error) throw error;

  const unique = [...new Set((data as { location: string }[]).map((r) => r.location).filter(Boolean))];
  return unique.sort((a, b) => a.localeCompare(b));
}

export function useFilterOptions() {
  return useQuery<FilterOptions>({
    queryKey: ["filter-options"],
    queryFn: async () => {
      const locations = await fetchDistinctLocations();
      return { locations };
    },
    staleTime: 1000 * 60 * 10,
  });
}
