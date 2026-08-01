import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const SUBSCRIBE_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbxX2sGsTeq3Dxliq0duBvWq2gluYuEjEdotLID_u-obgzSAuXI_ByQX8zisMCCrNL6a/exec";

type Status = "idle" | "loading" | "success" | "error";

interface NewsletterSignupProps {
  /** "panel" = full editorial block; "inline" = compact footer strip. */
  variant?: "panel" | "inline";
  id?: string;
}

export function NewsletterSignup({
  variant = "panel",
  id = "newsletter",
}: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const inputId = `${id}-email`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === "loading") return;
    setStatus("loading");
    try {
      const res = await fetch(SUBSCRIBE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ email }),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 4000);
    }
  };

  const form = (
    <form
      onSubmit={handleSubmit}
      className={
        variant === "panel"
          ? "flex flex-col gap-2 sm:flex-row"
          : "flex w-full max-w-sm items-center gap-2"
      }
    >
      <label htmlFor={inputId} className="sr-only">
        Email address
      </label>
      <Input
        id={inputId}
        type="email"
        required
        autoComplete="email"
        placeholder="you@organisation.org"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={
          variant === "panel"
            ? "h-11 flex-1 rounded-sm bg-background"
            : "h-9 flex-1 rounded-sm bg-background text-sm"
        }
      />
      <Button
        type="submit"
        disabled={status === "loading"}
        className={variant === "panel" ? "h-11 rounded-sm px-6" : "h-9 rounded-sm px-4 text-sm"}
      >
        {status === "loading" ? "Joining…" : "Subscribe"}
      </Button>
    </form>
  );

  if (variant === "inline") {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Weekly digest
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Join over 10,000 subscribers.
          </p>
        </div>
        {status === "success" ? (
          <p className="flex items-center gap-1.5 text-sm text-primary">
            <Check className="h-4 w-4" /> You're on the list.
          </p>
        ) : (
          form
        )}
        {status === "error" && (
          <p className="text-sm text-destructive">
            Something went wrong — please try again.
          </p>
        )}
      </div>
    );
  }

  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="border-y border-rule bg-card px-6 py-8 sm:px-8"
    >
      {status === "success" ? (
        <div className="text-center">
          <Check className="mx-auto mb-2 h-6 w-6 text-primary" />
          <h2 id={`${id}-heading`} className="font-display text-2xl">
            You're subscribed
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The next digest lands in your inbox on Monday.
          </p>
        </div>
      ) : (
        <div className="grid items-center gap-5 md:grid-cols-[1fr_auto]">
          <div>
            <h2 id={`${id}-heading`} className="font-display text-2xl md:text-3xl">
              New roles, every week
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Join over 10,000 subscribers receiving a curated digest of jobs and
              opportunities across international development.
            </p>
          </div>
          <div className="md:w-[26rem]">
            {form}
            {status === "error" && (
              <p className="mt-2 text-sm text-destructive">
                Something went wrong — please try again.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
