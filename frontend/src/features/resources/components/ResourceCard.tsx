import { Badge, Card } from "@/design-system";
import { ResourceTypeIcon, resourceTypeLabel } from "./ResourceTypeIcon";
import { formatRelative, formatFileSize } from "@/utils/formatters";
import { MoreHorizontal, Download, History, Trash2, Pencil, ExternalLink } from "lucide-react";
import type { Resource } from "@/types/resources";
import { useState, useRef, useEffect } from "react";
import { useTrackDownload } from "../hooks/useResources";
import { resourceService } from "../services/resources";

interface ResourceCardProps {
  resource: Resource;
  onEdit?: (r: Resource) => void;
  onDelete?: (r: Resource) => void;
  onVersionHistory?: (r: Resource) => void;
  onClick?: (r: Resource) => void;
}

export function ResourceCard({
  resource,
  onEdit,
  onDelete,
  onVersionHistory,
  onClick,
}: ResourceCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const trackDownload = useTrackDownload();

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleDownload = () => {
    trackDownload.mutate(resource.id);
    const a = document.createElement("a");
    a.href = resourceService.getFileUrl(resource.id);
    a.download = resource.name;
    a.click();
  };

  const resourceTags: string[] = resource.tags ?? [];

  return (
    <Card
      className="group relative cursor-pointer p-4 transition-colors hover:bg-hover"
      onClick={() => onClick?.(resource)}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-subtle text-tertiary">
          <ResourceTypeIcon type={resource.resource_type} className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-primary">{resource.name}</p>
              <p className="mt-0.5 text-xs text-tertiary">
                {resourceTypeLabel(resource.resource_type)}
              </p>
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
                <div className="border-default absolute right-0 top-8 z-10 w-44 rounded-lg border bg-surface py-1 shadow-lg">
                  {onClick && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onClick(resource);
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-primary hover:bg-hover"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> View Details
                    </button>
                  )}
                  {resource.file_path && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload();
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-primary hover:bg-hover"
                    >
                      <Download className="h-3.5 w-3.5" /> Download
                    </button>
                  )}
                  {onVersionHistory && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onVersionHistory(resource);
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-primary hover:bg-hover"
                    >
                      <History className="h-3.5 w-3.5" /> Versions
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(resource);
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
                        onDelete(resource);
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
          {resource.description && (
            <p className="mt-1 line-clamp-2 text-xs text-secondary">{resource.description}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="neutral" size="sm">
              {resource.resource_type}
            </Badge>
            {resource.category && (
              <Badge variant="info" size="sm">
                {resource.category}
              </Badge>
            )}
            {resourceTags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="default" size="sm">
                {tag}
              </Badge>
            ))}
            {resourceTags.length > 2 && (
              <span className="text-xs text-tertiary">+{resourceTags.length - 2}</span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-tertiary">
            {resource.file_size && <span>{formatFileSize(resource.file_size)}</span>}
            {resource.current_version > 1 && <span>v{resource.current_version}</span>}
            {resource.link_count > 0 && (
              <span>
                {resource.link_count} link{resource.link_count !== 1 ? "s" : ""}
              </span>
            )}
            <span>{formatRelative(resource.updated_at)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
