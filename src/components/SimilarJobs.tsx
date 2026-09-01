import { Link } from "react-router-dom";
import { useSimilarJobs } from "@/hooks/useJobs";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Job } from "@/types/job";
import { CompanyLogo } from "@/components/CompanyLogo";

interface SimilarJobsProps {
  job: Job;
}

function decodeHtml(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.documentElement.textContent || html;
}

export const SimilarJobs = ({ job }: SimilarJobsProps) => {
  const { data: similarJobs, isLoading } = useSimilarJobs(job);

  if (isLoading) {
    return (
      <div className="mt-10 border-t pt-8">
        <h2 className="font-display text-xl font-semibold mb-5">You might also like</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!similarJobs?.length) return null;

  return (
    <div className="mt-10 border-t pt-8">
      <h2 className="font-display text-xl font-semibold mb-5">You might also like</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {similarJobs.map((similarJob) => (
          <Link
            key={similarJob.id}
            to={`/job/${similarJob.slug || similarJob.id}`}
            className="group flex items-center gap-4 rounded-xl border bg-card p-4 transition-all hover:shadow-md hover:border-primary/20"
          >
            <CompanyLogo
              company={similarJob.company}
              logo={similarJob.company_logo}
              size={44}
              className="h-11 w-11 rounded-xl border bg-background p-1"
            />

            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                {decodeHtml(similarJob.title)}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {similarJob.company}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {similarJob.location && (
                  <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate max-w-[120px]">{similarJob.location}</span>
                  </span>
                )}
                {similarJob.is_remote && (
                  <Badge className="bg-accent/15 text-accent border-0 text-[10px] px-1.5 py-0 h-4">
                    Remote
                  </Badge>
                )}
                {similarJob.job_type && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                    {similarJob.job_type}
                  </Badge>
                )}
              </div>
            </div>

            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
};
