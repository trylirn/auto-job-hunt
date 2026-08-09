import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PUBLIC_JOB_COLUMNS, type Job } from "@/types/job";
import { subDays } from "date-fns";

/**
 * Sources temporarily hidden from the public board (data is kept in the
 * database so they can be restored by removing the entry below).
 */
export const HIDDEN_SOURCES = ["himalayas"];
export const HIDDEN_SOURCE_FILTER = [
  "source.is.null",
  ...HIDDEN_SOURCES.map((s) => `source.neq.${s}`),
].join(",");

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
  region?: "us" | "non-us" | "";
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
  region = "",
}: UseJobsParams = {}) {
  return useQuery({
    queryKey: ["jobs", search, jobType, location, page, sortBy, listingType, dateRange, opportunityCategory, region],
    queryFn: async () => {
      let query = supabase
        .from("jobs")
        .select(PUBLIC_JOB_COLUMNS, { count: "exact" })
        .is("archived_at", null)
        .or(HIDDEN_SOURCE_FILTER)
        .order("is_featured", { ascending: false })
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
        if (location.toLowerCase() === "remote") {
          query = query.or("is_remote.eq.true,job_type.eq.Remote,location.ilike.%remote%");
        } else {
          query = query.ilike("location", `%${location}%`);
        }
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
        query = query.or("listing_type.is.null,listing_type.neq.opportunity");
      } else if (listingType === "opportunities") {
        query = query.eq("listing_type", "opportunity");
      }

      if (opportunityCategory) {
        query = query.ilike("category", `%${opportunityCategory}%`);
      }

      if (region === "us") {
        // "Global" rolls into the U.S. bucket — it's surfaced as "USA / Global"
        // and used as our U.S.-priority audience target.
        query = query.or("location.ilike.%United States%,location.ilike.%USA%,location.ilike.%U.S.A%,location.eq.Global");
      } else if (region === "non-us") {
        query = query
          .not("location", "ilike", "%United States%")
          .not("location", "ilike", "%USA%")
          .not("location", "ilike", "%U.S.A%")
          .not("location", "eq", "Global");
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
        .select(PUBLIC_JOB_COLUMNS)
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
        .select(PUBLIC_JOB_COLUMNS)
        .eq("slug", slug)
        .single();

      if (error) throw error;
      return data as Job;
    },
    enabled: !!slug,
  });
}

export function useSimilarJobs(job: Job | undefined) {
  return useQuery({
    queryKey: ["similar-jobs", job?.id],
    queryFn: async () => {
      if (!job) return [];

      let query = supabase
        .from("jobs")
        .select(PUBLIC_JOB_COLUMNS)
        .neq("id", job.id)
        .is("archived_at", null)
        .or(HIDDEN_SOURCE_FILTER)
        .order("posted_at", { ascending: false, nullsFirst: false })
        .limit(6);

      if (job.job_type) {
        query = query.eq("job_type", job.job_type);
      }

      if (job.listing_type) {
        query = query.eq("listing_type", job.listing_type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as Job[]) ?? [];
    },
    enabled: !!job,
  });
}
