import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useListingStats() {
  return useQuery({
    queryKey: ["listing-stats"],
    queryFn: async () => {
      const { count } = await supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .is("archived_at", null);

      return { jobs: count ?? 0 };
    },
    staleTime: 1000 * 60 * 5,
  });
}
