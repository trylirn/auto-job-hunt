import { Link } from "react-router-dom";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === "loading") return;
    setStatus("loading");
    try {
      const res = await fetch(
        "https://script.google.com/macros/s/AKfycbxX2sGsTeq3Dxliq0duBvWq2gluYuEjEdotLID_u-obgzSAuXI_ByQX8zisMCCrNL6a/exec",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ email }),
        }
      );
      if (!res.ok) throw new Error();
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <footer className="border-t bg-card mt-12">
      <div className="container py-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-3">
              <img src="/logo.png" alt="Eplicant" className="h-8 w-8 rounded-lg" />
              <span className="font-display font-bold">Eplicant</span>
            </Link>
            <p className="text-xs text-muted-foreground">
              Discover jobs and opportunities that match your ambitions.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">Browse</h4>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground">Jobs</Link></li>
              <li><Link to="/opportunities" className="hover:text-foreground">Opportunities</Link></li>
              <li><Link to="/newsletter" className="hover:text-foreground">Newsletter</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">Company</h4>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground">About</Link></li>
              <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
              <li><Link to="/submit" className="hover:text-foreground">Post a Job</Link></li>
              <li><Link to="/terms" className="hover:text-foreground">Terms</Link></li>
              <li><Link to="/privacy" className="hover:text-foreground">Privacy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Newsletter
            </h4>
            {status === "success" ? (
              <p className="text-xs text-primary">You're subscribed!</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-2">
                <Input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-8 text-xs"
                />
                <Button type="submit" size="sm" className="w-full h-8 text-xs" disabled={status === "loading"}>
                  {status === "loading" ? "..." : "Subscribe"}
                </Button>
                {status === "error" && (
                  <p className="text-xs text-destructive">Try again.</p>
                )}
              </form>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Eplicant. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
