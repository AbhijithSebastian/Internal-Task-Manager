import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsService } from "@/features/notifications/services/notifications";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoading } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { Bell, CheckCheck } from "lucide-react";
import { formatRelative } from "@/utils/formatters";
import type { Notification } from "@/types";

export default function NotificationPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", page],
    queryFn: () => notificationsService.list({ page, per_page: 20 }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationsService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const getNotificationIcon = (type: string) => {
    if (type.includes("task")) return "📋";
    if (type.includes("project")) return "📁";
    if (type.includes("comment")) return "💬";
    if (type.includes("announcement")) return "📢";
    if (type.includes("meeting")) return "📅";
    return "🔔";
  };

  if (isLoading) return <PageLoading />;

  return (
    <div>
      <PageHeader
        title="Notifications"
        actions={
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" /> Mark All Read
          </button>
        }
      />
      {!data?.items?.length ? (
        <EmptyState
          icon={<Bell className="h-12 w-12" />}
          title="No notifications"
          description="You're all caught up!"
        />
      ) : (
        <div className="space-y-2">
          {data.items.map((notification: Notification) => (
            <div
              key={notification.id}
              className={`rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                !notification.read_at ? "border-l-4 border-l-primary bg-muted/20" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                <div className="flex-1">
                  <p className={`text-sm ${!notification.read_at ? "font-medium" : ""}`}>
                    {String(notification.data?.message || notification.type)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatRelative(notification.created_at)}
                  </p>
                </div>
                {!notification.read_at && (
                  <button
                    onClick={() => markReadMutation.mutate(Number(notification.id))}
                    className="text-xs text-primary hover:underline"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
          {data.total_pages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-md border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
              >
                Previous
              </button>
              <span className="flex items-center text-sm text-muted-foreground">
                Page {page} of {data.total_pages}
              </span>
              <button
                disabled={page >= data.total_pages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-md border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
