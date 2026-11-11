import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Button, Card, Input, Select, SkeletonForm } from "@/design-system";
import { ArrowLeft, X, Upload, FileText } from "lucide-react";

export default function MeetingFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;
  const [form, setForm] = useState({
    title: "",
    meeting_date: "",
    location: "virtual",
    duration: "",
    agenda: "",
    summary: "",
    decisions_taken: "",
    blockers: "",
    action_items: "",
    notes: "",
    project_id: "",
    attendees: "",
    recording_link: "",
    next_meeting_date: "",
    related_task_id: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: projectsData } = useQuery({
    queryKey: ["projects-minimal"],
    queryFn: () =>
      api
        .get("/projects", { params: { per_page: 100 } })
        .then((r) => r.data?.items || r.data?.data || []),
  });

  const { data: tasksData } = useQuery({
    queryKey: ["tasks-minimal"],
    queryFn: () =>
      api
        .get("/tasks", { params: { per_page: 100 } })
        .then((r) => r.data?.items || r.data?.data || []),
  });

  const projects = Array.isArray(projectsData)
    ? (projectsData as Array<{ id: number; name: string }>)
    : [];
  const tasks = Array.isArray(tasksData) ? (tasksData as Array<{ id: number; title: string }>) : [];

  const {
    data: meeting,
    isLoading: meetingLoading,
    isError: meetingError,
  } = useQuery({
    queryKey: ["meeting", id],
    queryFn: () => api.get(`/meetings/${id}`).then((r) => r.data?.data || r.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!meeting) return;
    const m = meeting as Record<string, unknown>;
    setForm({
      title: (m.title as string) || "",
      meeting_date: ((m.meeting_date as string) || "").slice(0, 16) || "",
      location: (m.location as string) || "virtual",
      duration: m.duration ? String(m.duration) : "",
      agenda: (m.agenda as string) || "",
      summary: (m.summary as string) || "",
      decisions_taken: (m.decisions_taken as string) || "",
      blockers: (m.blockers as string) || "",
      action_items: (m.action_items as string) || "",
      notes: (m.notes as string) || "",
      project_id: m.project_id ? String(m.project_id) : "",
      attendees: Array.isArray(m.attendees)
        ? (m.attendees as string[]).join(", ")
        : (m.attendees as string) || "",
      recording_link: (m.recording_link as string) || "",
      next_meeting_date: ((m.next_meeting_date as string) || "").slice(0, 16) || "",
      related_task_id: m.related_task_id ? String(m.related_task_id) : "",
    });
  }, [meeting]);

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isEdit ? api.put(`/meetings/${id}`, data) : api.post("/meetings", data),
    onSuccess: async (res) => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      if (!isEdit && files.length > 0) {
        const meetingId = res.data?.data?.id || res.data?.id;
        if (meetingId) {
          setUploading(true);
          try {
            for (const file of files) {
              const fd = new FormData();
              fd.append("file", file);
              fd.append("model_type", "meeting_log");
              fd.append("model_id", String(meetingId));
              fd.append("collection_name", "attachments");
              await api.post("/attachments/upload", fd, {
                headers: { "Content-Type": "multipart/form-data" },
              });
            }
          } catch (e) {
            console.error("Failed to upload some files", e);
          }
          setUploading(false);
        }
      }
      navigate("/work/meetings");
    },
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
    if (!form.project_id) {
      setErrors({ project_id: "Project is required" });
      return;
    }
    const payload: Record<string, unknown> = {
      ...form,
      project_id: form.project_id ? Number(form.project_id) : undefined,
      related_task_id: form.related_task_id ? Number(form.related_task_id) : undefined,
      duration: form.duration ? Number(form.duration) : undefined,
      attendees: form.attendees ? form.attendees.split(",").map((s) => s.trim()) : [],
    };
    if (!payload.project_id) delete payload.project_id;
    if (!payload.duration) delete payload.duration;
    if (!payload.agenda) delete payload.agenda;
    if (!payload.recording_link) delete payload.recording_link;
    if (!payload.next_meeting_date) delete payload.next_meeting_date;
    mutation.mutate(payload);
  };

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  if (isEdit && meetingLoading)
    return (
      <div className="page-container py-8">
        <SkeletonForm fields={6} />
      </div>
    );
  if (isEdit && meetingError)
    return (
      <div className="page-container py-6">
        <p className="text-sm text-danger">Failed to load meeting. Please try again.</p>
      </div>
    );

  return (
    <div className="page-container max-w-2xl py-6">
      <div className="mb-5 flex items-center gap-3">
        <button
          onClick={() => navigate("/work/meetings")}
          className="rounded-md p-1 text-tertiary transition-colors hover:bg-hover hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-bold text-primary">
          {isEdit ? "Edit Meeting Log" : "Log Meeting"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <div className="space-y-4">
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              error={errors.title}
              required
              placeholder="Weekly sync..."
            />
            <Input
              label="Meeting date & time"
              type="datetime-local"
              value={form.meeting_date}
              onChange={(e) => update("meeting_date", e.target.value)}
              error={errors.meeting_date}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Location"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                options={[
                  { value: "virtual", label: "Virtual" },
                  { value: "office", label: "Office" },
                  { value: "client-site", label: "Client Site" },
                ]}
              />
              <Select
                label="Project"
                required
                value={form.project_id}
                onChange={(e) => update("project_id", e.target.value)}
                error={errors.project_id}
                options={[
                  { value: "", label: "Select project" },
                  ...projects.map((p: { id: number; name: string }) => ({
                    value: String(p.id),
                    label: p.name,
                  })),
                ]}
              />
            </div>
            <Input
              label="Duration (minutes)"
              type="number"
              value={form.duration}
              onChange={(e) => update("duration", e.target.value)}
              placeholder="60"
            />
            <Input
              label="Attendees (comma-separated emails)"
              value={form.attendees}
              onChange={(e) => update("attendees", e.target.value)}
              placeholder="user@example.com, user2@..."
            />
            <Input
              label="Recording Link"
              type="url"
              value={form.recording_link}
              onChange={(e) => update("recording_link", e.target.value)}
              placeholder="https://meet.google.com/..."
            />
            <Input
              label="Next Meeting Date"
              type="datetime-local"
              value={form.next_meeting_date}
              onChange={(e) => update("next_meeting_date", e.target.value)}
            />
            <Select
              label="Related Task"
              value={form.related_task_id}
              onChange={(e) => update("related_task_id", e.target.value)}
              options={[
                { value: "", label: "None" },
                ...tasks.map((t: { id: number; title: string }) => ({
                  value: String(t.id),
                  label: t.title,
                })),
              ]}
            />
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-sm font-semibold text-primary">Meeting Notes</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-primary">Agenda</label>
              <textarea
                value={form.agenda}
                onChange={(e) => update("agenda", e.target.value)}
                rows={2}
                className="border-default focus:ring-primary-ring w-full resize-y rounded-md border bg-surface px-3 py-2 text-sm text-primary transition-colors duration-fast placeholder:text-tertiary hover:border-hover focus:border-primary focus:outline-none focus:ring-2"
                placeholder="Meeting agenda..."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-primary">Summary</label>
              <textarea
                value={form.summary}
                onChange={(e) => update("summary", e.target.value)}
                rows={3}
                className="border-default focus:ring-primary-ring w-full resize-y rounded-md border bg-surface px-3 py-2 text-sm text-primary transition-colors duration-fast placeholder:text-tertiary hover:border-hover focus:border-primary focus:outline-none focus:ring-2"
                placeholder="Meeting summary..."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-primary">Decisions Taken</label>
              <textarea
                value={form.decisions_taken}
                onChange={(e) => update("decisions_taken", e.target.value)}
                rows={2}
                className="border-default focus:ring-primary-ring w-full resize-y rounded-md border bg-surface px-3 py-2 text-sm text-primary transition-colors duration-fast placeholder:text-tertiary hover:border-hover focus:border-primary focus:outline-none focus:ring-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-primary">Blockers</label>
              <textarea
                value={form.blockers}
                onChange={(e) => update("blockers", e.target.value)}
                rows={2}
                className="border-default focus:ring-primary-ring w-full resize-y rounded-md border bg-surface px-3 py-2 text-sm text-primary transition-colors duration-fast placeholder:text-tertiary hover:border-hover focus:border-primary focus:outline-none focus:ring-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-primary">Action Items</label>
              <textarea
                value={form.action_items}
                onChange={(e) => update("action_items", e.target.value)}
                rows={2}
                className="border-default focus:ring-primary-ring w-full resize-y rounded-md border bg-surface px-3 py-2 text-sm text-primary transition-colors duration-fast placeholder:text-tertiary hover:border-hover focus:border-primary focus:outline-none focus:ring-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-primary">
                Additional Notes
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                rows={2}
                className="border-default focus:ring-primary-ring w-full resize-y rounded-md border bg-surface px-3 py-2 text-sm text-primary transition-colors duration-fast placeholder:text-tertiary hover:border-hover focus:border-primary focus:outline-none focus:ring-2"
              />
            </div>
          </div>
        </Card>

        {!isEdit && (
          <Card>
            <h3 className="mb-4 text-sm font-semibold text-primary">Attachments</h3>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-default flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-surface px-4 py-6 transition-colors hover:border-hover"
            >
              <Upload className="mb-1 h-5 w-5 text-tertiary" />
              <p className="text-sm text-tertiary">Click to add PDFs, Excel, images</p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                onChange={(e) => {
                  const selected = Array.from(e.target.files || []);
                  setFiles((prev) => [...prev, ...selected]);
                  if (e.target) e.target.value = "";
                }}
              />
            </div>
            {files.length > 0 && (
              <ul className="mt-3 space-y-1">
                {files.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 rounded-md bg-subtle px-2 py-1 text-sm text-secondary"
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0 text-tertiary" />
                    <span className="flex-1 truncate">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                      className="text-tertiary transition-colors hover:text-semantic-danger"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" loading={mutation.isPending || uploading}>
            {isEdit ? "Save Changes" : uploading ? "Uploading files..." : "Log Meeting"}
          </Button>
          <Button variant="secondary" onClick={() => navigate("/work/meetings")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
