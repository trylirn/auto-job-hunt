import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Newspaper, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const Newsletter = () => {
  const [copied, setCopied] = useState(false);

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

  const handleCopy = async () => {
    if (!newsletter) return;
    try {
      // Strip HTML tags for plain-text copy
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = newsletter.content;
      const plainText = tempDiv.textContent || tempDiv.innerText || "";
      await navigator.clipboard.writeText(`${newsletter.title}\n\n${plainText}`);
      setCopied(true);
      toast({ title: "Newsletter copied to clipboard!" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Weekly Newsletter | Eplicant</title>
        <meta name="description" content="Stay updated with the latest verified jobs and opportunities curated weekly by Eplicant." />
        <link rel="canonical" href="https://eplicant.com/newsletter" />
        <meta property="og:title" content="Weekly Newsletter | Eplicant" />
        <meta property="og:description" content="Stay updated with the latest verified jobs and opportunities curated weekly by Eplicant." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://eplicant.com/newsletter" />
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
            Curated jobs and opportunities delivered every Monday.
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
            <div className="mt-6 flex items-center justify-between border-t pt-4">
              <p className="text-xs text-muted-foreground">
                Published {new Date(newsletter.created_at).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </p>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy Newsletter"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-md rounded-lg border bg-card p-8 text-center">
            <Newspaper aria-hidden="true" className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h2 className="font-medium">No newsletter available yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Check back on Monday for the latest curated jobs and opportunities.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Newsletter;
