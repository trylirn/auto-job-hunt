import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, Building2, Sparkles, AlarmClock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link, useLocation } from "react-router-dom";
import type { Job } from "@/types/job";
import { getDeadlineInfo } from "@/lib/deadline";

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const location = useLocation();
  const timeAgo = job.posted_at
    ? formatDistanceToNow(new Date(job.posted_at), { addSuffix: true })
    : "Recently";

  const plainDescription = (job.clean_description || job.description || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const deadline = getDeadlineInfo(job.apply_before_date);
  const isFeaturedActive = job.is_featured && (!job.featured_until || new Date(job.featured_until) > new Date());
  const listingPath = `${location.pathname}${location.search}`;

  return (
    <Link to={`/job/${job.slug || job.id}`} state={{ from: listingPath }} className="block w-full overflow-hidden">
      <Card className={`group cursor-pointer transition-all hover:shadow-md hover:border-primary/30 overflow-hidden max-w-full ${isFeaturedActive ? "ring-1 ring-amber-400/40 bg-amber-50/30 dark:bg-amber-950/10" : ""}`}>
        <CardContent className="p-4 md:p-5">
          {(isFeaturedActive || deadline?.urgent) && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {isFeaturedActive && (
                <Badge className="text-[10px] bg-amber-500 hover:bg-amber-500 text-white border-0 gap-1">
                  <Sparkles className="h-2.5 w-2.5" /> Featured
                </Badge>
              )}
              {deadline?.urgent && (
                <Badge variant="destructive" className="text-[10px] gap-1">
                  <AlarmClock className="h-2.5 w-2.5" /> {deadline.label}
                </Badge>
              )}
            </div>
          )}
          <div className="flex items-start gap-3 min-w-0">
            {job.company_logo ? (
              <img
                src={job.company_logo}
                alt={job.company}
                className="h-10 w-10 md:h-11 md:w-11 shrink-0 rounded-lg border object-contain bg-card"
              />
            ) : (
              <div className="flex h-10 w-10 md:h-11 md:w-11 shrink-0 items-center justify-center rounded-lg border bg-muted">
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-display font-semibold leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2 break-words">
                {job.title}
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground truncate">
                {job.company}
              </p>
            </div>
          </div>

          <div className="mt-2.5 md:mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {job.location && (
              <span className="flex items-center gap-1 truncate max-w-[180px]">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{job.location}</span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo}
            </span>
          </div>

          <div className="mt-2.5 md:mt-3 flex flex-wrap gap-1.5">
            {job.is_remote && (
              <Badge variant="secondary" className="text-xs bg-accent/15 text-accent border-0">
                Remote
              </Badge>
            )}
            {job.job_type && (
              <Badge variant="outline" className="text-xs">
                {job.job_type}
              </Badge>
            )}
            {job.salary && (
              <Badge variant="secondary" className="text-xs">
                {job.salary}
              </Badge>
            )}
          </div>

          {plainDescription && (
            <p className="mt-2.5 md:mt-3 text-sm text-muted-foreground line-clamp-2 leading-relaxed break-words">
              {plainDescription}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
