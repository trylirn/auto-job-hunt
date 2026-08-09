import { Link, useLocation } from "react-router-dom";
import { Building2, MapPin, Clock, AlarmClock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Job } from "@/types/job";
import { getDeadlineInfo } from "@/lib/deadline";
import { formatLocation } from "@/lib/locationLabel";
import { cn } from "@/lib/utils";
import { stripSourceAttribution } from "@/lib/sanitize";


/** Strip markup and residual promo boilerplate from preview text. */
export function previewText(job: Job, length = 170): string {
  return stripSourceAttribution(job.clean_description || job.description || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .replace(
      /(?:For more opportunities|Disclaimer:|JOIN|Follow us on|Facebook|Instagram|Twitter|LinkedIn|WhatsApp|Telegram|Source:|Posted by).*/gi,
      ""
    )
    .trim()
    .slice(0, length);
}


interface ListingCardProps {
  job: Job;
  /** "card" = grid tile; "row" = dense list row. */
  variant?: "card" | "row";
}

export function ListingCard({ job, variant = "card" }: ListingCardProps) {
  const routerLocation = useLocation();
  const from = `${routerLocation.pathname}${routerLocation.search}`;

  const timeAgo = job.posted_at
    ? formatDistanceToNow(new Date(job.posted_at), { addSuffix: true })
    : "Recently";
  const deadline = getDeadlineInfo(job.apply_before_date);
  const place = formatLocation(job.location);
  const to = `/job/${job.slug || job.id}`;

  const logo = job.company_logo ? (
    <img
      src={job.company_logo}
      alt={`${job.company} logo`}
      loading="lazy"
      width={40}
      height={40}
      className="h-10 w-10 shrink-0 rounded-sm border border-rule bg-background object-contain"
    />
  ) : (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-rule bg-muted">
      <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
    </div>
  );

  if (variant === "row") {
    return (
      <article>
        <Link
          to={to}
          state={{ from }}
          className="group flex items-center gap-4 border-b border-rule py-4 transition-colors hover:bg-card"
        >
          {logo}
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-lg leading-snug group-hover:text-primary">
              {job.title}
            </h3>
            <p className="truncate text-sm text-muted-foreground">
              {job.company}
              {place && <span> · {place}</span>}
            </p>
          </div>
          <div className="hidden shrink-0 items-center gap-4 text-xs text-muted-foreground sm:flex">
            {deadline?.urgent && (
              <span className="flex items-center gap-1 text-accent">
                <AlarmClock className="h-3 w-3" aria-hidden="true" />
                {deadline.label}
              </span>
            )}
            {job.is_remote && <span>Remote</span>}
            <span>{timeAgo}</span>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="h-full">
      <Link
        to={to}
        state={{ from }}
        className={cn(
          "group flex h-full flex-col border border-rule bg-card p-5 transition-colors hover:border-primary/50",
          job.is_featured && "border-l-2 border-l-primary"
        )}
      >
        <div className="flex items-start gap-3">
          {logo}
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 font-display text-xl leading-tight group-hover:text-primary">
              {job.title}
            </h3>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {job.company}
            </p>
          </div>
        </div>

        <dl className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          {place && (
            <div className="flex max-w-[60%] items-center gap-1">
              <dt className="sr-only">Location</dt>
              <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
              <dd className="truncate">{place}</dd>
            </div>
          )}
          <div className="flex items-center gap-1">
            <dt className="sr-only">Posted</dt>
            <Clock className="h-3 w-3" aria-hidden="true" />
            <dd>{timeAgo}</dd>
          </div>
        </dl>

        {(job.is_remote || job.job_type || deadline?.urgent) && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {deadline?.urgent && (
              <li className="border border-accent/40 px-2 py-0.5 text-[11px] uppercase tracking-wide text-accent">
                {deadline.label}
              </li>
            )}
            {job.is_remote && (
              <li className="border border-rule px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                Remote
              </li>
            )}
            {job.job_type && (
              <li className="border border-rule px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                {job.job_type}
              </li>
            )}
          </ul>
        )}

        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {previewText(job)}
        </p>
      </Link>
    </article>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="border border-rule bg-card p-5">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 animate-pulse rounded-sm bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-3/4 animate-pulse rounded-sm bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded-sm bg-muted" />
        </div>
      </div>
      <div className="mt-5 space-y-2">
        <div className="h-3 w-full animate-pulse rounded-sm bg-muted" />
        <div className="h-3 w-5/6 animate-pulse rounded-sm bg-muted" />
      </div>
    </div>
  );
}
