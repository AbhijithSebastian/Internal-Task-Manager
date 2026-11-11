import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  Columns3,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./Badge";
import { getPageNumbers } from "./Pagination";

export interface TableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (item: T) => ReactNode;
  className?: string;
  hidden?: boolean;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (key: string) => void;
  onRowClick?: (item: T) => void;
  keyExtractor: (item: T) => string | number;
  selectedKeys?: Set<string | number>;
  onSelectChange?: (keys: Set<string | number>) => void;
  emptyState?: ReactNode;
  page?: number;
  totalPages?: number;
  total?: number;
  perPage?: number;
  onPageChange?: (page: number) => void;
  exportable?: boolean;
  exportFilename?: string;
  bulkActions?: ReactNode;
}

type Density = "comfortable" | "compact";

const densityRowClasses: Record<Density, string> = {
  comfortable: "py-3",
  compact: "py-1.5",
};

const iconButton =
  "rounded-sm p-1.5 text-tertiary transition-colors hover:bg-hover hover:text-primary";

export function Table<T extends object>({
  columns,
  data,
  loading,
  sortBy,
  sortDirection,
  onSort,
  onRowClick,
  keyExtractor,
  selectedKeys,
  onSelectChange,
  emptyState,
  page,
  totalPages,
  total,
  perPage = 20,
  onPageChange,
  exportable,
  exportFilename = "export",
  bulkActions,
}: TableProps<T>) {
  const [density, setDensity] = useState<Density>("comfortable");
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    columns.map((column) => column.key),
  );

  const activeColumns = useMemo(
    () => columns.filter((column) => visibleColumns.includes(column.key) && !column.hidden),
    [columns, visibleColumns],
  );

  const allSelected = data.length > 0 && selectedKeys?.size === data.length;
  const someSelected = (selectedKeys?.size ?? 0) > 0 && !allSelected;

  const handleSelectAll = useCallback(() => {
    if (!onSelectChange) return;
    if (allSelected) {
      onSelectChange(new Set());
    } else {
      onSelectChange(new Set(data.map((item) => keyExtractor(item))));
    }
  }, [onSelectChange, allSelected, data, keyExtractor]);

  const handleSelect = useCallback(
    (key: string | number) => {
      if (!onSelectChange) return;
      const next = new Set(selectedKeys);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      onSelectChange(next);
    },
    [onSelectChange, selectedKeys],
  );

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((value) => value !== key) : [...prev, key],
    );
  };

  const exportCSV = () => {
    const headers = activeColumns.map((column) => column.label).join(",");
    const rows = data.map((item) =>
      activeColumns
        .map((column) => {
          const value = column.render
            ? stripHtml(renderNodeToString(column.render(item)))
            : String((item as Record<string, unknown>)[column.key] ?? "");
          return `"${value.replace(/"/g, '""')}"`;
        })
        .join(","),
    );
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${exportFilename}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-border-default bg-surface shadow-card">
        <div className="border-b border-border-default bg-grey-50 px-4 py-3">
          <div className="flex gap-4">
            {onSelectChange && <div className="w-10 shrink-0" />}
            {activeColumns.map((column) => (
              <div
                key={column.key}
                className="skeleton-pulse h-4 rounded bg-grey-100"
                style={{ flex: column.width ? `0 0 ${column.width}` : "1 1 0" }}
              />
            ))}
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="border-b border-border-subtle px-4 py-3 last:border-0">
            <div className="flex items-center gap-4">
              {onSelectChange && (
                <div className="flex w-10 shrink-0 justify-center">
                  <div className="skeleton-pulse h-4 w-4 rounded bg-grey-100" />
                </div>
              )}
              {activeColumns.map((column) => (
                <div
                  key={column.key}
                  className="skeleton-pulse h-3 rounded bg-grey-100"
                  style={{ flex: column.width ? `0 0 ${column.width}` : "1 1 0" }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border-default bg-surface shadow-card">
        {emptyState || (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-grey-50">
              <ChevronsUpDown className="h-6 w-6 text-grey-400" />
            </div>
            <h3 className="mb-1 text-sm font-bold text-grey-900 font-sans">No data found</h3>
            <p className="text-xs text-grey-500">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border-default bg-surface shadow-card">
      <div className="flex items-center justify-between border-b border-border-default bg-grey-50 px-4 py-2">
        <div className="flex items-center gap-2">
          {selectedKeys && selectedKeys.size > 0 && (
            <Badge variant="info" size="sm">
              {selectedKeys.size} selected
            </Badge>
          )}
          {selectedKeys && selectedKeys.size > 0 && bulkActions && (
            <div className="flex items-center gap-1">{bulkActions}</div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setDensity(density === "comfortable" ? "compact" : "comfortable")}
            className={iconButton}
            title={`Switch to ${density === "comfortable" ? "compact" : "comfortable"} view`}
          >
            <Columns3 className="h-3.5 w-3.5" />
          </button>
          {exportable && (
            <button type="button" onClick={exportCSV} className={iconButton} title="Export CSV">
              <Download className="h-3.5 w-3.5" />
            </button>
          )}
          {columns.filter((column) => !column.hidden).length > 1 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                className={iconButton}
                title="Columns"
              >
                <Columns3 className="h-3.5 w-3.5" />
              </button>
              {showColumnMenu && (
                <div className="absolute right-0 top-full z-dropdown mt-1.5 w-48 rounded-xl border border-border-default bg-surface py-1.5 shadow-dropdown">
                  {columns
                    .filter((column) => !column.hidden)
                    .map((column) => (
                      <label
                        key={column.key}
                        className="flex cursor-pointer items-center gap-2 px-3.5 py-1.5 text-xs text-grey-800 hover:bg-grey-50"
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns.includes(column.key)}
                          onChange={() => toggleColumn(column.key)}
                          className="border-default h-3.5 w-3.5 rounded-sm accent-primary"
                        />
                        {column.label}
                      </label>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-default bg-grey-50">
              {onSelectChange && (
                <th className={cn("w-10 px-3 text-left", densityRowClasses[density])}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(element) => {
                      if (element) element.indeterminate = someSelected;
                    }}
                    onChange={handleSelectAll}
                    className="focus:ring-primary-ring h-4 w-4 rounded border-border-default accent-primary"
                  />
                </th>
              )}
              {activeColumns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 text-left text-xs font-bold uppercase tracking-wider text-grey-700",
                    column.sortable && "cursor-pointer select-none hover:text-grey-900",
                    densityRowClasses[density],
                    column.className,
                  )}
                  style={column.width ? { width: column.width } : undefined}
                  onClick={() => column.sortable && onSort?.(column.key)}
                >
                  <div className="flex items-center gap-1.5">
                    {column.label}
                    {column.sortable && (
                      <span className="inline-flex">
                        {sortBy === column.key ? (
                          sortDirection === "asc" ? (
                            <ChevronUp className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-primary" />
                          )
                        ) : (
                          <ChevronsUpDown className="h-3.5 w-3.5 opacity-30" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle bg-surface">
            {data.map((item) => {
              const key = keyExtractor(item);
              const isSelected = selectedKeys?.has(key);
              return (
                <tr
                  key={key}
                  className={cn(
                    "transition-colors duration-fast",
                    onRowClick && "cursor-pointer",
                    isSelected ? "bg-primary-soft" : "hover:bg-grey-50/80",
                  )}
                  onClick={() => onRowClick?.(item as T)}
                >
                  {onSelectChange && (
                    <td
                      className={cn("w-10 px-3", densityRowClasses[density])}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected || false}
                        onChange={() => handleSelect(key)}
                        className="border-default focus:ring-primary-ring h-4 w-4 rounded-sm accent-primary"
                      />
                    </td>
                  )}
                  {activeColumns.map((column) => (
                    <td
                      key={column.key}
                      className={cn("px-4 text-sm", densityRowClasses[density], column.className)}
                    >
                      {column.render
                        ? column.render(item as T)
                        : String((item as Record<string, unknown>)[column.key] ?? "")}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {page !== undefined && totalPages !== undefined && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-subtle px-4 py-3">
          <p className="text-sm text-tertiary">
            {total
              ? `${(page - 1) * perPage + 1}–${Math.min(page * perPage, total)} of ${total}`
              : `Page ${page} of ${totalPages}`}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
              aria-label="Previous page"
              className="border-default inline-flex h-8 w-8 items-center justify-center rounded-sm border text-secondary transition-colors duration-fast hover:bg-hover hover:text-primary disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {getPageNumbers(page, totalPages).map((value, index) =>
              value === "..." ? (
                <span key={`ellipsis-${index}`} className="px-2 text-xs text-tertiary">
                  ...
                </span>
              ) : (
                <button
                  key={value}
                  type="button"
                  onClick={() => onPageChange?.(value as number)}
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-sm text-sm font-medium transition-colors duration-fast",
                    value === page
                      ? "bg-primary text-inverse"
                      : "text-secondary hover:bg-hover hover:text-primary",
                  )}
                >
                  {value}
                </button>
              ),
            )}
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
              aria-label="Next page"
              className="border-default inline-flex h-8 w-8 items-center justify-center rounded-sm border text-secondary transition-colors duration-fast hover:bg-hover hover:text-primary disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function stripHtml(html: string): string {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = String(html);
  return div.textContent || div.innerText || "";
}

function renderNodeToString(node: ReactNode): string {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  return "";
}
