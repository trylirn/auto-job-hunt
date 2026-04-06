import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const PLUNK_PUBLIC_KEY = "pk_32dcf4d0169291df2ebea645ea4adb7b5dab54e0bc43797930a0e2c20b3e3bf4";

export function EmailSubscriber() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === "loading") return;

    setStatus("loading");
    try {
      const { error } = await supabase.functions.invoke("subscribe-email", {
        body: { email },
      });

      if (error) throw error;
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-6 md:p-8 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-primary mb-2" />
        <h3 className="font-display font-semibold text-lg">You're subscribed!</h3>
        <p className="text-sm text-muted-foreground mt-1">
          We'll send you the best jobs and opportunities every week.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card border p-6 md:p-8">
      <div className="flex items-center gap-2 mb-2">
        <Mail className="h-5 w-5 text-primary" />
        <h3 className="font-display font-semibold text-lg">Get jobs in your inbox</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Subscribe to receive curated jobs and opportunities every week. No spam.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1"
        />
        <Button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "..." : "Subscribe"}
        </Button>
      </form>
      {status === "error" && (
        <p className="text-xs text-destructive mt-2">Something went wrong. Please try again.</p>
      )}
    </div>
  );
}
