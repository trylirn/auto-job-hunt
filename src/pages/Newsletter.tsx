import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Newspaper } from "lucide-react";

const Newsletter = () => {
  const { data: newsletter, isLoading } = useQuery({
    queryKey: ["newsletter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletters")
        .select("*")
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Weekly Newsletter | Eplicant</title>
        <meta name="description" content="Stay updated with the latest verified jobs and opportunities curated weekly by Eplicant." />
      </Helmet>
      <Header />
      <main className="container py-8 md:py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <Newspaper className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Weekly Newsletter
          </h1>
          <p className="mt-2 text-muted-foreground">
            Curated jobs and opportunities delivered every Saturday.
          </p>
        </div>

        {isLoading ? (
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
            <div className="h-4 w-4/6 animate-pulse rounded bg-muted" />
          </div>
        ) : newsletter ? (
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-xl font-semibold">{newsletter.title}</h2>
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: newsletter.content }}
            />
            <p className="mt-6 text-xs text-muted-foreground">
              Published {new Date(newsletter.created_at).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-md rounded-lg border bg-card p-8 text-center">
            <Newspaper className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <h3 className="font-medium">No newsletter available yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Check back on Saturday for the latest curated jobs and opportunities.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Newsletter;
