import { Briefcase } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export function Header() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Briefcase className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">
            Eplicant
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
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
        </nav>
      </div>
    </header>);

}