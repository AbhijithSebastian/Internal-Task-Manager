import { Search, X, LayoutList, Columns3, Calendar, Grid3X3 } from "lucide-react";
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
}

const viewIcons: Record<ViewMode, typeof LayoutList> = {
  list: LayoutList,
  board: Columns3,
  calendar: Calendar,
  grid: Grid3X3,
};

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
}: FilterBarProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tertiary pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-9 pl-9 pr-8 rounded-md bg-surface border border-default text-sm text-primary placeholder:text-tertiary hover:border-hover focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary transition-colors duration-fast"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-secondary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {filters.map((filter) => (
          <select
            key={filter.key}
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            className="h-9 px-3 rounded-md bg-surface border border-default text-sm text-primary hover:border-hover focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary transition-colors duration-fast"
          >
            <option value="">{filter.label}</option>
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ))}
        {availableViews && onViewChange && (
          <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-subtle border border-default">
            {availableViews.map((mode) => {
              const Icon = viewIcons[mode];
              return (
                <button
                  key={mode}
                  onClick={() => onViewChange(mode)}
                  className={cn(
                    "p-1.5 rounded text-sm transition-colors duration-fast",
                    view === mode
                      ? "bg-surface text-primary shadow-sm"
                      : "text-tertiary hover:text-secondary"
                  )}
                  title={mode.charAt(0).toUpperCase() + mode.slice(1)}
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
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-soft text-primary text-xs font-medium"
            >
              {chip.label}
              <button onClick={chip.onRemove} className="hover:text-primary-hover">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {onClearAll && (
            <button
              onClick={onClearAll}
              className="text-xs text-secondary hover:text-primary transition-colors duration-fast"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
