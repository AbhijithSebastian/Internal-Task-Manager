import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { announcementsService } from "@/features/announcements/services/announcements";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoading } from "@/components/shared/LoadingSpinner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Pencil, Trash2, ArrowLeft } from "lucide-react";
import { formatDateTime } from "@/utils/formatters";
import { useAuth } from "@/store/auth";
import { useState } from "react";

export default function AnnouncementDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [showDelete, setShowDelete] = useState(false);

  const { data: announcement, isLoading } = useQuery({
    queryKey: ["announcement", id],
    queryFn: () => announcementsService.get(Number(id)),
    enabled: Boolean(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => announcementsService.delete(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      navigate("/announcements");
    },
  });

  if (isLoading) return <PageLoading />;
  if (!announcement) return <p>Announcement not found.</p>;

  return (
    <div>
      <PageHeader
        title={announcement.title}
        actions={
          <div className="flex gap-2">
            <Link to="/announcements" className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            {hasPermission("announcement-edit") && (
              <Link to={`/announcements/${announcement.id}/edit`} className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted">
                <Pencil className="h-4 w-4" /> Edit
              </Link>
            )}
            {hasPermission("announcement-delete") && (
              <button onClick={() => setShowDelete(true)} className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            )}
          </div>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border bg-card p-6">
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{announcement.content}</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6 h-fit">
          <h2 className="mb-4 text-lg font-semibold">Details</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${announcement.status === "published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {announcement.status}
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Priority</dt>
              <dd className="font-medium capitalize">{announcement.priority}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Author</dt>
              <dd>{announcement.author?.name || "N/A"}</dd>
            </div>
            {announcement.published_at && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Published</dt>
                <dd>{formatDateTime(announcement.published_at)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Created</dt>
              <dd>{formatDateTime(announcement.created_at)}</dd>
            </div>
          </dl>
        </div>
      </div>
      <ConfirmDialog
        open={showDelete}
        title="Delete Announcement"
        message="Are you sure? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
