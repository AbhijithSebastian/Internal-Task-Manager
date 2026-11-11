import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { queryKeys } from "@/services/queryKeys";
import { Avatar } from "@/design-system";
import { Search } from "lucide-react";
import type { UserBrief } from "@/types";

interface Props {
  onSelect: (user: UserBrief) => void;
  excludeIds?: number[];
  placeholder?: string;
}

export function UserSearchPopover({
  onSelect,
  excludeIds = [],
  placeholder = "Search users...",
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: results, isLoading } = useQuery({
    queryKey: queryKeys.users.searchDetail(query),
    queryFn: () =>
      api.get("/users/search", { params: { q: query } }).then((r) => r.data?.data || r.data || []),
    enabled: query.length >= 1,
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered: UserBrief[] = (results || []).filter(
    (u: UserBrief) => !excludeIds.includes(u.id),
  );

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-tertiary" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="border-default focus:ring-primary-ring h-8 w-full rounded-md border bg-surface pl-8 pr-3 text-sm text-primary placeholder:text-tertiary focus:border-primary focus:outline-none focus:ring-2"
        />
      </div>
      {open && query.length >= 1 && (
        <div className="border-default absolute left-0 right-0 top-full z-dropdown mt-1 max-h-48 overflow-y-auto rounded-lg border bg-surface shadow-elevated">
          {isLoading ? (
            <div className="p-3 text-center text-sm text-tertiary">Searching...</div>
          ) : filtered.length === 0 ? (
            <div className="p-3 text-center text-sm text-tertiary">No users found</div>
          ) : (
            filtered.map((user) => (
              <button
                key={user.id}
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-primary transition-colors hover:bg-hover"
                onClick={() => {
                  onSelect(user);
                  setQuery("");
                  setOpen(false);
                }}
              >
                <Avatar name={user.name} size="sm" />
                <span className="truncate">{user.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
