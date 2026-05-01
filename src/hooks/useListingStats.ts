import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useListingStats() {
  return useQuery({
    queryKey: ["listing-stats"],
    queryFn: async () => {
      const [jobsRes, oppsRes] = await Promise.all([
        supabase
          .from("jobs")
          .select("*", { count: "exact", head: true })
          .is("archived_at", null)
          .eq("listing_type", "job"),
        supabase
          .from("jobs")
          .select("*", { count: "exact", head: true })
          .is("archived_at", null)
          .eq("listing_type", "opportunity"),
      ]);
      return {
        jobs: jobsRes.count ?? 0,
        opportunities: oppsRes.count ?? 0,
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}
