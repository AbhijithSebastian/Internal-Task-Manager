import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { announcementsService } from "@/features/announcements/services/announcements";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { ArrowLeft, Send, Save } from "lucide-react";

type PublishMode = "draft" | "now" | "schedule";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export default function AnnouncementFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("normal");
  const [publishMode, setPublishMode] = useState<PublishMode>("draft");
  const [scheduledAt, setScheduledAt] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: existing } = useQuery({
    queryKey: ["announcement", id],
    queryFn: () => announcementsService.get(Number(id)),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!existing) return;
    const a = existing;
    setTitle(a.title || "");
    setContent(a.content || "");
    setPriority(a.priority || "normal");
    if (a.status === "draft") {
      setPublishMode("draft");
    } else if (a.published_at) {
      setPublishMode("schedule");
      setScheduledAt(a.published_at.slice(0, 16));
    } else {
      setPublishMode("now");
    }
  }, [existing]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Title is required";
    if (!content.trim()) next.content = "Content is required";
    if (publishMode === "schedule" && !scheduledAt) next.scheduled_at = "Scheduled date is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildPayload = (): Record<string, unknown> => {
    const payload: Record<string, unknown> = { title: title.trim(), content: content.trim(), priority };
    if (publishMode === "draft") {
      payload.status = "draft";
    } else if (publishMode === "now") {
      payload.status = "published";
    } else {
      payload.status = "published";
      payload.published_at = new Date(scheduledAt).toISOString();
    }
    return payload;
  };

  const handleError = (err: { response?: { data?: { errors?: Record<string, string[]> } } }) => {
    const serverErrors = err.response?.data?.errors;
    if (serverErrors) {
      const flat: Record<string, string> = {};
      for (const [k, v] of Object.entries(serverErrors)) {
        flat[k] = (v as string[])[0];
      }
      setErrors(flat);
    }
  };

  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["announcements"] });
    navigate("/work/announcements");
  };

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => announcementsService.create(data as Parameters<typeof announcementsService.create>[0]),
    onSuccess,
    onError: handleError,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => announcementsService.update(Number(id), data as Parameters<typeof announcementsService.update>[1]),
    onSuccess,
    onError: handleError,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = { ...buildPayload(), status: "draft" };
    setErrors({});
    if (isEdit) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

  const handlePublish = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = buildPayload();
    setErrors({});
    if (isEdit) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="page-container max-w-2xl py-6">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => navigate("/work/announcements")}
          className="p-1 rounded-md text-tertiary hover:text-primary hover:bg-hover transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-bold text-primary">
          {isEdit ? "Edit Announcement" : "New Announcement"}
        </h1>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <Card>
          <div className="space-y-4">
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={errors.title}
              required
              placeholder="Important update..."
            />
            <Select
              label="Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              options={PRIORITY_OPTIONS}
            />
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="w-full rounded-md bg-surface border border-default px-3 py-2 text-sm text-primary placeholder:text-tertiary hover:border-hover focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary transition-colors duration-fast resize-y"
                placeholder="Write your announcement..."
              />
              {errors.content && (
                <p className="text-xs text-semantic-danger mt-1">{errors.content}</p>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <label className="block text-sm font-medium text-primary">Publish Options</label>
            <div className="flex items-center gap-4">
              {(["draft", "now", "schedule"] as const).map((mode) => (
                <label
                  key={mode}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm cursor-pointer transition-colors ${
                    publishMode === mode
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-default bg-surface text-secondary hover:border-hover"
                  }`}
                >
                  <input
                    type="radio"
                    name="publishMode"
                    value={mode}
                    checked={publishMode === mode}
                    onChange={() => setPublishMode(mode)}
                    className="sr-only"
                  />
                  {mode === "draft" && "Save as Draft"}
                  {mode === "now" && "Publish Now"}
                  {mode === "schedule" && "Schedule"}
                </label>
              ))}
            </div>
            {publishMode === "schedule" && (
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Schedule Date & Time</label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full h-9 px-3 rounded-md bg-surface border border-default text-sm text-primary hover:border-hover focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary transition-colors duration-fast"
                />
                {errors.scheduled_at && (
                  <p className="text-xs text-semantic-danger mt-1">{errors.scheduled_at}</p>
                )}
              </div>
            )}
          </div>
        </Card>

        <div className="flex items-center gap-3">
          {publishMode !== "draft" && (
            <Button
              type="button"
              variant="primary"
              onClick={handlePublish}
              loading={isPending}
            >
              <Send className="h-4 w-4" />
              {isEdit ? "Update & Publish" : "Publish"}
            </Button>
          )}
          <Button
            type="submit"
            variant={publishMode === "draft" ? "primary" : "secondary"}
            loading={isPending}
          >
            <Save className="h-4 w-4" />
            {publishMode === "draft"
              ? isEdit
                ? "Save as Draft"
                : "Save as Draft"
              : "Save as Draft"}
          </Button>
          <Button variant="ghost" onClick={() => navigate("/work/announcements")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
