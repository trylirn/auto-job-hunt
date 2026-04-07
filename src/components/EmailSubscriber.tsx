/*import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle2 } from "lucide-react";

export function EmailSubscriber() {
  const [email, setEmail] = useState("");
  const [status, setStatus] =
    useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || status === "loading") return;

    setStatus("loading");

    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbxX2sGsTeq3Dxliq0duBvWq2gluYuEjEdotLID_u-obgzSAuXI_ByQX8zisMCCrNL6a/exec",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            email: email,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setStatus("success");
      setEmail("");
    } catch (error) {
      console.error(error);
      setStatus("error");

      setTimeout(() => {
        setStatus("idle");
      }, 3000);
    }
  };

  // ✅ SUCCESS STATE
  if (status === "success") {
    return (
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-6 md:p-8 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-primary mb-2" />
        <h3 className="font-display font-semibold text-lg">
          You're subscribed!
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Thanks! You're now on the list.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card border p-6 md:p-8">
      <div className="flex items-center gap-2 mb-2">
        <Mail className="h-5 w-5 text-primary" />
        <h3 className="font-display font-semibold text-lg">
          Get jobs in your inbox
        </h3>
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
        <p className="text-xs text-destructive mt-2">
          Something went wrong. Please try again.
        </p>
      )}
    </div>
  );
}
