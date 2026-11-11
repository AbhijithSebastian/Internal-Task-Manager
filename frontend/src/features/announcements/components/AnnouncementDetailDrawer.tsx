import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { announcementsService } from "@/features/announcements/services/announcements";
import { useAuth } from "@/store/auth";
import { Avatar, Badge, Button, Drawer, Skeleton } from "@/design-system";
import { formatDateTime, formatRelative } from "@/utils/formatters";
import { Megaphone, Pin, PinOff, Calendar, Edit3, Trash2, Target } from "lucide-react";
import type { Announcement } from "@/types";
import { useState } from "react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

interface AnnouncementDetailDrawerProps {
  announcementId: number | null;
  onClose: () => void;
}

export function AnnouncementDetailDrawer({
  announcementId,
  onClose,
}: AnnouncementDetailDrawerProps) {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [showDelete, setShowDelete] = useState(false);

  const { data: announcement, isLoading } = useQuery({
    queryKey: ["announcement", announcementId],
    queryFn: () => announcementsService.get(Number(announcementId)),
    enabled: Boolean(announcementId),
  });

  const a = announcement as Announcement | undefined;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["announcements"] });
    queryClient.invalidateQueries({ queryKey: ["announcement", announcementId] });
  };

  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      announcementsService.changeStatus(id, status),
    onSuccess: invalidate,
  });

  const togglePinMutation = useMutation({
    mutationFn: () =>
      api.patch(`/announcements/${a?.id}/pin`, {
        is_pinned: !(a as unknown as Record<string, unknown>).is_pinned,
      }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => announcementsService.delete(id),
    onSuccess: () => {
      setShowDelete(false);
      invalidate();
      onClose();
    },
  });

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case "published":
        return "success";
      case "scheduled":
        return "info";
      case "draft":
        return "warning";
      case "archived":
        return "neutral";
      default:
        return "default";
    }
  };

  const priorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "urgent":
      case "high":
        return "danger";
      case "low":
        return "neutral";
      default:
        return "info";
    }
  };

  const showTransitionButton = (toStatus: string) => {
    if (!a) return null;
    const transitions: Record<
      string,
      { label: string; variant: "primary" | "secondary" | "ghost" | "danger" }
    > = {
      published: { label: "Publish", variant: "primary" },
      draft: { label: "Move to Draft", variant: "secondary" },
      archived: { label: "Archive", variant: "secondary" },
    };
    const t = transitions[toStatus];
    if (!t) return null;
    if (a.status === toStatus) return null;
    if (a.status === "archived" && toStatus !== "draft") return null;
    return (
      <Button
        key={toStatus}
        size="sm"
        variant={t.variant}
        onClick={() => changeStatusMutation.mutate({ id: a.id, status: toStatus })}
        loading={changeStatusMutation.isPending}
        className="flex-1"
      >
        {t.label}
      </Button>
    );
  };

  return (
    <Drawer open={Boolean(announcementId)} onClose={onClose} title={a?.title || "Announcement"}>
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton variant="rect" className="h-6 w-3/4" />
          <Skeleton variant="rect" className="h-4 w-1/3" />
          <Skeleton variant="rect" className="h-64 w-full" />
        </div>
      ) : !a ? (
        <div className="flex flex-col items-center py-12 text-center">
          <Megaphone className="mb-3 h-12 w-12 text-tertiary" />
          <p className="text-sm text-secondary">Announcement not found</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <Megaphone className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusBadgeVariant(a.status)} size="sm" dot>
                    {a.status}
                  </Badge>
                  {a.priority && (
                    <Badge variant={priorityBadgeVariant(a.priority)} size="sm">
                      {a.priority}
                    </Badge>
                  )}
                  {Boolean((a as unknown as Record<string, unknown>).is_pinned) && (
                    <Pin className="h-3.5 w-3.5 text-semantic-warning" />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-tertiary">
            {a.author && (
              <>
                <Avatar name={a.author.name} size="sm" />
                <span>{a.author.name}</span>
              </>
            )}
            {a.published_at && (
              <>
                <span className="text-tertiary">·</span>
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDateTime(a.published_at)}</span>
              </>
            )}
          </div>

          <div className="rounded-lg bg-subtle p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-primary">{a.content}</p>
          </div>

          {(a.target_type || a.target_id) && (
            <div className="flex items-center gap-2 text-sm text-secondary">
              <Target className="h-3.5 w-3.5 text-tertiary" />
              <span>
                Target: {a.target_type || "—"} {a.target_id ? `#${a.target_id}` : ""}
              </span>
            </div>
          )}

          {hasPermission("announcement-edit") && (
            <div className="flex items-center gap-2 pt-2">
              {showTransitionButton("published")}
              {showTransitionButton("draft")}
              {showTransitionButton("archived")}
            </div>
          )}

          {hasPermission("announcement-edit") && (
            <div className="flex items-center gap-2 border-t border-subtle pt-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  onClose();
                  navigate(`/work/announcements/${a.id}/edit`);
                }}
              >
                <Edit3 className="h-3.5 w-3.5" /> Edit
              </Button>
              <Button
                size="sm"
                variant={(a as unknown as Record<string, unknown>).is_pinned ? "primary" : "ghost"}
                onClick={() => togglePinMutation.mutate()}
                loading={togglePinMutation.isPending}
              >
                {(a as unknown as Record<string, unknown>).is_pinned ? (
                  <>
                    <PinOff className="h-3.5 w-3.5" /> Unpin
                  </>
                ) : (
                  <>
                    <Pin className="h-3.5 w-3.5" /> Pin
                  </>
                )}
              </Button>
              {hasPermission("announcement-delete") && (
                <Button size="sm" variant="danger" onClick={() => setShowDelete(true)}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              )}
            </div>
          )}

          <div className="space-y-1 border-t border-subtle pt-2 text-xs text-tertiary">
            <p>ID: #{a.id}</p>
            <p>Created: {formatRelative(a.created_at)}</p>
            {a.updated_at && <p>Updated: {formatRelative(a.updated_at)}</p>}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showDelete}
        title="Delete Announcement"
        message={`Are you sure you want to delete "${a?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => a && deleteMutation.mutate(a.id)}
        onCancel={() => setShowDelete(false)}
      />
    </Drawer>
  );
}
