import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useFilterOptions } from "@/hooks/useFilterOptions";

interface JobFiltersProps {
  jobType: string;
  onJobTypeChange: (value: string) => void;
  remoteOnly: boolean;
  onRemoteToggle: () => void;
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
  remoteOnly,
  onRemoteToggle,
  location,
  onLocationChange,
  dateRange,
  onDateRangeChange,
  onClearFilters,
  hasActiveFilters,
}: JobFiltersProps) {
  const { data: options } = useFilterOptions();

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
      <Select value={jobType} onValueChange={onJobTypeChange}>
        <SelectTrigger className="w-full sm:w-[140px] text-sm">
          <SelectValue placeholder="Job type" />
        </SelectTrigger>
        <SelectContent>
          {options?.jobTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={location} onValueChange={onLocationChange}>
        <SelectTrigger className="w-full sm:w-[150px] text-sm">
          <SelectValue placeholder="Location" />
        </SelectTrigger>
        <SelectContent>
          {options?.locations.map((loc) => (
            <SelectItem key={loc} value={loc}>
              {loc}
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

      <Button
        variant={remoteOnly ? "default" : "outline"}
        size="sm"
        onClick={onRemoteToggle}
        className="gap-1.5 text-sm"
      >
        🌍 Remote
      </Button>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters} className="gap-1">
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
