import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { meetingsService } from "@/features/meetings/services/meetings";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoading } from "@/components/shared/LoadingSpinner";

export default function MeetingFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    title: "", description: "", meeting_date: "", location: "", notes: "",
  });
  const [error, setError] = useState("");

  const { data: meeting, isLoading } = useQuery({
    queryKey: ["meeting", id],
    queryFn: () => meetingsService.get(Number(id)),
    enabled: isEdit,
  });

  useEffect(() => {
    if (meeting) {
      setForm({
        title: meeting.title,
        description: meeting.description || "",
        meeting_date: meeting.meeting_date?.split(".")[0] || "",
        location: meeting.location || "",
        notes: meeting.notes || "",
      });
    }
  }, [meeting]);

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit ? meetingsService.update(Number(id), data) : meetingsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      navigate("/meetings");
    },
    onError: (err: any) => setError(err?.response?.data?.detail || "Failed to save"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const payload: Record<string, unknown> = { ...form };
    if (!payload.meeting_date) delete payload.meeting_date;
    mutation.mutate(payload);
  };

  if (isEdit && isLoading) return <PageLoading />;

  return (
    <div>
      <PageHeader title={isEdit ? "Edit Meeting" : "Create Meeting"} />
      <div className="max-w-2xl rounded-lg border bg-card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
          <div>
            <label className="block text-sm font-medium">Title</label>
            <input type="text" required className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea rows={3} className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Meeting Date</label>
              <input type="datetime-local" className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" value={form.meeting_date} onChange={(e) => setForm({ ...form, meeting_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium">Location</label>
              <input type="text" className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Room, link, etc." />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Notes</label>
            <textarea rows={4} className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={mutation.isPending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {mutation.isPending ? "Saving..." : isEdit ? "Update Meeting" : "Create Meeting"}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
