import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { ArrowLeft } from "lucide-react";

export default function AnnouncementFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;
  const [form, setForm] = useState({ title: "", content: "", priority: "normal" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: ann } = useQuery({
    queryKey: ["announcement", id],
    queryFn: () => api.get(`/announcements/${id}`).then((r) => r.data?.data || r.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!ann) return;
    const a = ann as Record<string, unknown>;
    setForm({ title: (a.title as string) || "", content: (a.content as string) || "", priority: (a.priority as string) || "normal" });
  }, [ann]);

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post("/announcements", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["announcements"] }); navigate("/work/announcements"); },
    onError: handleError,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.put(`/announcements/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["announcements"] }); navigate("/work/announcements"); },
    onError: handleError,
  });

  function handleError(err: { response?: { data?: { errors?: Record<string, string[]> } } }) {
    const es = err.response?.data?.errors;
    if (es) {
      const flat: Record<string, string> = {};
      for (const [k, v] of Object.entries(es)) flat[k] = (v as string[])[0];
      setErrors(flat);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (isEdit) updateMutation.mutate(form);
    else createMutation.mutate(form);
  };

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="page-container max-w-2xl py-6">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate("/work/announcements")} className="p-1 rounded-md text-tertiary hover:text-primary hover:bg-hover transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-bold text-primary">{isEdit ? "Edit Announcement" : "New Announcement"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <div className="space-y-4">
            <Input label="Title" value={form.title} onChange={(e) => update("title", e.target.value)} error={errors.title} required placeholder="Important update..." />
            <Select label="Priority" value={form.priority} onChange={(e) => update("priority", e.target.value)} options={[
              { value: "low", label: "Low" }, { value: "normal", label: "Normal" },
              { value: "high", label: "High" }, { value: "urgent", label: "Urgent" },
            ]} />
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Content</label>
              <textarea value={form.content} onChange={(e) => update("content", e.target.value)} rows={8}
                className="w-full rounded-md bg-surface border border-default px-3 py-2 text-sm text-primary placeholder:text-tertiary hover:border-hover focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary transition-colors duration-fast resize-y"
                placeholder="Write your announcement..." />
              {errors.content && <p className="text-xs text-danger mt-1">{errors.content}</p>}
            </div>
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
            {isEdit ? "Save Changes" : "Create Announcement"}
          </Button>
          <Button variant="secondary" onClick={() => navigate("/work/announcements")}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
