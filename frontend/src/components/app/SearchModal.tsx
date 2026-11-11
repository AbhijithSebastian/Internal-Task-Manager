import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { openDrawer } from "@/hooks/useDrawer";
import { cn } from "@/lib/utils";
import { Search, Command, User, FolderKanban, CheckSquare, Loader2, X } from "lucide-react";

interface GlobalSearchResult {
  id: number;
  type: "user" | "project" | "task";
  title: string;
  subtitle?: string;
  url?: string;
}

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setLoading(false);
      setSelectedIndex(-1);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setSelectedIndex(-1);
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get("/search", { params: { q: query, limit: 10 } });
        setResults(data || []);
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleClose = useCallback(() => {
    onClose();
    setQuery("");
    setResults([]);
    setSelectedIndex(-1);
  }, [onClose]);

  const handleSelect = useCallback(
    (item: GlobalSearchResult) => {
      handleClose();
      if (item.type === "user") {
        openDrawer("user", item.id);
      } else if (item.type === "task") {
        openDrawer("task", item.id);
      } else if (item.type === "project") {
        navigate(item.url || `/work/projects/${item.id}`);
      }
    },
    [handleClose, navigate],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev >= results.length - 1 ? 0 : prev + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex]);
      } else if (results.length > 0) {
        handleSelect(results[0]);
      }
    } else if (e.key === "Escape") {
      handleClose();
    }
  };

  const groupedResults = useMemo(() => {
    const groups: {
      type: string;
      label: string;
      items: GlobalSearchResult[];
      Icon: React.ComponentType<{ className?: string }>;
    }[] = [];
    const users = results.filter((r) => r.type === "user");
    const projects = results.filter((r) => r.type === "project");
    const tasks = results.filter((r) => r.type === "task");
    if (users.length) groups.push({ type: "user", label: "Users", items: users, Icon: User });
    if (projects.length)
      groups.push({ type: "project", label: "Projects", items: projects, Icon: FolderKanban });
    if (tasks.length)
      groups.push({ type: "task", label: "Tasks", items: tasks, Icon: CheckSquare });
    return groups;
  }, [results]);

  if (!open) return null;

  let flatIdx = 0;

  return (
    <div
      className="fixed inset-0 z-modal flex items-start justify-center pt-[12vh]"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <div
        className="bg-black/40 fixed inset-0 z-modal-bg backdrop-blur-sm"
        aria-label="Close search"
      />
      <div
        className="border-default relative z-modal w-full max-w-2xl animate-scale-in overflow-hidden rounded-xl border bg-surface shadow-modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="border-default flex items-center gap-3 border-b px-4">
          <Search className="h-5 w-5 shrink-0 text-tertiary" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 border-0 bg-transparent py-4 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-0"
            placeholder="Search tasks, projects, users..."
            aria-label="Search tasks, projects, and users"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="rounded p-1 text-tertiary transition-colors duration-fast hover:bg-hover hover:text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="border-default hidden items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs text-tertiary sm:inline-flex">
            <Command className="h-3 w-3" />
            <span>K</span>
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-tertiary" />
            </div>
          )}

          {!loading && query.trim() && results.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-tertiary">
              No results found for "<span className="font-medium text-primary">{query}</span>"
            </div>
          )}

          {!loading && query.trim() === "" && (
            <div className="px-6 py-10 text-center">
              <Search className="mx-auto mb-3 h-8 w-8 text-tertiary" />
              <p className="text-sm text-tertiary">Search across tasks, projects, and users</p>
              <p className="text-tertiary/60 mt-1 text-xs">
                Press{" "}
                <kbd className="rounded border border-subtle px-1 font-medium text-secondary">
                  /
                </kbd>{" "}
                to search
              </p>
            </div>
          )}

          {!loading &&
            groupedResults.map((group) => (
              <div key={group.type}>
                <div className="bg-subtle px-4 py-2 text-xs font-semibold uppercase tracking-wider text-tertiary">
                  {group.label}
                </div>
                {group.items.map((item) => {
                  const idx = flatIdx++;
                  return (
                    <button
                      key={`${item.type}-${item.id}`}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-fast",
                        idx === selectedIndex ? "bg-hover" : "hover:bg-hover",
                      )}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
                        <group.Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-primary">{item.title}</p>
                        {item.subtitle && (
                          <p className="truncate text-xs text-tertiary">{item.subtitle}</p>
                        )}
                      </div>
                      <span className="text-xs capitalize text-tertiary">{item.type}</span>
                    </button>
                  );
                })}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
