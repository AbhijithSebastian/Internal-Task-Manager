import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { ArrowLeft } from "lucide-react";

export default function MeetingFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: "", meeting_date: "", location: "virtual",
    summary: "", decisions_taken: "", blockers: "", action_items: "", notes: "",
    project_id: "", attendees: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: projectsData } = useQuery({
    queryKey: ["projects-minimal"],
    queryFn: () => api.get("/projects", { params: { per_page: 200 } }).then((r) => r.data?.items || r.data?.data || []),
  });

  const projects = Array.isArray(projectsData) ? projectsData as Array<{ id: number; name: string }> : [];

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post("/meetings", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["meetings"] }); navigate("/work/meetings"); },
    onError: (err: { response?: { data?: { errors?: Record<string, string[]> } } }) => {
      const es = err.response?.data?.errors;
      if (es) {
        const flat: Record<string, string> = {};
        for (const [k, v] of Object.entries(es)) flat[k] = (v as string[])[0];
        setErrors(flat);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const payload: Record<string, unknown> = {
      ...form,
      project_id: form.project_id ? Number(form.project_id) : undefined,
      attendees: form.attendees ? form.attendees.split(",").map((s) => s.trim()) : [],
    };
    if (!payload.project_id) delete payload.project_id;
    mutation.mutate(payload);
  };

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="page-container max-w-2xl py-6">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate("/work/meetings")} className="p-1 rounded-md text-tertiary hover:text-primary hover:bg-hover transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-bold text-primary">Schedule Meeting</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <div className="space-y-4">
            <Input label="Title" value={form.title} onChange={(e) => update("title", e.target.value)} error={errors.title} required placeholder="Weekly sync..." />
            <Input label="Meeting date & time" type="datetime-local" value={form.meeting_date} onChange={(e) => update("meeting_date", e.target.value)} error={errors.meeting_date} required />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Location" value={form.location} onChange={(e) => update("location", e.target.value)} options={[
                { value: "virtual", label: "Virtual" },
                { value: "office", label: "Office" },
                { value: "client-site", label: "Client Site" },
              ]} />
              <Select label="Project" value={form.project_id} onChange={(e) => update("project_id", e.target.value)} options={[
                { value: "", label: "None" },
                ...projects.map((p: { id: number; name: string }) => ({ value: String(p.id), label: p.name })),
              ]} />
            </div>
            <Input label="Attendees (comma-separated emails)" value={form.attendees} onChange={(e) => update("attendees", e.target.value)} placeholder="user@example.com, user2@..." />
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-primary mb-4">Meeting Notes</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Summary</label>
              <textarea value={form.summary} onChange={(e) => update("summary", e.target.value)} rows={3}
                className="w-full rounded-md bg-surface border border-default px-3 py-2 text-sm text-primary placeholder:text-tertiary hover:border-hover focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary transition-colors duration-fast resize-y"
                placeholder="Meeting summary..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Decisions Taken</label>
              <textarea value={form.decisions_taken} onChange={(e) => update("decisions_taken", e.target.value)} rows={2}
                className="w-full rounded-md bg-surface border border-default px-3 py-2 text-sm text-primary placeholder:text-tertiary hover:border-hover focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary transition-colors duration-fast resize-y" />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Blockers</label>
              <textarea value={form.blockers} onChange={(e) => update("blockers", e.target.value)} rows={2}
                className="w-full rounded-md bg-surface border border-default px-3 py-2 text-sm text-primary placeholder:text-tertiary hover:border-hover focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary transition-colors duration-fast resize-y" />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Action Items</label>
              <textarea value={form.action_items} onChange={(e) => update("action_items", e.target.value)} rows={2}
                className="w-full rounded-md bg-surface border border-default px-3 py-2 text-sm text-primary placeholder:text-tertiary hover:border-hover focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary transition-colors duration-fast resize-y" />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Additional Notes</label>
              <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={2}
                className="w-full rounded-md bg-surface border border-default px-3 py-2 text-sm text-primary placeholder:text-tertiary hover:border-hover focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary transition-colors duration-fast resize-y" />
            </div>
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={mutation.isPending}>Schedule Meeting</Button>
          <Button variant="secondary" onClick={() => navigate("/work/meetings")}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
