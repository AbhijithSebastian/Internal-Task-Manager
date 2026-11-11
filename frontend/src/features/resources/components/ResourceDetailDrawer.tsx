import { Badge, Button, Drawer, Skeleton } from "@/design-system";
import { ResourceTypeIcon, resourceTypeLabel } from "./ResourceTypeIcon";
import { ResourcePreview } from "./ResourcePreview";
import { ResourceVersionHistory } from "./ResourceVersionHistory";
import { ResourceLinkedItems } from "./ResourceLinkedItems";
import { formatDate, formatRelative, formatFileSize } from "@/utils/formatters";
import { useResource, useTrackDownload, useResourceActivity } from "../hooks/useResources";
import { resourceService } from "../services/resources";
import { Download, ExternalLink, Tag } from "lucide-react";
import { useState } from "react";
import type { Resource } from "@/types/resources";

interface ResourceDetailDrawerProps {
  resourceId: number | null;
  onClose: () => void;
  onEdit?: (r: Resource) => void;
  onDelete?: (r: Resource) => void;
}

type Tab = "preview" | "versions" | "links" | "activity";

export function ResourceDetailDrawer({
  resourceId,
  onClose,
  onEdit,
  onDelete,
}: ResourceDetailDrawerProps) {
  const { data: resource, isLoading } = useResource(resourceId);
  const trackDownload = useTrackDownload();
  const [tab, setTab] = useState<Tab>("preview");

  if (!resourceId) return null;

  const r = resource as Resource | undefined;
  const tags: string[] = r?.tags ?? [];

  const handleDownload = () => {
    if (!r) return;
    trackDownload.mutate(r.id);
    const a = document.createElement("a");
    a.href = resourceService.getFileUrl(r.id);
    a.download = r.name;
    a.click();
  };

  return (
    <Drawer open={Boolean(resourceId)} onClose={onClose} title={r?.name || "Resource"}>
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton variant="rect" className="h-6 w-48" />
          <Skeleton variant="rect" className="h-40 w-full" />
          <Skeleton variant="rect" className="h-20 w-full" />
          <Skeleton variant="rect" className="h-20 w-full" />
        </div>
      ) : !r ? (
        <p className="text-sm text-secondary">Resource not found</p>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <ResourceTypeIcon type={r.resource_type} className="h-5 w-5 text-tertiary" />
            <Badge variant="neutral" size="sm">
              {resourceTypeLabel(r.resource_type)}
            </Badge>
            {r.category && (
              <Badge variant="info" size="sm">
                {r.category}
              </Badge>
            )}
            {r.current_version > 1 && (
              <Badge variant="default" size="sm">
                v{r.current_version}
              </Badge>
            )}
          </div>

          {r.description && (
            <p className="whitespace-pre-wrap text-sm text-secondary">{r.description}</p>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-tertiary" />
              {tags.map((tag) => (
                <Badge key={tag} variant="default" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            {r.file_path && (
              <Button size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" /> Download{" "}
                {r.file_size ? `(${formatFileSize(r.file_size)})` : ""}
              </Button>
            )}
            {r.url && (
              <a href={r.url} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm">
                  <ExternalLink className="h-4 w-4" /> Open URL
                </Button>
              </a>
            )}
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(r)}>
                Edit
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="sm" onClick={() => onDelete(r)}>
                Delete
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-tertiary">Type</span>
              <p className="text-primary">{r.resource_type}</p>
            </div>
            <div>
              <span className="text-tertiary">Category</span>
              <p className="text-primary">{r.category || "-"}</p>
            </div>
            {r.file_size && (
              <div>
                <span className="text-tertiary">Size</span>
                <p className="text-primary">{formatFileSize(r.file_size)}</p>
              </div>
            )}
            {r.mime_type && (
              <div>
                <span className="text-tertiary">MIME</span>
                <p className="truncate text-primary">{r.mime_type}</p>
              </div>
            )}
            {r.uploader && (
              <div>
                <span className="text-tertiary">Uploaded by</span>
                <p className="text-primary">{r.uploader.name}</p>
              </div>
            )}
            <div>
              <span className="text-tertiary">Created</span>
              <p className="text-primary">{formatDate(r.created_at)}</p>
            </div>
            <div>
              <span className="text-tertiary">Updated</span>
              <p className="text-primary">{formatRelative(r.updated_at)}</p>
            </div>
          </div>

          <div className="border-t border-subtle pt-4">
            <div className="mb-4 flex gap-4 border-b border-subtle">
              {(["preview", "versions", "links", "activity"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`border-b-2 pb-2 text-sm font-medium transition-colors ${
                    tab === t
                      ? "border-primary text-primary"
                      : "border-transparent text-tertiary hover:text-secondary"
                  }`}
                >
                  {t === "preview"
                    ? "Preview"
                    : t === "versions"
                      ? `Versions (${r.current_version})`
                      : t === "links"
                        ? `Links (${r.link_count})`
                        : "Activity"}
                </button>
              ))}
            </div>
            {tab === "preview" && <ResourcePreview resource={r} className="h-64" />}
            {tab === "versions" && <ResourceVersionHistory resourceId={r.id} />}
            {tab === "links" && <ResourceLinkedItems resourceId={r.id} />}
            {tab === "activity" && <ResourceActivityPanel resourceId={r.id} />}
          </div>
        </div>
      )}
    </Drawer>
  );
}

function ResourceActivityPanel({ resourceId }: { resourceId: number }) {
  const { data: activityData, isLoading: activityLoading } = useResourceActivity(resourceId) as {
    data?: {
      activities: Array<{
        id: number;
        action: string;
        user?: { name: string };
        created_at: string;
      }>;
    };
    isLoading: boolean;
  };

  if (activityLoading) return <Skeleton variant="rect" className="h-20 w-full" />;
  const activities = activityData?.activities ?? [];
  if (activities.length === 0)
    return <p className="text-sm text-tertiary">No activity recorded yet.</p>;

  return (
    <div className="space-y-2">
      {activities.map((a) => (
        <div
          key={a.id}
          className="flex items-center justify-between border-b border-subtle py-2 last:border-0"
        >
          <div className="flex items-center gap-2">
            <Badge variant="neutral" size="sm">
              {a.action}
            </Badge>
            {a.user && <span className="text-xs text-secondary">{a.user.name}</span>}
          </div>
          <span className="text-xs text-tertiary">{formatRelative(a.created_at)}</span>
        </div>
      ))}
    </div>
  );
}
