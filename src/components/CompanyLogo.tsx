import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

/** Best-effort domain guess for a company name (used for logo lookup). */
function guessDomain(company: string): string | null {
  const cleaned = company
    .toLowerCase()
    .replace(/\b(inc|llc|ltd|limited|corp|corporation|gmbh|bv|plc|co)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
  if (cleaned.length < 2) return null;
  return `${cleaned}.com`;
}

interface CompanyLogoProps {
  company: string;
  logo?: string | null;
  className?: string;
  /** Rendered size in px (used for width/height attributes). */
  size?: number;
}

/**
 * Company logo with graceful degradation: stored logo → favicon lookup by
 * guessed domain → initials tile. The favicon service 404s on unknown
 * domains, which triggers the initials fallback.
 */
export function CompanyLogo({ company, logo, className, size = 40 }: CompanyLogoProps) {
  const sources = useMemo(() => {
    const list: string[] = [];
    if (logo) list.push(logo);
    const domain = guessDomain(company || "");
    if (domain) {
      list.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
    }
    return list;
  }, [company, logo]);

  const [index, setIndex] = useState(0);
  const src = sources[index];

  const initials = (company || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  if (!src) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-sm border border-rule bg-muted font-display text-xs text-muted-foreground",
          className
        )}
        aria-hidden="true"
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`${company} logo`}
      loading="lazy"
      width={size}
      height={size}
      onError={() => setIndex((i) => i + 1)}
      className={cn(
        "shrink-0 rounded-sm border border-rule bg-background object-contain p-0.5",
        className
      )}
    />
  );
}
