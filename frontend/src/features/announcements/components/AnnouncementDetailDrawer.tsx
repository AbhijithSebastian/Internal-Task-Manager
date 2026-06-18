import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Drawer } from "@/components/ui/Drawer";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatRelative } from "@/utils/formatters";
import { Megaphone, Calendar } from "lucide-react";
import type { Announcement } from "@/types";

interface AnnouncementDetailDrawerProps {
  announcementId: number | null;
  onClose: () => void;
}

export function AnnouncementDetailDrawer({ announcementId, onClose }: AnnouncementDetailDrawerProps) {
  const { data: announcement, isLoading } = useQuery({
    queryKey: ["announcement", announcementId],
    queryFn: () => api.get(`/announcements/${announcementId}`).then((r) => r.data?.data || r.data),
    enabled: Boolean(announcementId),
  });

  const a = announcement as Announcement | undefined;

  return (
    <Drawer open={Boolean(announcementId)} onClose={onClose} title={a?.title || "Announcement"}>
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton variant="rect" className="h-6 w-3/4" />
          <Skeleton variant="rect" className="h-4 w-1/3" />
          <Skeleton variant="rect" className="h-64 w-full" />
        </div>
      ) : !a ? (
        <div className="flex flex-col items-center py-12 text-center">
          <Megaphone className="h-12 w-12 text-tertiary mb-3" />
          <p className="text-sm text-secondary">Announcement not found</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant={a.status === "published" ? "success" : "warning"} size="sm" dot>{a.status}</Badge>
                {a.priority && <Badge variant={a.priority === "high" || a.priority === "urgent" ? "danger" : "neutral"} size="sm">{a.priority}</Badge>}
              </div>
            </div>
          </div>

          <div className="prose prose-sm max-w-none text-secondary whitespace-pre-wrap leading-relaxed">
            {a.content}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-subtle text-xs text-tertiary">
            <div className="flex items-center gap-2">
              {a.author && <><Avatar name={a.author.name} size="sm" /><span>{a.author.name}</span></>}
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>{a.published_at ? formatRelative(a.published_at) : formatRelative(a.created_at)}</span>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}
