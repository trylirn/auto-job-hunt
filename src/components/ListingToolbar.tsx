import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterState {
  region: string;
  workMode: string;
  category: string;
  location: string;
  dateRange: string;
}

interface ListingToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
  locations: string[];
  /** Second dropdown: work mode (jobs) or category (opportunities). */
  mode: "jobs" | "opportunities";
  view: "grid" | "list";
  onViewChange: (v: "grid" | "list") => void;
  resultCount?: number;
  resultNoun: string;
}

const WORK_MODES = ["Remote", "Hybrid", "Physical"];
const CATEGORIES = [
  { value: "fellowship", label: "Fellowships" },
  { value: "scholarship", label: "Scholarships" },
  { value: "grant", label: "Grants" },
  { value: "conference", label: "Conferences" },
  { value: "internship", label: "Internships" },
];

export function ListingToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search by title, organisation or keyword",
  filters,
  onFilterChange,
  onClear,
  hasActiveFilters,
  locations,
  mode,
  view,
  onViewChange,
  resultCount,
  resultNoun,
}: ListingToolbarProps) {
  const selectClass =
    "h-9 w-full rounded-sm border-rule bg-card text-sm sm:w-[9.5rem]";

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

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={filters.region}
            onValueChange={(v) => onFilterChange("region", v)}
          >
            <SelectTrigger className={selectClass} aria-label="Region">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="us">U.S. based</SelectItem>
              <SelectItem value="non-us">Outside the U.S.</SelectItem>
            </SelectContent>
          </Select>

          {mode === "jobs" ? (
            <Select
              value={filters.workMode}
              onValueChange={(v) => onFilterChange("workMode", v)}
            >
              <SelectTrigger className={selectClass} aria-label="Work mode">
                <SelectValue placeholder="Work mode" />
              </SelectTrigger>
              <SelectContent>
                {WORK_MODES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Select
              value={filters.category}
              onValueChange={(v) => onFilterChange("category", v)}
            >
              <SelectTrigger className={selectClass} aria-label="Category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select
            value={filters.location}
            onValueChange={(v) => onFilterChange("location", v)}
          >
            <SelectTrigger
              className={cn(selectClass, "sm:w-[12rem]")}
              aria-label="Location"
            >
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {locations.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.dateRange}
            onValueChange={(v) => onFilterChange("dateRange", v)}
          >
            <SelectTrigger className={selectClass} aria-label="Date posted">
              <SelectValue placeholder="Date posted" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Past 24 hours</SelectItem>
              <SelectItem value="week">Past week</SelectItem>
              <SelectItem value="month">Past month</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-9 gap-1 rounded-sm text-sm"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" /> Clear
            </Button>
          )}
        </div>

        <div className="flex items-center gap-4">
          {resultCount !== undefined && (
            <p className="whitespace-nowrap text-sm text-muted-foreground" aria-live="polite">
              {resultCount.toLocaleString()} {resultNoun}
              {resultCount === 1 ? "" : "s"}
            </p>
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
    </div>
  );
}
