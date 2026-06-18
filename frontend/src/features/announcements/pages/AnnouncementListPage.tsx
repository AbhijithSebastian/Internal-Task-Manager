import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useAuth } from "@/store/auth";
import { openDrawer } from "@/hooks/useDrawer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { Plus, Megaphone, Edit3, Trash2, Eye } from "lucide-react";
import { formatDate, formatRelative } from "@/utils/formatters";
import type { Announcement } from "@/types";

export default function AnnouncementListPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["announcements", filter],
    queryFn: () => api.get("/announcements", { params: { status: filter || undefined } }).then((r) => r.data?.items || r.data?.data || []),
  });

  const anns: Announcement[] = Array.isArray(data) ? data : [];

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/announcements/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["announcements"] }),
  });

  const publishMutation = useMutation({
    mutationFn: (id: number) => api.post(`/announcements/${id}/publish`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["announcements"] }),
  });

  return (
    <div className="page-container py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary">Announcements</h1>
        </div>
        {hasPermission("announcement-create") && (
          <Button onClick={() => navigate("/work/announcements/new")}>
            <Plus className="h-4 w-4" /> New Announcement
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rect" className="h-28 w-full rounded-lg" />)}</div>
      ) : anns.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center bg-surface border border-default rounded-lg">
          <Megaphone className="h-12 w-12 text-tertiary mb-3" />
          <h3 className="text-lg font-semibold text-primary">No announcements</h3>
          <p className="text-sm text-secondary mt-1 mb-4">Create your first announcement.</p>
          {hasPermission("announcement-create") && (
            <Button onClick={() => navigate("/work/announcements/new")}><Plus className="h-4 w-4" /> New Announcement</Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {["", "draft", "published"].map((s) => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  filter === s ? "bg-primary text-white" : "bg-subtle text-secondary hover:text-primary"
                }`}
              >{s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}</button>
            ))}
          </div>
          {anns.map((a) => (
            <Card key={a.id} variant="interactive" onClick={() => openDrawer("announcement", a.id)}>
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                      <Megaphone className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-primary truncate">{a.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant={a.status === "published" ? "success" : "warning"} size="sm" dot>{a.status}</Badge>
                        {a.priority && <Badge variant={a.priority === "high" ? "danger" : "neutral"} size="sm">{a.priority}</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {a.status === "draft" && hasPermission("announcement-edit") && (
                      <button onClick={(e) => { e.stopPropagation(); publishMutation.mutate(a.id); }}
                        className="p-1.5 rounded text-tertiary hover:text-primary hover:bg-hover transition-colors" title="Publish">
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    {hasPermission("announcement-edit") && (
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/work/announcements/${a.id}/edit`); }}
                        className="p-1.5 rounded text-tertiary hover:text-primary hover:bg-hover transition-colors" title="Edit">
                        <Edit3 className="h-4 w-4" />
                      </button>
                    )}
                    {hasPermission("announcement-delete") && (
                      <button onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(a.id); }}
                        className="p-1.5 rounded text-tertiary hover:text-danger hover:bg-danger-soft transition-colors" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-secondary line-clamp-2">{a.content}</p>
                <div className="flex items-center justify-between text-xs text-tertiary">
                  <div className="flex items-center gap-2">
                    {a.author && <><Avatar name={a.author.name} size="sm" /><span>{a.author.name}</span></>}
                  </div>
                  <span>{a.published_at ? formatDate(a.published_at) : formatRelative(a.created_at)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
