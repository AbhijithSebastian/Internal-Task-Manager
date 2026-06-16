import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { announcementsService } from "@/features/announcements/services/announcements";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoading } from "@/components/shared/LoadingSpinner";

export default function AnnouncementFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({ title: "", content: "", status: "draft" });
  const [error, setError] = useState("");

  const { data: announcement, isLoading } = useQuery({
    queryKey: ["announcement", id],
    queryFn: () => announcementsService.get(Number(id)),
    enabled: isEdit,
  });

  useEffect(() => {
    if (announcement) {
      setForm({ title: announcement.title, content: announcement.content || "", status: announcement.status || "draft" });
    }
  }, [announcement]);

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit ? announcementsService.update(Number(id), data) : announcementsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      navigate("/announcements");
    },
    onError: (err: any) => setError(err?.response?.data?.detail || "Failed to save"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    mutation.mutate(form);
  };

  if (isEdit && isLoading) return <PageLoading />;

  return (
    <div>
      <PageHeader title={isEdit ? "Edit Announcement" : "Create Announcement"} />
      <div className="max-w-2xl rounded-lg border bg-card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
          <div>
            <label className="block text-sm font-medium">Title</label>
            <input type="text" required className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium">Content</label>
            <textarea rows={8} required className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium">Status</label>
            <select className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={mutation.isPending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {mutation.isPending ? "Saving..." : isEdit ? "Update Announcement" : "Create Announcement"}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
