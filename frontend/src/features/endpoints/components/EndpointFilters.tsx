import { useState, useCallback } from "react";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Search, X, Filter } from "lucide-react";
import { HTTP_METHODS, ENDPOINT_STATUSES } from "@/types/endpoints";

export interface EndpointFiltersState {
  search: string;
  method: string;
  status: string;
  sort: string;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "recently_updated", label: "Recently Updated" },
  { value: "alphabetical", label: "Alphabetical" },
];

interface EndpointFiltersProps {
  filters: EndpointFiltersState;
  onChange: (filters: EndpointFiltersState) => void;
}

export function EndpointFilters({ filters, onChange }: EndpointFiltersProps) {
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
    onChange({ search: "", method: "", status: "", sort: "" });
  };

  const hasFilters = filters.search || filters.method || filters.status || filters.sort;

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
            placeholder="Search by name, URL, tag..."
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
            options={[{ value: "", label: "All Methods" }, ...HTTP_METHODS.map((m) => ({ value: m, label: m }))]}
            value={filters.method}
            onChange={(e) => onChange({ ...filters, method: e.target.value })}
          />
          <Select
            options={[{ value: "", label: "All Statuses" }, ...ENDPOINT_STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))]}
            value={filters.status}
            onChange={(e) => onChange({ ...filters, status: e.target.value })}
          />
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
