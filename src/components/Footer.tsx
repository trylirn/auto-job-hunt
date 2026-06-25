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
      <div className="container py-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-3">
              <img src="/logo.png" alt="Eplicant — International Development Jobs" className="h-8 w-8 rounded-lg" />
              <span className="font-display font-bold">Eplicant</span>
            </Link>
            <p className="text-xs text-muted-foreground">
              Jobs and opportunities for the international development sector.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">Browse</h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground">Jobs</Link></li>
              <li><Link to="/opportunities" className="hover:text-foreground">Opportunities</Link></li>
              <li><Link to="/newsletter" className="hover:text-foreground">Newsletter</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">Jobs by country</h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li><Link to="/jobs/in/united-states" className="hover:text-foreground">United States</Link></li>
              <li><Link to="/jobs/in/usa-global" className="hover:text-foreground">USA / Global (Remote)</Link></li>
              <li><Link to="/jobs/in/united-kingdom" className="hover:text-foreground">United Kingdom</Link></li>
              <li><Link to="/jobs/in/nigeria" className="hover:text-foreground">Nigeria</Link></li>
              <li><Link to="/jobs/in/kenya" className="hover:text-foreground">Kenya</Link></li>
              <li><Link to="/jobs/in" className="hover:text-foreground font-medium text-foreground">Browse all locations →</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">Company</h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground">About</Link></li>
              <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
              <li><Link to="/terms" className="hover:text-foreground">Terms</Link></li>
              <li><Link to="/privacy" className="hover:text-foreground">Privacy</Link></li>
            </ul>
          </div>
        </div>

        {/* Newsletter — separate, compact block */}
        <div className="mt-8 pt-5 border-t">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Stay updated
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Join 10,000+ subscribers — weekly digest
              </p>
            </div>
            {status === "success" ? (
              <p className="text-[11px] text-primary flex items-center gap-1.5">
                <Mail className="h-3 w-3" /> Subscribed — thanks!
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="flex items-center gap-1.5 max-w-xs w-full sm:w-auto">
                <label htmlFor="footer-newsletter-email" className="sr-only">
                  Email address for newsletter subscription
                </label>
                <Input
                  id="footer-newsletter-email"
                  type="email"
                  required
                  aria-label="Email address for newsletter subscription"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-7 text-[11px] flex-1"
                />
                <Button type="submit" size="sm" className="h-7 text-[11px] px-3" disabled={status === "loading"}>
                  {status === "loading" ? "..." : "Join"}
                </Button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-6 pt-5 border-t">
          <div className="overflow-hidden py-2">
            <div className="flex w-max items-center gap-6 animate-marquee">
              <a
                href="https://findly.tools/eplicant?utm_source=eplicant"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="https://findly.tools/badges/findly-tools-badge-light.svg"
                  alt="Featured on Findly.tools"
                  className="h-14 w-auto"
                />
              </a>
              <a
                href="https://twelve.tools"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="https://twelve.tools/badge0-white.svg"
                  alt="Featured on Twelve Tools"
                  className="h-14 w-auto"
                />
              </a>
              <a 
                href="https://launchboard.dev"
                target="_blank" rel="noopener"
              >
                <img 
                  src="https://launchboard.dev/launchboard-badge.png"
                  alt="Launched on LaunchBoard - Product Launch Platform"
                  width="240"
                  height="60"
                />
              </a>
              <a 
                href="https://wired.business" 
                target="_blank"
              >
                <img 
                  src="https://wired.business/badge0-light.svg" 
                  alt="Featured on Wired Business"
                  width="200" 
                  height="54"
                />
              </a>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} Eplicant. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
