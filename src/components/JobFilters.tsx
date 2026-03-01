import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface JobFiltersProps {
  jobType: string;
  onJobTypeChange: (value: string) => void;
  remoteOnly: boolean;
  onRemoteToggle: () => void;
  category: string;
  onCategoryChange: (value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const JOB_TYPES = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "freelance", label: "Freelance" },
  { value: "internship", label: "Internship" },
];

const CATEGORIES = [
  { value: "engineering", label: "Engineering" },
  { value: "design", label: "Design" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "product", label: "Product" },
  { value: "operations", label: "Operations" },
  { value: "finance", label: "Finance" },
  { value: "hr", label: "Human Resources" },
  { value: "other", label: "Other" },
];

export function JobFilters({
  jobType,
  onJobTypeChange,
  remoteOnly,
  onRemoteToggle,
  category,
  onCategoryChange,
  onClearFilters,
  hasActiveFilters,
}: JobFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={jobType} onValueChange={onJobTypeChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Job type" />
        </SelectTrigger>
        <SelectContent>
          {JOB_TYPES.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={category} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((cat) => (
            <SelectItem key={cat.value} value={cat.value}>
              {cat.label}
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
