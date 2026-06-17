import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { searchService, type SearchResult } from "@/services/search";

export default function SearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult>({});
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const allItems = useCallback(() => {
    const items: Array<{ type: string; data: any }> = [];
    (results.tasks || []).forEach((t) => items.push({ type: "tasks", data: t }));
    (results.projects || []).forEach((p) => items.push({ type: "projects", data: p }));
    (results.users || []).forEach((u) => items.push({ type: "users", data: u }));
    return items;
  }, [results]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({});
      setLoading(false);
      return;
    }
    setLoading(true);
    setSelectedIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchService.global(query);
        setResults(data);
      } catch {
        setResults({});
      }
      setLoading(false);
    }, 250);
  }, [query]);

  const close = () => {
    setOpen(false);
    setQuery("");
    setResults({});
    setSelectedIndex(-1);
  };

  const navigateTo = (type: string, item: any) => {
    close();
    switch (type) {
      case "tasks":
        navigate(`/tasks/${item.id}`);
        break;
      case "projects":
        navigate(`/projects/${item.id}`);
        break;
      case "users":
        navigate(`/users/${item.id}`);
        break;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = allItems();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev >= items.length - 1 ? 0 : prev + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev <= 0 ? items.length - 1 : prev - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < items.length) {
        const { type, data } = items[selectedIndex];
        navigateTo(type, data);
      } else if (items.length > 0) {
        navigateTo(items[0].type, items[0].data);
      }
    } else if (e.key === "Escape") {
      close();
    }
  };

  const openSearch = useCallback(() => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openSearch();
      }
      if (e.key === "/" && !open && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        openSearch();
      }
    };
    const customHandler = () => openSearch();
    window.addEventListener("keydown", handler);
    window.addEventListener("opensearch", customHandler);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("opensearch", customHandler);
    };
  }, [open, openSearch]);

  if (!open) return null;

  const items = allItems();

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]" onClick={close}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl ring-1 ring-black/5 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center border-b px-4">
          <svg className="h-5 w-5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            className="flex-1 border-0 px-3 py-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
            placeholder="Search tasks, projects, users..."
          />
          <kbd className="hidden sm:inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium text-gray-500">ESC</kbd>
        </div>

        {query.length > 0 && (
          <div className="max-h-[60vh] overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <svg className="h-5 w-5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            )}

            {!loading && items.length === 0 && query.length > 0 && (
              <div className="px-4 py-12 text-center text-sm text-gray-500">No results found for "{query}"</div>
            )}

            {!loading && items.length > 0 && (
              <div>
                {results.tasks && results.tasks.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-50">Tasks</div>
                    {results.tasks.map((item, idx) => (
                      <div
                        key={`task-${item.id}`}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer ${selectedIndex === idx ? "bg-blue-50" : "hover:bg-gray-50"}`}
                        onClick={() => navigateTo("tasks", item)}
                      >
                        <svg className="h-5 w-5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                        </svg>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                        </div>
                        <span className="text-xs text-gray-500">{item.status}</span>
                      </div>
                    ))}
                  </div>
                )}

                {results.projects && results.projects.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-50">Projects</div>
                    {results.projects.map((item, idx) => {
                      const globalIdx = (results.tasks?.length || 0) + idx;
                      return (
                        <div
                          key={`project-${item.id}`}
                          className={`flex items-center gap-3 px-4 py-3 cursor-pointer ${selectedIndex === globalIdx ? "bg-blue-50" : "hover:bg-gray-50"}`}
                          onClick={() => navigateTo("projects", item)}
                        >
                          <svg className="h-5 w-5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                          </svg>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                          </div>
                          <span className="text-xs text-gray-500">{item.status}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {results.users && results.users.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-50">Users</div>
                    {results.users.map((item, idx) => {
                      const globalIdx = (results.tasks?.length || 0) + (results.projects?.length || 0) + idx;
                      return (
                        <div
                          key={`user-${item.id}`}
                          className={`flex items-center gap-3 px-4 py-3 cursor-pointer ${selectedIndex === globalIdx ? "bg-blue-50" : "hover:bg-gray-50"}`}
                          onClick={() => navigateTo("users", item)}
                        >
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600 shrink-0">
                            {item.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                            {item.job_title && <p className="text-xs text-gray-500">{item.job_title}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {query.length === 0 && (
          <div className="px-6 py-10 text-center">
            <svg className="mx-auto h-8 w-8 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <p className="text-sm text-gray-500">Search across tasks, projects, and users</p>
            <p className="mt-1 text-xs text-gray-400">Press <kbd className="rounded border px-1 font-medium">/</kbd> to search</p>
          </div>
        )}
      </div>
    </div>
  );
}
