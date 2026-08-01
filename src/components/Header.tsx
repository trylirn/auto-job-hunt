import { Link, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";

const NAV = [
  { to: "/", label: "Jobs", end: true },
  { to: "/opportunities", label: "Opportunities", end: false },
  { to: "/jobs/in", label: "Locations", end: false },
  { to: "/guides/un-careers", label: "Guide", end: false },
];

export function Header() {
  const [open, setOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "relative py-1 transition-colors hover:text-foreground",
      isActive
        ? "text-foreground after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:bg-primary"
        : "text-muted-foreground"
    );

  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-background/85 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <img
            src="/logo.png"
            alt="Eplicant — International Development Jobs"
            width={32}
            height={32}
            fetchPriority="high"
            decoding="async"
            className="h-8 w-8 rounded-sm object-contain"
          />
          <span className="font-display text-2xl leading-none tracking-tight">
            Eplicant
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-6 text-sm md:flex"
        >
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
          <Button asChild size="sm" className="h-8 rounded-sm">
            <Link to="/submit">Post a job</Link>
          </Button>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <Button asChild size="sm" variant="outline" className="h-8 rounded-sm">
            <Link to="/submit">Post a job</Link>
          </Button>
          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="rounded-sm p-1.5 text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {open && (
        <nav
          aria-label="Mobile"
          className="border-t border-rule bg-background md:hidden"
        >
          <ul className="container flex flex-col py-2 text-sm">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "block py-2",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
