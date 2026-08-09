import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { HIDDEN_SOURCE_FILTER } from "@/hooks/useJobs";

export function useListingStats() {
  return useQuery({
    queryKey: ["listing-stats"],
    queryFn: async () => {
      const { count } = await supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .is("archived_at", null)
        .or(HIDDEN_SOURCE_FILTER);

      return { jobs: count ?? 0 };
    },
    staleTime: 1000 * 60 * 5,
  });
}
