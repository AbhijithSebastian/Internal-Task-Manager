import { useState, useCallback, useMemo, type ReactNode } from "react";
import {
  ChevronUp, ChevronDown, ChevronsUpDown,
  ChevronLeft, ChevronRight, Download, Columns3,
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
  const [visibleColumns, setVisibleColumns] = useState<string[]>(columns.map((c) => c.key));

  const activeColumns = useMemo(
    () => columns.filter((c) => visibleColumns.includes(c.key) && !c.hidden),
    [columns, visibleColumns]
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
    [onSelectChange, selectedKeys]
  );

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const exportCSV = () => {
    const headers = activeColumns.map((c) => c.label).join(",");
    const rows = data.map((item) =>
      activeColumns
        .map((col) => {
          const val = col.render
            ? stripHtml(renderNodeToString(col.render(item)))
            : String((item as Record<string, unknown>)[col.key] ?? "");
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(",")
    );
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFilename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="bg-surface border border-default shadow-card rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-subtle bg-subtle">
          <div className="flex gap-4">
            {onSelectChange && <div className="w-10 shrink-0" />}
            {activeColumns.map((col) => (
              <div key={col.key} className="h-4 bg-subtle skeleton-pulse rounded" style={{ flex: col.width ? `0 0 ${col.width}` : "1 1 0" }} />
            ))}
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-4 py-3 border-b border-subtle last:border-0">
            <div className="flex gap-4 items-center">
              {onSelectChange && <div className="w-10 shrink-0 flex justify-center"><div className="h-4 w-4 bg-subtle skeleton-pulse rounded" /></div>}
              {activeColumns.map((col) => (
                <div key={col.key} className="h-3 bg-subtle skeleton-pulse rounded" style={{ flex: col.width ? `0 0 ${col.width}` : "1 1 0" }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-surface border border-default shadow-card rounded-lg">
        {emptyState || (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="h-12 w-12 rounded-full bg-subtle flex items-center justify-center mb-4">
              <ChevronsUpDown className="h-6 w-6 text-tertiary" />
            </div>
            <h3 className="text-sm font-semibold text-primary mb-1">No data found</h3>
            <p className="text-sm text-tertiary">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-surface border border-default shadow-card rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-subtle bg-subtle/50">
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
            onClick={() => setDensity(density === "comfortable" ? "compact" : "comfortable")}
            className="p-1.5 rounded text-tertiary hover:text-primary hover:bg-hover transition-colors"
            title={`Switch to ${density === "comfortable" ? "compact" : "comfortable"} view`}
          >
            <Columns3 className="h-3.5 w-3.5" />
          </button>
          {exportable && (
            <button
              onClick={exportCSV}
              className="p-1.5 rounded text-tertiary hover:text-primary hover:bg-hover transition-colors"
              title="Export CSV"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          )}
          {columns.filter((c) => !c.hidden).length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                className="p-1.5 rounded text-tertiary hover:text-primary hover:bg-hover transition-colors"
                title="Columns"
              >
                <Columns3 className="h-3.5 w-3.5" />
              </button>
              {showColumnMenu && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-surface border border-default rounded-lg shadow-dropdown z-dropdown py-1">
                  {columns.filter((c) => !c.hidden).map((col) => (
                    <label key={col.key} className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary hover:bg-hover cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibleColumns.includes(col.key)}
                        onChange={() => toggleColumn(col.key)}
                        className="h-3.5 w-3.5 rounded border-default text-primary"
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-subtle bg-subtle">
              {onSelectChange && (
                <th className={cn("w-10 px-3 text-left", densityRowClasses[density])}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-default text-primary focus:ring-primary-ring"
                  />
                </th>
              )}
              {activeColumns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 text-left text-xs font-medium uppercase tracking-wide text-secondary",
                    col.sortable && "cursor-pointer select-none hover:text-primary",
                    densityRowClasses[density],
                    col.className
                  )}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && (
                      <span className="inline-flex">
                        {sortBy === col.key ? (
                          sortDirection === "asc" ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
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
          <tbody className="divide-y divide-subtle">
            {data.map((item) => {
              const key = keyExtractor(item);
              const isSelected = selectedKeys?.has(key);
              return (
                <tr
                  key={key}
                  className={cn(
                    "transition-colors duration-fast",
                    onRowClick && "cursor-pointer",
                    isSelected ? "bg-primary-soft" : "hover:bg-hover"
                  )}
                  onClick={() => onRowClick?.(item as T)}
                >
                  {onSelectChange && (
                    <td className={cn("w-10 px-3", densityRowClasses[density])} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected || false}
                        onChange={() => handleSelect(key)}
                        className="h-4 w-4 rounded border-default text-primary focus:ring-primary-ring"
                      />
                    </td>
                  )}
                  {activeColumns.map((col) => (
                    <td key={col.key} className={cn("px-4 text-sm", densityRowClasses[density], col.className)}>
                      {col.render ? col.render(item as T) : String((item as Record<string, unknown>)[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {page !== undefined && totalPages !== undefined && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-subtle">
          <p className="text-sm text-tertiary">
            {total ? `${(page - 1) * perPage + 1}–${Math.min(page * perPage, total)} of ${total}` : `Page ${page} of ${totalPages}`}
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-default text-secondary hover:bg-hover hover:text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors duration-fast"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {getPageNumbers(page, totalPages).map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="px-2 text-xs text-tertiary">...</span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange?.(p as number)}
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors duration-fast",
                    p === page
                      ? "bg-primary text-inverse"
                      : "text-secondary hover:bg-hover hover:text-primary"
                  )}
                >
                  {p}
                </button>
              )
            )}
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-default text-secondary hover:bg-hover hover:text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors duration-fast"
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
