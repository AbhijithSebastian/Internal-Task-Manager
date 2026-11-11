import { Badge, Card } from "@/design-system";
import { HttpMethodBadge } from "./HttpMethodBadge";
import { EndpointStatusBadge } from "./EndpointStatusBadge";
import { formatRelative } from "@/utils/formatters";
import { MoreHorizontal, Pencil, Trash2, ExternalLink } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { Endpoint } from "@/types/endpoints";

interface EndpointCardProps {
  endpoint: Endpoint;
  onEdit?: (e: Endpoint) => void;
  onDelete?: (e: Endpoint) => void;
  onClick?: (e: Endpoint) => void;
}

export function EndpointCard({ endpoint, onEdit, onDelete, onClick }: EndpointCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <Card
      className="group relative cursor-pointer p-4 transition-colors hover:bg-hover"
      onClick={() => onClick?.(endpoint)}
    >
      <div className="flex items-start gap-3">
        <HttpMethodBadge method={endpoint.method} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-primary">{endpoint.name}</p>
              <p className="mt-0.5 truncate font-mono text-xs text-tertiary">{endpoint.url}</p>
            </div>
            <div className="relative shrink-0" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="rounded-md p-1 text-secondary opacity-0 transition-opacity hover:bg-hover hover:text-primary group-hover:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {menuOpen && (
                <div className="border-default absolute right-0 top-8 z-10 w-40 rounded-lg border bg-surface py-1 shadow-lg">
                  {onClick && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onClick(endpoint);
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-primary hover:bg-hover"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> View
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(endpoint);
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-primary hover:bg-hover"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(endpoint);
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-semantic-danger hover:bg-hover"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          {endpoint.description && (
            <p className="mt-1 line-clamp-1 text-xs text-secondary">{endpoint.description}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <EndpointStatusBadge status={endpoint.status} />
            {endpoint.owner && <span className="text-xs text-tertiary">{endpoint.owner.name}</span>}
            <span className="text-xs text-tertiary">v{endpoint.version}</span>
            {endpoint.reference_count > 0 && (
              <span className="text-xs text-tertiary">
                {endpoint.reference_count} ref{endpoint.reference_count !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {endpoint.tags?.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="default" size="sm">
                {tag}
              </Badge>
            ))}
            {(endpoint.tags?.length ?? 0) > 3 && (
              <span className="text-xs text-tertiary">+{endpoint.tags!.length - 3}</span>
            )}
          </div>
          <p className="mt-1 text-xs text-tertiary">{formatRelative(endpoint.updated_at)}</p>
        </div>
      </div>
    </Card>
  );
}
