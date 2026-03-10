import { Link } from "react-router-dom";
import { useSimilarJobs } from "@/hooks/useJobs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Job } from "@/types/job";

interface SimilarJobsProps {
  job: Job;
}

export const SimilarJobs = ({ job }: SimilarJobsProps) => {
  const { data: similarJobs, isLoading } = useSimilarJobs(job);

  if (isLoading) {
    return (
      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold mb-4">Similar Opportunities</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!similarJobs?.length) return null;

  return (
    <div className="mt-8">
      <h2 className="font-display text-lg font-semibold mb-4">Similar Opportunities</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {similarJobs.map((similarJob) => (
          <Link key={similarJob.id} to={`/job/${similarJob.slug || similarJob.id}`}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {similarJob.company_logo ? (
                    <img
                      src={similarJob.company_logo}
                      alt={similarJob.company}
                      className="h-8 w-8 rounded-lg border object-contain bg-card shrink-0"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border bg-muted shrink-0">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm leading-tight line-clamp-2">
                      {similarJob.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">{similarJob.company}</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {similarJob.location && (
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="line-clamp-1">{similarJob.location}</span>
                    </span>
                  )}
                  {similarJob.is_remote && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Remote</Badge>
                  )}
                  {similarJob.job_type && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{similarJob.job_type}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};
