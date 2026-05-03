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
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-3">
              <img src="/logo.png" alt="Eplicant" className="h-8 w-8 rounded-lg" />
              <span className="font-display font-bold">Eplicant</span>
            </Link>
            <p className="text-xs text-muted-foreground">
              Jobs and opportunities for the international development sector.
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
              <li><Link to="/terms" className="hover:text-foreground">Terms</Link></li>
              <li><Link to="/privacy" className="hover:text-foreground">Privacy</Link></li>
            </ul>
          </div>
        </div>

        {/* Newsletter — separate, compact block */}
        <div className="mt-8 pt-5 border-t">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Stay updated
              </h4>
              <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                Join 10,000+ subscribers — weekly digest
              </p>
            </div>
            {status === "success" ? (
              <p className="text-[11px] text-primary flex items-center gap-1.5">
                <Mail className="h-3 w-3" /> Subscribed — thanks!
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="flex items-center gap-1.5 max-w-xs w-full sm:w-auto">
                <Input
                  type="email"
                  required
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
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Eplicant. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
