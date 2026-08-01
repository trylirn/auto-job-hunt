import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PagerProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Base path used for real hrefs so crawlers see linkable pages. */
  basePath: string;
}

function pageHref(basePath: string, page: number) {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}

export function Pager({ currentPage, totalPages, onPageChange, basePath }: PagerProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "gap")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("gap");
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("gap");
    pages.push(totalPages);
  }

  const item =
    "inline-flex h-9 min-w-9 items-center justify-center border border-rule px-3 text-sm transition-colors";

  return (
    <nav aria-label="Pagination" className="flex justify-center">
      <ul className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link
            to={pageHref(basePath, currentPage - 1)}
            onClick={(e) => {
              e.preventDefault();
              onPageChange(Math.max(1, currentPage - 1));
            }}
            aria-label="Previous page"
            aria-disabled={currentPage === 1}
            className={cn(
              item,
              currentPage === 1
                ? "pointer-events-none opacity-40"
                : "hover:bg-secondary"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </li>

        {pages.map((p, i) =>
          p === "gap" ? (
            <li key={`gap-${i}`} className="px-1 text-sm text-muted-foreground">
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                to={pageHref(basePath, p)}
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(p);
                }}
                aria-label={`Page ${p}`}
                aria-current={p === currentPage ? "page" : undefined}
                className={cn(
                  item,
                  p === currentPage
                    ? "border-foreground bg-foreground text-background"
                    : "hover:bg-secondary"
                )}
              >
                {p}
              </Link>
            </li>
          )
        )}

        <li>
          <Link
            to={pageHref(basePath, currentPage + 1)}
            onClick={(e) => {
              e.preventDefault();
              onPageChange(Math.min(totalPages, currentPage + 1));
            }}
            aria-label="Next page"
            aria-disabled={currentPage === totalPages}
            className={cn(
              item,
              currentPage === totalPages
                ? "pointer-events-none opacity-40"
                : "hover:bg-secondary"
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </li>
      </ul>
    </nav>
  );
}
