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
  category: string;
  onCategoryChange: (value: string) => void;
  location: string;
  onLocationChange: (value: string) => void;
  source: string;
  onSourceChange: (value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function JobFilters({
  jobType,
  onJobTypeChange,
  remoteOnly,
  onRemoteToggle,
  category,
  onCategoryChange,
  location,
  onLocationChange,
  source,
  onSourceChange,
  onClearFilters,
  hasActiveFilters,
}: JobFiltersProps) {
  const { data: options, isLoading } = useFilterOptions();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={jobType} onValueChange={onJobTypeChange}>
        <SelectTrigger className="w-[150px]">
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

      <Select value={category} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-[170px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          {options?.categories.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={location} onValueChange={onLocationChange}>
        <SelectTrigger className="w-[170px]">
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

      <Select value={source} onValueChange={onSourceChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Source" />
        </SelectTrigger>
        <SelectContent>
          {options?.sources.map((src) => (
            <SelectItem key={src} value={src}>
              {src}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant={remoteOnly ? "default" : "outline"}
        size="sm"
        onClick={onRemoteToggle}
        className="gap-1.5"
      >
        🌍 Remote
      </Button>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters} className="gap-1">
          <X className="h-3.5 w-3.5" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
