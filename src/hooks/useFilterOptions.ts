import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FilterOptions {
  locations: string[];
  jobTypes: string[];
  categories: string[];
}

async function fetchDistinct(column: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select(column)
    .not(column, "is", null)
    .order(column, { ascending: true });

  if (error) throw error;

  const unique = [...new Set((data as unknown as Record<string, string>[]).map((r) => r[column]).filter(Boolean))];
  return unique.sort((a, b) => a.localeCompare(b));
}

export function useFilterOptions() {
  return useQuery<FilterOptions>({
    queryKey: ["filter-options"],
    queryFn: async () => {
      const [locations, jobTypes, categories] = await Promise.all([
        fetchDistinct("location"),
        fetchDistinct("job_type"),
        fetchDistinct("category"),
      ]);

      return { locations, jobTypes, categories };
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
