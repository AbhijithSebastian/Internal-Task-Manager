import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
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

export function ResourceCard({ resource, onEdit, onDelete, onVersionHistory, onClick }: ResourceCardProps) {
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
    <Card className="group relative p-4 hover:bg-hover transition-colors cursor-pointer" onClick={() => onClick?.(resource)}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-lg bg-subtle flex items-center justify-center text-tertiary">
          <ResourceTypeIcon type={resource.resource_type} className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-primary truncate">{resource.name}</p>
              <p className="text-xs text-tertiary mt-0.5">{resourceTypeLabel(resource.resource_type)}</p>
            </div>
            <div className="relative shrink-0" ref={menuRef}>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                className="p-1 rounded-md text-secondary hover:bg-hover hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-8 z-10 w-44 rounded-lg bg-surface border border-default shadow-lg py-1">
                  {onClick && (
                    <button onClick={(e) => { e.stopPropagation(); onClick(resource); setMenuOpen(false); }} className="w-full px-3 py-1.5 text-left text-sm text-primary hover:bg-hover flex items-center gap-2">
                      <ExternalLink className="h-3.5 w-3.5" /> View Details
                    </button>
                  )}
                  {resource.file_path && (
                    <button onClick={(e) => { e.stopPropagation(); handleDownload(); setMenuOpen(false); }} className="w-full px-3 py-1.5 text-left text-sm text-primary hover:bg-hover flex items-center gap-2">
                      <Download className="h-3.5 w-3.5" /> Download
                    </button>
                  )}
                  {onVersionHistory && (
                    <button onClick={(e) => { e.stopPropagation(); onVersionHistory(resource); setMenuOpen(false); }} className="w-full px-3 py-1.5 text-left text-sm text-primary hover:bg-hover flex items-center gap-2">
                      <History className="h-3.5 w-3.5" /> Versions
                    </button>
                  )}
                  {onEdit && (
                    <button onClick={(e) => { e.stopPropagation(); onEdit(resource); setMenuOpen(false); }} className="w-full px-3 py-1.5 text-left text-sm text-primary hover:bg-hover flex items-center gap-2">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                  )}
                  {onDelete && (
                    <button onClick={(e) => { e.stopPropagation(); onDelete(resource); setMenuOpen(false); }} className="w-full px-3 py-1.5 text-left text-sm text-semantic-danger hover:bg-hover flex items-center gap-2">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          {resource.description && (
            <p className="text-xs text-secondary mt-1 line-clamp-2">{resource.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="neutral" size="sm">{resource.resource_type}</Badge>
            {resource.category && <Badge variant="info" size="sm">{resource.category}</Badge>}
            {resourceTags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="default" size="sm">{tag}</Badge>
            ))}
            {resourceTags.length > 2 && (
              <span className="text-xs text-tertiary">+{resourceTags.length - 2}</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-tertiary">
            {resource.file_size && <span>{formatFileSize(resource.file_size)}</span>}
            {resource.current_version > 1 && <span>v{resource.current_version}</span>}
            {resource.link_count > 0 && <span>{resource.link_count} link{resource.link_count !== 1 ? "s" : ""}</span>}
            <span>{formatRelative(resource.updated_at)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
