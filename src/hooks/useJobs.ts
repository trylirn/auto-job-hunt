import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Job } from "@/types/job";
import { subDays } from "date-fns";

interface UseJobsParams {
  search?: string;
  jobType?: string;
  location?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "posted_at" | "created_at";
  listingType?: "jobs" | "opportunities";
  dateRange?: "24h" | "week" | "month" | "";
  opportunityCategory?: string;
}

export function useJobs({
  search = "",
  jobType = "",
  location = "",
  page = 1,
  pageSize = 12,
  sortBy = "posted_at",
  listingType,
  dateRange = "",
  opportunityCategory = "",
}: UseJobsParams = {}) {
  return useQuery({
    queryKey: ["jobs", search, jobType, location, page, sortBy, listingType, dateRange, opportunityCategory],
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
        query = query.eq("listing_type", "job");
      } else if (listingType === "opportunities") {
        query = query.eq("listing_type", "opportunity");
      }

      if (opportunityCategory) {
        query = query.ilike("category", `%${opportunityCategory}%`);
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

export function useJobBySlug(slug: string) {
  return useQuery({
    queryKey: ["job-slug", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw error;
      return data as Job;
    },
    enabled: !!slug,
  });
}
