import { useRef } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useJobBySlug, useJob } from "@/hooks/useJobs";
import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  Clock,
  Building2,
  DollarSign,
  Briefcase,
  Globe,
  AlertTriangle,
  CalendarClock,
  Tag,
} from "lucide-react";
import { ShareButtons } from "@/components/ShareButtons";
import { SimilarJobs } from "@/components/SimilarJobs";
import { EmailSubscriber } from "@/components/EmailSubscriber";
import { formatDistanceToNow } from "date-fns";

function extractApplyUrl(description: string | null): string | null {
  if (!description) return null;
  const regex = /<a\s[^>]*href=["'](https?:\/\/[^"']+)["']/gi;
  let match;
  while ((match = regex.exec(description)) !== null) {
    const url = match[1];
    if (
      url.includes("yeshub.ng") ||
      url.includes("chatgpt://") ||
      url.includes("facebook.com/sharer") ||
      url.includes("twitter.com/intent") ||
      url.includes("linkedin.com/sharing") ||
      url.includes("wa.me") ||
      url.includes("t.me/share")
    ) continue;
    return url;
  }
  return null;
}

function buildJobPostingJsonLd(job: {
  title: string;
  company: string;
  location?: string | null;
  salary?: string | null;
  posted_at?: string | null;
  is_remote?: boolean | null;
  job_type?: string | null;
  clean_description?: string | null;
  description?: string | null;
  apply_url?: string | null;
  slug?: string | null;
  id: string;
}) {
  const plainDescription = (job.clean_description || job.description || "")
    .replace(/<[^>]+>/g, "")
    .slice(0, 500);

  const jobPath = job.slug || job.id;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: plainDescription,
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
    },
    datePosted: job.posted_at || new Date().toISOString(),
    url: `https://eplicant.com/job/${jobPath}`,
  };

  if (job.location) {
    jsonLd.jobLocation = {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressLocality: job.location },
    };
  }

  if (job.is_remote) {
    jsonLd.jobLocationType = "TELECOMMUTE";
  }

  if (job.job_type) {
    const typeMap: Record<string, string> = {
      "Full-time": "FULL_TIME",
      "Part-time": "PART_TIME",
      Contract: "CONTRACTOR",
      Internship: "INTERN",
      Freelance: "TEMPORARY",
    };
    jsonLd.employmentType = typeMap[job.job_type] || job.job_type;
  }

  if (job.apply_url) {
    jsonLd.directApply = true;
  }

  return jsonLd;
}

/** Redirect component for legacy /job/id/:id URLs */
export const JobIdRedirect = () => {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading } = useJob(id ?? "");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-3xl py-6 md:py-8 space-y-4 md:space-y-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-3/4" />
        </div>
      </div>
    );
  }

  if (!job) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={`/job/${job.slug || job.id}`} replace />;
};

const JobDetailSidebar = ({
  job,
  applyUrl,
  timeAgo,
  onApply,
}: {
  job: {
    title: string;
    company: string;
    company_logo: string | null;
    category: string | null;
    salary: string | null;
    location: string | null;
    is_remote: boolean;
    job_type: string | null;
    tags: string[] | null;
    apply_before: string | null;
    skills: string[] | null;
    employment_type: string | null;
  };
  applyUrl: string | null;
  timeAgo: string | null;
  onApply: () => void;
}) => (
  <div className="sticky top-6 space-y-4">
    <Card>
      <CardContent className="p-5 space-y-4">
        {/* Company & Title */}
        <div className="flex flex-col items-center text-center gap-3">
          {job.company_logo ? (
            <img
              src={job.company_logo}
              alt={job.company}
              className="h-14 w-14 rounded-xl border object-contain bg-card"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border bg-muted">
              <Building2 className="h-7 w-7 text-muted-foreground" />
            </div>
          )}
          <div>
            <h2 className="font-display font-bold text-base">{job.title}</h2>
            <p className="text-sm text-muted-foreground">@{job.company}</p>
          </div>
        </div>

        {/* Category / Tags */}
        {(job.category || (job.tags && job.tags.length > 0)) && (
          <div className="flex flex-wrap justify-center gap-1.5">
            {job.category && (
              <Badge variant="outline" className="text-xs">{job.category}</Badge>
            )}
            {job.tags?.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 border-t border-b py-3">
          {job.apply_before && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Apply Before</p>
              <p className="text-sm font-medium mt-0.5 flex items-center gap-1">
                <CalendarClock className="h-3 w-3 text-muted-foreground" />
                {job.apply_before}
              </p>
            </div>
          )}
          {job.employment_type && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Job Type</p>
              <p className="text-sm font-medium mt-0.5 flex items-center gap-1">
                <Briefcase className="h-3 w-3 text-muted-foreground" />
                {job.employment_type}
              </p>
            </div>
          )}
          {job.salary && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Salary</p>
              <p className="text-sm font-medium mt-0.5 flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-muted-foreground" />
                {job.salary}
              </p>
            </div>
          )}
          {(job.location || job.is_remote) && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {job.is_remote ? "Remote Location" : "Location"}
              </p>
              <p className="text-sm font-medium mt-0.5 flex items-center gap-1">
                <Globe className="h-3 w-3 text-muted-foreground" />
                {job.location || "Remote"}
              </p>
            </div>
          )}
          {job.job_type && !job.employment_type && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Work Mode</p>
              <p className="text-sm font-medium mt-0.5 flex items-center gap-1">
                <Briefcase className="h-3 w-3 text-muted-foreground" />
                {job.job_type}
              </p>
            </div>
          )}
          {timeAgo && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Posted</p>
              <p className="text-sm font-medium mt-0.5 flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                {timeAgo}
              </p>
            </div>
          )}
        </div>

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
              <Tag className="h-3 w-3" /> Skills
            </p>
            <div className="flex flex-wrap gap-1.5">
              {job.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Apply Button */}
        <Button size="lg" className="gap-2 w-full" onClick={onApply}>
          Apply for this position
          {applyUrl && <ExternalLink className="h-4 w-4" />}
        </Button>
      </CardContent>
    </Card>

    {/* Scam Warning */}
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="p-4 flex gap-2 text-xs text-muted-foreground">
        <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
        <p>
          <span className="font-semibold text-foreground">Beware of scams!</span> When applying for jobs, you should NEVER have to pay anything. <a href="https://consumer.ftc.gov/articles/job-scams" target="_blank" rel="noopener noreferrer" className="text-primary underline">Learn more.</a>
        </p>
      </CardContent>
    </Card>
  </div>
);

const JobDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: job, isLoading } = useJobBySlug(slug ?? "");
  const descriptionRef = useRef<HTMLDivElement>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-5xl py-6 md:py-8 space-y-4 md:space-y-6">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-64 w-full" />
            </div>
            <Skeleton className="h-80 w-full hidden lg:block" />
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container flex flex-col items-center justify-center py-20 text-center">
          <h2 className="font-display text-2xl font-semibold">Job not found</h2>
          <Link to="/">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to jobs
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const jobPath = job.slug || job.id;
  const jobUrl = `https://eplicant.com/job/${jobPath}`;

  const timeAgo = job.posted_at
    ? formatDistanceToNow(new Date(job.posted_at), { addSuffix: true })
    : null;

  const applyUrl =
    job.apply_url ||
    extractApplyUrl(job.clean_description || job.description);

  const displayDescription = job.clean_description || job.description;

  const handleApply = () => {
    if (applyUrl) {
      window.open(applyUrl, "_blank", "noopener,noreferrer");
    } else {
      descriptionRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const jobJsonLd = buildJobPostingJsonLd(job);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{`${job.title} at ${job.company} — Eplicant`}</title>
        <meta name="description" content={`${job.title} at ${job.company}${job.location ? ` in ${job.location}` : ""}. Apply now on Eplicant.`} />
        <link rel="canonical" href={jobUrl} />
        <meta property="og:title" content={`${job.title} at ${job.company}`} />
        <meta property="og:description" content={`${job.title} at ${job.company}${job.location ? ` in ${job.location}` : ""}${job.salary ? ` — ${job.salary}` : ""}`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={jobUrl} />
        <meta property="og:image" content="https://eplicant.com/logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${job.title} at ${job.company}`} />
        <meta name="twitter:description" content={`${job.title} at ${job.company}${job.location ? ` in ${job.location}` : ""}`} />
        <script type="application/ld+json">{JSON.stringify(jobJsonLd)}</script>
      </Helmet>
      <Header />
      <div className="container max-w-5xl py-4 md:py-8 px-4">
        <Link
          to="/"
          className="mb-4 md:mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to jobs
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Main Content - Left Side */}
          <div>
            {/* Title Header */}
            <div className="mb-6">
              <h1 className="font-display text-2xl font-bold md:text-3xl break-words">
                {job.title} @{job.company}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {timeAgo && (
                  <span>{timeAgo}</span>
                )}
                {job.company && (
                  <>
                    <span>·</span>
                    <span>{job.company} is hiring a {job.is_remote ? "remote " : ""}{job.title}</span>
                  </>
                )}
                {job.salary && (
                  <>
                    <span>·</span>
                    <span>💸 Salary: {job.salary}</span>
                  </>
                )}
                {job.location && (
                  <>
                    <span>·</span>
                    <span>📍 Location: {job.location}</span>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            {displayDescription && (
              <div ref={descriptionRef}>
                <div
                  className="prose prose-sm max-w-none text-muted-foreground leading-relaxed
                    prose-headings:text-foreground prose-headings:font-display
                    prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                    prose-li:marker:text-muted-foreground
                    prose-strong:text-foreground
                    break-words overflow-hidden [overflow-wrap:anywhere]
                    [word-break:break-word]"
                  dangerouslySetInnerHTML={{ __html: displayDescription }}
                />
              </div>
            )}

            {/* Share & Apply (mobile) */}
            <div className="mt-6 border-t pt-4 space-y-4 lg:hidden">
              <Button size="lg" className="gap-2 w-full" onClick={handleApply}>
                Apply for this position
                {applyUrl && <ExternalLink className="h-4 w-4" />}
              </Button>
              <ShareButtons
                title={job.title}
                company={job.company}
                jobUrl={jobUrl}
                location={job.location}
                jobType={job.job_type}
                salary={job.salary}
                cleanDescription={job.clean_description}
              />
            </div>

            {/* Share (desktop) */}
            <div className="mt-6 border-t pt-4 hidden lg:block">
              <ShareButtons
                title={job.title}
                company={job.company}
                jobUrl={jobUrl}
                location={job.location}
                jobType={job.job_type}
                salary={job.salary}
                cleanDescription={job.clean_description}
              />
            </div>
          </div>

          {/* Sidebar - Right Side (desktop) */}
          <div className="hidden lg:block">
            <JobDetailSidebar
              job={job}
              applyUrl={applyUrl}
              timeAgo={timeAgo}
              onApply={handleApply}
            />
          </div>
        </div>

        <div className="mt-8">
          <EmailSubscriber />
        </div>

        <SimilarJobs job={job} />
      </div>
    </div>
  );
};

export default JobDetail;
