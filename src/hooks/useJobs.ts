import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Job } from "@/types/job";
import { subDays } from "date-fns";

const OPPORTUNITY_CATEGORIES = ["fellowship", "grants", "scholarship", "conference", "internships", "funding"];

interface UseJobsParams {
  search?: string;
  jobType?: string;
  isRemote?: boolean;
  location?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "posted_at" | "created_at";
  listingType?: "jobs" | "opportunities";
  dateRange?: "24h" | "week" | "month" | "";
}

export function useJobs({
  search = "",
  jobType = "",
  isRemote,
  location = "",
  page = 1,
  pageSize = 12,
  sortBy = "posted_at",
  listingType,
  dateRange = "",
}: UseJobsParams = {}) {
  return useQuery({
    queryKey: ["jobs", search, jobType, isRemote, location, page, sortBy, listingType, dateRange],
    queryFn: async () => {
      let query = supabase
        .from("jobs")
        .select("*", { count: "exact" })
        .order(sortBy, { ascending: false, nullsFirst: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (search) {
        query = query.or(
          `title.ilike.%${search}%,company.ilike.%${search}%,description.ilike.%${search}%`
        );
      }

      if (jobType) {
        query = query.eq("job_type", jobType);
      }

      if (isRemote !== undefined) {
        query = query.eq("is_remote", isRemote);
      }

      if (location) {
        query = query.ilike("location", `%${location}%`);
      }

      if (dateRange) {
        const now = new Date();
        let since: Date;
        if (dateRange === "24h") since = subDays(now, 1);
        else if (dateRange === "week") since = subDays(now, 7);
        else since = subDays(now, 30);
        query = query.gte("posted_at", since.toISOString());
      }

      if (listingType === "jobs") {
        for (const cat of OPPORTUNITY_CATEGORIES) {
          query = query.neq("category", cat);
        }
      } else if (listingType === "opportunities") {
        query = query.in("category", OPPORTUNITY_CATEGORIES);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        jobs: (data as Job[]) ?? [],
        totalCount: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      };
    },
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ["job", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Job;
    },
    enabled: !!id,
  });
}
