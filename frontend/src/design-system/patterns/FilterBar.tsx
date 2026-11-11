import { Calendar, Columns3, Grid3X3, LayoutList, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "list" | "board" | "calendar" | "grid";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters: FilterConfig[];
  view?: ViewMode;
  availableViews?: ViewMode[];
  onViewChange?: (view: ViewMode) => void;
  activeChips?: { key: string; label: string; onRemove: () => void }[];
  onClearAll?: () => void;
  className?: string;
}

const viewIcons: Record<ViewMode, typeof LayoutList> = {
  list: LayoutList,
  board: Columns3,
  calendar: Calendar,
  grid: Grid3X3,
};

const control =
  "h-9 rounded-control border border-default bg-surface text-sm text-primary transition-colors duration-fast hover:border-hover focus:border-focus focus:outline-none focus:ring-2 focus:ring-primary-ring";

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters,
  view,
  availableViews,
  onViewChange,
  activeChips,
  onClearAll,
  className,
}: FilterBarProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 max-w-sm flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tertiary"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className={cn(control, "w-full pl-9 pr-8 placeholder:text-tertiary")}
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary transition-colors hover:text-secondary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {filters.map((filter) => (
          <select
            key={filter.key}
            value={filter.value}
            onChange={(event) => filter.onChange(event.target.value)}
            aria-label={filter.label}
            className={cn(control, "px-3")}
          >
            <option value="">{filter.label}</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ))}

        {availableViews && onViewChange && (
          <div className="border-default flex items-center gap-0.5 rounded-control border bg-subtle p-0.5">
            {availableViews.map((mode) => {
              const Icon = viewIcons[mode];
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onViewChange(mode)}
                  title={mode.charAt(0).toUpperCase() + mode.slice(1)}
                  aria-pressed={view === mode}
                  className={cn(
                    "rounded-sm p-1.5 transition-colors duration-fast",
                    view === mode
                      ? "bg-surface text-primary shadow-sm"
                      : "text-tertiary hover:text-secondary",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {activeChips && activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1.5 rounded-pill bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary"
            >
              {chip.label}
              <button
                type="button"
                onClick={chip.onRemove}
                aria-label={`Remove ${chip.label} filter`}
                className="hover:text-primary-hover"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs text-secondary transition-colors duration-fast hover:text-primary"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
