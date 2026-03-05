import { useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useJob } from "@/hooks/useJobs";
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
} from "lucide-react";
import { ShareButtons } from "@/components/ShareButtons";
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
  id: string;
}) {
  const plainDescription = (job.clean_description || job.description || "")
    .replace(/<[^>]+>/g, "")
    .slice(0, 500);

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
    url: `https://eplicant.com/job/${job.id}`,
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

const JobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading } = useJob(id ?? "");
  const descriptionRef = useRef<HTMLDivElement>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-3xl py-6 md:py-8 space-y-4 md:space-y-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-64 w-full" />
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
        <link rel="canonical" href={`https://eplicant.com/job/${job.id}`} />
        <meta property="og:title" content={`${job.title} at ${job.company}`} />
        <meta property="og:description" content={`${job.title} at ${job.company}${job.location ? ` in ${job.location}` : ""}${job.salary ? ` — ${job.salary}` : ""}`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://eplicant.com/job/${job.id}`} />
        <meta property="og:image" content="https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/efd56ee5-8a5e-49bb-89ba-4f7e8643961a/id-preview-92a29c77--87d973e3-d02d-4b67-b29b-996d6d79bb82.lovable.app-1772372990864.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${job.title} at ${job.company}`} />
        <meta name="twitter:description" content={`${job.title} at ${job.company}${job.location ? ` in ${job.location}` : ""}`} />
        <script type="application/ld+json">{JSON.stringify(jobJsonLd)}</script>
      </Helmet>
      <Header />
      <div className="container max-w-3xl py-4 md:py-8 px-4">
        <Link
          to="/"
          className="mb-4 md:mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to jobs
        </Link>

        <Card className="overflow-hidden">
          <CardContent className="p-4 md:p-8">
            {/* Header: Logo + Title + Company */}
            <div className="flex items-start gap-3 md:gap-4">
              {job.company_logo ? (
                <img
                  src={job.company_logo}
                  alt={job.company}
                  className="h-10 w-10 md:h-14 md:w-14 rounded-xl border object-contain bg-card shrink-0"
                />
              ) : (
                <div className="flex h-10 w-10 md:h-14 md:w-14 items-center justify-center rounded-xl border bg-muted shrink-0">
                  <Building2 className="h-5 w-5 md:h-7 md:w-7 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="font-display text-xl font-bold md:text-3xl break-words">
                  {job.title}
                </h1>
                <p className="mt-1 text-base md:text-lg text-muted-foreground">{job.company}</p>
              </div>
            </div>

            {/* Meta info */}
            <div className="mt-3 md:mt-4 flex flex-wrap items-center gap-2 md:gap-3 text-sm text-muted-foreground">
              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {job.location}
                </span>
              )}
              {timeAgo && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {timeAgo}
                </span>
              )}
            </div>

            {/* Badges */}
            <div className="mt-3 md:mt-4 flex flex-wrap gap-1.5 md:gap-2">
              {job.is_remote && (
                <Badge className="bg-accent/15 text-accent border-0">Remote</Badge>
              )}
              {job.job_type && <Badge variant="outline">{job.job_type}</Badge>}
              {job.salary && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {job.salary}
                </Badge>
              )}
              {job.tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Description */}
            {displayDescription && (
              <div ref={descriptionRef} className="mt-6 md:mt-8 border-t pt-4 md:pt-6">
                <h2 className="font-display text-lg font-semibold mb-3">
                  Job Description
                </h2>
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

            {/* Apply button */}
            <div className="mt-6 md:mt-8 border-t pt-4 md:pt-6 space-y-4">
              <Button size="lg" className="gap-2 w-full sm:w-auto" onClick={handleApply}>
                Apply
                {applyUrl && <ExternalLink className="h-4 w-4" />}
              </Button>
              <ShareButtons
                title={job.title}
                company={job.company}
                jobUrl={`https://eplicant.com/job/${job.id}`}
                location={job.location}
                jobType={job.job_type}
                salary={job.salary}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JobDetail;
