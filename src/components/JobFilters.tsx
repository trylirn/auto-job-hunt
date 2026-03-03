import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
const COUNTRIES = [
  "Nigeria", "Kenya", "South Africa", "Ghana", "Egypt", "Tanzania",
  "Uganda", "Rwanda", "Ethiopia", "Cameroon", "Senegal",
  "USA", "United Kingdom", "Canada", "Germany", "France",
  "Netherlands", "Australia", "India", "UAE", "Global",
];

interface JobFiltersProps {
  jobType: string;
  onJobTypeChange: (value: string) => void;
  location: string;
  onLocationChange: (value: string) => void;
  dateRange: string;
  onDateRangeChange: (value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function JobFilters({
  jobType,
  onJobTypeChange,
  location,
  onLocationChange,
  dateRange,
  onDateRangeChange,
  onClearFilters,
  hasActiveFilters,
}: JobFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
      <Select value={jobType} onValueChange={onJobTypeChange}>
        <SelectTrigger className="w-full sm:w-[140px] text-sm">
          <SelectValue placeholder="Work mode" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Remote">Remote</SelectItem>
          <SelectItem value="Hybrid">Hybrid</SelectItem>
          <SelectItem value="Physical">Physical</SelectItem>
        </SelectContent>
      </Select>

      <Select value={location} onValueChange={onLocationChange}>
        <SelectTrigger className="w-full sm:w-[180px] text-sm">
          <SelectValue placeholder="Country" />
        </SelectTrigger>
        <SelectContent>
          {COUNTRIES.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={dateRange} onValueChange={onDateRangeChange}>
        <SelectTrigger className="w-full sm:w-[140px] text-sm">
          <SelectValue placeholder="Date posted" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="24h">Past 24 hours</SelectItem>
          <SelectItem value="week">Past week</SelectItem>
          <SelectItem value="month">Past month</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters} className="gap-1">
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
