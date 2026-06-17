import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { meetingsService } from "@/features/meetings/services/meetings";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoading } from "@/components/shared/LoadingSpinner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Pencil, Trash2, ArrowLeft } from "lucide-react";
import { formatDate, formatDateTime } from "@/utils/formatters";
import { useAuth } from "@/store/auth";
import { useState } from "react";

export default function MeetingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [showDelete, setShowDelete] = useState(false);

  const { data: meeting, isLoading } = useQuery({
    queryKey: ["meeting", id],
    queryFn: () => meetingsService.get(Number(id)),
    enabled: Boolean(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => meetingsService.delete(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      navigate("/meetings");
    },
  });

  if (isLoading) return <PageLoading />;
  if (!meeting) return <p>Meeting not found.</p>;

  return (
    <div>
      <PageHeader
        title={meeting.title}
        actions={
          <div className="flex gap-2">
            <Link to="/meetings" className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            {hasPermission("meeting-edit") && (
              <Link to={`/meetings/${meeting.id}/edit`} className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted">
                <Pencil className="h-4 w-4" /> Edit
              </Link>
            )}
            {hasPermission("meeting-delete") && (
              <button onClick={() => setShowDelete(true)} className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            )}
          </div>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Details</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Project</dt>
              <dd>{meeting.project_name || meeting.project_id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Date</dt>
              <dd>{formatDate(meeting.meeting_date)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Organizer</dt>
              <dd>{meeting.organizer?.name || meeting.author?.name || "N/A"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Location</dt>
              <dd>{meeting.location || "N/A"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Created</dt>
              <dd>{formatDateTime(meeting.created_at)}</dd>
            </div>
          </dl>
        </div>
        {meeting.attendees && meeting.attendees.length > 0 && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Attendees</h2>
            <div className="flex flex-wrap gap-2">
              {meeting.attendees.map((a, i) => (
                <span key={i} className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">{a}</span>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="mt-6 space-y-6">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-3 text-lg font-semibold">Summary</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{meeting.summary}</p>
        </div>
        {meeting.decisions_taken && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-3 text-lg font-semibold">Decisions Taken</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{meeting.decisions_taken}</p>
          </div>
        )}
        {meeting.action_items && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-3 text-lg font-semibold">Action Items</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{meeting.action_items}</p>
          </div>
        )}
        {meeting.blockers && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-3 text-lg font-semibold">Blockers</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{meeting.blockers}</p>
          </div>
        )}
        {meeting.notes && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-3 text-lg font-semibold">Notes</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{meeting.notes}</p>
          </div>
        )}
      </div>
      <ConfirmDialog
        open={showDelete}
        title="Delete Meeting"
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
