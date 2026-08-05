import { Link } from "react-router-dom";
import { NewsletterSignup } from "@/components/NewsletterSignup";

const BADGES = [
  {
    href: "https://findly.tools/eplicant?utm_source=eplicant",
    src: "https://findly.tools/badges/findly-tools-badge-light.svg",
    alt: "Featured on Findly.tools",
  },
  {
    href: "https://twelve.tools",
    src: "https://twelve.tools/badge0-white.svg",
    alt: "Featured on Twelve Tools",
  },
  {
    href: "https://dofollow.tools",
    src: "https://dofollow.tools/badge/badge_light.svg",
    alt: "Featured on Dofollow.Tools",
  },
  {
    href: "https://similarlabs.com",
    src: "https://similarlabs.com/similarlabs-embed-badge-dark.svg",
    alt: "Listed on SimilarLabs",
  },
  {
    href: "https://launchboard.dev",
    src: "https://launchboard.dev/launchboard-badge.png",
    alt: "Launched on LaunchBoard",
  },
  {
    href: "https://wired.business",
    src: "https://wired.business/badge0-light.svg",
    alt: "Featured on Wired Business",
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-rule bg-card">
      <div className="container py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link to="/" className="mb-3 flex items-center gap-2">
              <img
                src="/logo.png"
                alt="Eplicant"
                width={28}
                height={28}
                loading="lazy"
                className="h-7 w-7 rounded-sm object-contain"
              />
              <span className="font-display text-xl">Eplicant</span>
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">
              A job board for the international development sector — roles,
              fellowships, scholarships and grants, in one place.
            </p>
          </div>

          <nav aria-label="Browse">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Browse
            </h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground">Jobs</Link></li>
              <li><Link to="/opportunities" className="hover:text-foreground">Opportunities</Link></li>
              <li><Link to="/jobs/in" className="hover:text-foreground">Jobs by location</Link></li>
              <li><Link to="/guides/un-careers" className="hover:text-foreground">UN careers guide</Link></li>
              <li><Link to="/submit" className="hover:text-foreground">Post a remote job</Link></li>
            </ul>
          </nav>

          <nav aria-label="Jobs by country">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              By country
            </h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/jobs/in/united-states" className="hover:text-foreground">United States</Link></li>
              <li><Link to="/jobs/in/usa-global" className="hover:text-foreground">USA / Global (Remote)</Link></li>
              <li><Link to="/jobs/in/united-kingdom" className="hover:text-foreground">United Kingdom</Link></li>
              <li><Link to="/jobs/in/kenya" className="hover:text-foreground">Kenya</Link></li>
              <li><Link to="/jobs/in/nigeria" className="hover:text-foreground">Nigeria</Link></li>
            </ul>
          </nav>

          <nav aria-label="Company">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Eplicant
            </h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground">About</Link></li>
              <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
              <li><Link to="/terms" className="hover:text-foreground">Terms</Link></li>
              <li><Link to="/privacy" className="hover:text-foreground">Privacy</Link></li>
            </ul>
          </nav>
        </div>

        {/* Newsletter — quiet, separate band */}
        <div className="mt-10 border-t border-rule pt-6">
          <NewsletterSignup variant="inline" />
        </div>

        <div className="mt-8 border-t border-rule pt-6">
          <div className="overflow-hidden py-1">
            <div className="flex w-max items-center gap-8 animate-marquee opacity-60">
              {[...BADGES, ...BADGES].map((b, i) => (
                <a
                  key={`${b.href}-${i}`}
                  href={b.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-hidden={i >= BADGES.length}
                  tabIndex={i >= BADGES.length ? -1 : undefined}
                >
                  <img
                    src={b.src}
                    alt={b.alt}
                    loading="lazy"
                    width={160}
                    height={44}
                    className="h-11 w-auto"
                  />
                </a>
              ))}
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Eplicant. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
