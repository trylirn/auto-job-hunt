import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Header() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <img src="/logo.png" alt="Eplicant — International Development Jobs" className="h-9 w-9 rounded-lg object-contain" />
          <span className="font-display text-xl font-bold tracking-tight hidden sm:inline">
            Eplicant
          </span>
        </Link>
        <nav className="flex items-center gap-3 sm:gap-4 text-sm font-medium">
          <Link
            to="/"
            className={cn(
              "transition-colors hover:text-foreground",
              location.pathname === "/" ? "text-foreground" : "text-muted-foreground"
            )}>
            Jobs
          </Link>
          <Link
            to="/opportunities"
            className={cn(
              "transition-colors hover:text-foreground",
              location.pathname === "/opportunities" ? "text-foreground" : "text-muted-foreground"
            )}>
            Opportunities
          </Link>
          <Button asChild size="sm" className="h-8">
            <Link to="/submit">Post a Job</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
