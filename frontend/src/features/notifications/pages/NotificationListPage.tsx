import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

import { Skeleton } from "@/components/ui/Skeleton";
import { BellOff, CheckCheck } from "lucide-react";
import { formatRelative } from "@/utils/formatters";
import type { Notification } from "@/types";

export default function NotificationListPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", filter],
    queryFn: () => api.get("/notifications", { params: { unread_only: filter === "unread" || undefined } }).then((r) => r.data?.items || r.data?.data || []),
  });

  const notifications: Notification[] = Array.isArray(data) ? data : [];

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.post("/notifications/read-all"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const typeIcons: Record<string, string> = {
    task_assigned: "📋",
    task_completed: "✅",
    task_overdue: "⚠️",
    meeting_invite: "📅",
    announcement: "📢",
    comment: "💬",
    mention: "@",
    status_change: "🔄",
    approval_required: "✅",
    approval_approved: "✅",
    approval_rejected: "❌",
  };

  return (
    <div className="page-container py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary">Notifications</h1>
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="secondary" onClick={() => markAllReadMutation.mutate()} loading={markAllReadMutation.isPending}>
            <CheckCheck className="h-3.5 w-3.5" /> Mark All Read
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {(["all", "unread"] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              filter === s ? "bg-primary text-white" : "bg-subtle text-secondary hover:text-primary"
            }`}
          >{s === "all" ? "All" : "Unread"} {s === "unread" && unreadCount > 0 && `(${unreadCount})`}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rect" className="h-16 w-full rounded-lg" />)}</div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center bg-surface border border-default rounded-lg">
          <BellOff className="h-12 w-12 text-tertiary mb-3" />
          <h3 className="text-lg font-semibold text-primary">All caught up</h3>
          <p className="text-sm text-secondary mt-1">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((n) => (
            <Card
              key={n.id}
              variant={n.is_read ? "default" : "highlight"}
              className={`p-4 cursor-pointer transition-colors hover:bg-hover ${!n.is_read ? "border-l-2 border-l-primary" : ""}`}
              onClick={() => { if (!n.is_read) markReadMutation.mutate(n.id); }}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg shrink-0 mt-0.5">{typeIcons[n.type] || "📌"}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${n.is_read ? "text-secondary" : "text-primary font-medium"}`}>
                    {(n.data as Record<string, unknown>)?.message as string || "No message"}
                  </p>
                  {(n.data as Record<string, string>)?.task_title && <p className="text-xs text-tertiary mt-0.5 truncate">{(n.data as Record<string, string>).task_title}</p>}
                  <p className="text-xs text-tertiary mt-1">{formatRelative(n.created_at)}</p>
                </div>
                {!n.is_read && <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
