import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Building2, Sparkles, AlarmClock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link, useLocation } from "react-router-dom";
import type { Job } from "@/types/job";
import { getDeadlineInfo } from "@/lib/deadline";
import { formatLocation } from "@/lib/locationLabel";

interface JobListItemProps {
  job: Job;
}

export function JobListItem({ job }: JobListItemProps) {
  const location = useLocation();
  const timeAgo = job.posted_at
    ? formatDistanceToNow(new Date(job.posted_at), { addSuffix: true })
    : "Recently";
  const deadline = getDeadlineInfo(job.apply_before_date);
  const isFeaturedActive = job.is_featured && (!job.featured_until || new Date(job.featured_until) > new Date());
  const listingPath = `${location.pathname}${location.search}`;

  return (
    <Link
      to={`/job/${job.slug || job.id}`}
      state={{ from: listingPath }}
      className={`group flex items-center gap-3 rounded-lg border bg-card p-3 transition-all hover:shadow-md hover:border-primary/30 overflow-hidden ${isFeaturedActive ? "ring-1 ring-amber-400/40" : ""}`}
    >
      {job.company_logo ? (
        <img
          src={job.company_logo}
          alt={`${job.company} company logo`}
          loading="lazy"
          className="h-10 w-10 shrink-0 rounded-lg border object-contain bg-card"
        />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted">
          <Building2 className="h-5 w-5 text-muted-foreground" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <h3 className="font-display font-semibold text-sm leading-tight text-foreground group-hover:text-primary transition-colors truncate">
          {job.title}
        </h3>
        <p className="text-xs text-muted-foreground truncate">{job.company}</p>
      </div>

      <div className="hidden sm:flex items-center gap-2 shrink-0">
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
      </div>

      <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground shrink-0">
        {job.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span className="max-w-[140px] truncate">{formatLocation(job.location)}</span>
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {timeAgo}
        </span>
      </div>
    </Link>
  );
}
