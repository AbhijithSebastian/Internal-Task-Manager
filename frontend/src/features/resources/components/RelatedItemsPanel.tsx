import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { openDrawer } from "@/hooks/useDrawer";
import { Skeleton } from "@/design-system";
import { File, ExternalLink } from "lucide-react";

interface RelatedItemsPanelProps {
  projectId: number;
  linkedType: string;
  linkedId: number;
  title?: string;
}

export function RelatedItemsPanel({
  projectId,
  linkedType,
  linkedId,
  title,
}: RelatedItemsPanelProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["related-resources", projectId, linkedType, linkedId],
    queryFn: () =>
      api
        .get("/resources", {
          params: {
            project_id: projectId,
            linked_to: linkedType,
            linked_id: linkedId,
            per_page: 10,
          },
        })
        .then((r) => r.data?.items ?? []),
    enabled: !!projectId && !!linkedType && !!linkedId,
  });

  const resources = data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton variant="rect" className="h-8 w-full" />
        <Skeleton variant="rect" className="h-8 w-full" />
      </div>
    );
  }

  if (resources.length === 0) return null;

  return (
    <div className="border-t border-subtle pt-4">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-tertiary">
        {title || "Related Resources"} ({resources.length})
      </h4>
      <div className="space-y-1">
        {resources.map((r: Record<string, unknown>) => (
          <button
            key={r.id as number}
            onClick={() => openDrawer("resource", r.id as number)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-secondary transition-colors hover:bg-hover hover:text-primary"
          >
            <File className="h-3.5 w-3.5 shrink-0 text-tertiary" />
            <span className="flex-1 truncate">{r.name as string}</span>
            <span className="shrink-0 text-xs text-tertiary">{r.resource_type as string}</span>
            <ExternalLink className="h-3 w-3 shrink-0 text-tertiary" />
          </button>
        ))}
      </div>
    </div>
  );
}
