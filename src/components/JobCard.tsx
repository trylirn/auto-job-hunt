import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, Building2, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import type { Job } from "@/types/job";

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const timeAgo = job.posted_at
    ? formatDistanceToNow(new Date(job.posted_at), { addSuffix: true })
    : "Recently";

  return (
    <Link to={`/job/${job.id}`}>
      <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/30">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5 min-w-0">
              {job.company_logo ? (
                <img
                  src={job.company_logo}
                  alt={job.company}
                  className="h-11 w-11 shrink-0 rounded-lg border object-contain bg-card"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border bg-muted">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-display font-semibold leading-tight text-foreground group-hover:text-primary transition-colors truncate">
                  {job.title}
                </h3>
                <p className="mt-0.5 text-sm text-muted-foreground truncate">
                  {job.company}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {job.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
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

          {job.description && (
            <p className="mt-3 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {job.description.replace(/<[^>]*>/g, "")}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
