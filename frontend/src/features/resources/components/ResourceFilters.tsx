import { useState, useCallback } from "react";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Search, X, Filter } from "lucide-react";
import { RESOURCE_TYPES } from "@/types/resources";

export interface ResourceFiltersState {
  search: string;
  resource_type: string;
  category: string;
  sort: string;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "recently_updated", label: "Recently Updated" },
  { value: "alphabetical", label: "Alphabetical" },
];

interface ResourceFiltersProps {
  filters: ResourceFiltersState;
  onChange: (filters: ResourceFiltersState) => void;
  categories?: string[];
}

export function ResourceFilters({ filters, onChange, categories = [] }: ResourceFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search);

  const handleSearch = useCallback(() => {
    onChange({ ...filters, search: searchInput });
  }, [filters, onChange, searchInput]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const clearFilters = () => {
    setSearchInput("");
    onChange({ search: "", resource_type: "", category: "", sort: "" });
  };

  const hasFilters = filters.search || filters.resource_type || filters.category || filters.sort;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tertiary" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search resources..."
            className="w-full h-9 pl-9 pr-3 rounded-md bg-surface border border-default text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-ring"
          />
        </div>
        <Button variant="secondary" size="sm" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4" />
          Filters
        </Button>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
      {showFilters && (
        <div className="flex items-center gap-3 flex-wrap">
          <Select
            options={[{ value: "", label: "All Types" }, ...RESOURCE_TYPES.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))]}
            value={filters.resource_type}
            onChange={(e) => onChange({ ...filters, resource_type: e.target.value })}
          />
          {categories.length > 0 && (
            <Select
              options={[{ value: "", label: "All Categories" }, ...categories.map((c) => ({ value: c, label: c }))]}
              value={filters.category}
              onChange={(e) => onChange({ ...filters, category: e.target.value })}
            />
          )}
          <Select
            options={SORT_OPTIONS}
            value={filters.sort || "newest"}
            onChange={(e) => onChange({ ...filters, sort: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}
