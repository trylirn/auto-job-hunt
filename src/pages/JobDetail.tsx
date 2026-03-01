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
  Briefcase,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const JobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading } = useJob(id ?? "");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-3xl py-8 space-y-6">
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

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{`${job.title} at ${job.company} — JobFlow`}</title>
        <meta name="description" content={`${job.title} at ${job.company}${job.location ? ` in ${job.location}` : ""}. Apply now on JobFlow.`} />
        <meta property="og:title" content={`${job.title} at ${job.company}`} />
        <meta property="og:description" content={`${job.title} at ${job.company}${job.location ? ` in ${job.location}` : ""}${job.salary ? ` — ${job.salary}` : ""}`} />
        <meta property="og:type" content="website" />
      </Helmet>
      <Header />
      <div className="container max-w-3xl py-8">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to jobs
        </Link>

        <Card>
          <CardContent className="p-6 md:p-8">
            <div className="flex items-start gap-4">
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
                <h1 className="font-display text-2xl font-bold md:text-3xl">
                  {job.title}
                </h1>
                <p className="mt-1 text-lg text-muted-foreground">{job.company}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
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
              {job.source && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  via {job.source}
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {job.is_remote && (
                <Badge className="bg-accent/15 text-accent border-0">Remote</Badge>
              )}
              {job.job_type && <Badge variant="outline">{job.job_type}</Badge>}
              {job.salary && <Badge variant="secondary">{job.salary}</Badge>}
              {job.tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="mt-6">
              <a href={job.url} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="gap-2">
                  View Original & Apply
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </div>

            {job.description && (
              <div className="mt-8 border-t pt-6">
                <h2 className="font-display text-lg font-semibold mb-3">
                  Job Description
                </h2>
                <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {job.description}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JobDetail;
