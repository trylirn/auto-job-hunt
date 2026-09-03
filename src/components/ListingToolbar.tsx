import { Search, LayoutGrid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const ALL_COUNTRIES = "all";

interface ListingToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  view: "grid" | "list";
  onViewChange: (v: "grid" | "list") => void;
  resultCount?: number;
  resultNoun: string;
  /** Country/region options, already de-duplicated and sorted. */
  countries?: { value: string; label: string }[];
  country?: string;
  onCountryChange?: (v: string) => void;
}

export function ListingToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search by title, organisation or keyword",
  view,
  onViewChange,
  resultCount,
  resultNoun,
  countries,
  country = ALL_COUNTRIES,
  onCountryChange,
}: ListingToolbarProps) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <label htmlFor="listing-search" className="sr-only">
          {searchPlaceholder}
        </label>
        <Input
          id="listing-search"
          type="search"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-12 rounded-sm border-rule bg-card pl-10 text-base"
        />
      </div>

      {countries && countries.length > 0 && onCountryChange && (
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="country-filter" className="sr-only">
            Filter by country
          </label>
          <Select value={country} onValueChange={onCountryChange}>
            <SelectTrigger
              id="country-filter"
              className="h-11 w-full rounded-sm border-rule bg-card sm:w-72"
              aria-label="Filter by country"
            >
              <SelectValue placeholder="All countries" />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              <SelectItem value={ALL_COUNTRIES}>All countries</SelectItem>
              {countries.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {country !== ALL_COUNTRIES && (
            <button
              type="button"
              onClick={() => onCountryChange(ALL_COUNTRIES)}
              className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        {resultCount !== undefined ? (
          <p
            className="whitespace-nowrap text-sm text-muted-foreground"
            aria-live="polite"
          >
            {resultCount.toLocaleString()} remote {resultNoun}
            {resultCount === 1 ? "" : "s"}
          </p>
        ) : (
          <span />
        )}

        <div
          role="group"
          aria-label="View mode"
          className="flex items-center border border-rule"
        >
          <button
            type="button"
            aria-label="Grid view"
            aria-pressed={view === "grid"}
            onClick={() => onViewChange("grid")}
            className={cn(
              "p-2 transition-colors",
              view === "grid"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="List view"
            aria-pressed={view === "list"}
            onClick={() => onViewChange("list")}
            className={cn(
              "border-l border-rule p-2 transition-colors",
              view === "list"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
