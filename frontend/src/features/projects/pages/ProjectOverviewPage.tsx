import { useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useProject, useProjectMembers, useProjectMeetings } from "@/features/projects/hooks/useProject";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { openDrawer } from "@/hooks/useDrawer";
import { Link2, Upload, Trash2, Download, File as FileIcon, Image, FileSpreadsheet, FileArchive, FileText, Plus } from "lucide-react";
import { formatDate, formatRelative, formatFileSize, formatDateTime } from "@/utils/formatters";
import type { Attachment } from "@/types";

/* ---------- Overview Tab ---------- */
export default function ProjectOverviewPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(projectId);
  const { data: members } = useProjectMembers(projectId);
  const { data: meetings } = useProjectMeetings(projectId);

  if (isLoading || !project) {
    return (
      <div className="space-y-5">
        <Skeleton variant="rect" className="h-32 w-full rounded-lg" />
        <Skeleton variant="rect" className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        <Card>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary mb-2">Description</h3>
          {project.description ? (
            <p className="text-sm text-secondary leading-relaxed whitespace-pre-wrap">{project.description}</p>
          ) : (
            <p className="text-sm text-tertiary italic">No description provided.</p>
          )}
        </Card>

        <Card>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary mb-2">Links</h3>
          <div className="space-y-1.5">
            {project.figma_url && <a href={project.figma_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-link hover:underline"><Link2 className="h-3.5 w-3.5" /> Figma</a>}
            {project.github_url && <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-link hover:underline"><Link2 className="h-3.5 w-3.5" /> GitHub</a>}
            {project.docs_url && <a href={project.docs_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-link hover:underline"><Link2 className="h-3.5 w-3.5" /> Docs</a>}
            {!project.figma_url && !project.github_url && !project.docs_url && <p className="text-sm text-tertiary italic">No links configured.</p>}
          </div>
        </Card>

        <ResourcesSection projectId={project.id} />

        {meetings && meetings.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">Recent Meetings</h3>
              <Button size="sm" variant="secondary" onClick={() => navigate(`/work/meetings/new?project_id=${project.id}`)}>
                <Plus className="h-3 w-3" /> Log Meeting
              </Button>
            </div>
            <div className="space-y-1.5">
              {meetings.slice(0, 5).map((m) => (
                <div key={m.id} className="flex items-center justify-between p-2 rounded-lg border border-default hover:bg-hover transition-colors cursor-pointer" onClick={() => openDrawer("meeting", m.id)}>
                  <div className="min-w-0 mr-2">
                    <p className="text-sm text-primary truncate">{m.title}</p>
                    <p className="text-xs text-tertiary">{formatDateTime(m.meeting_date)}</p>
                  </div>
                  {m.organizer && <Avatar name={m.organizer.name} size="sm" />}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <div className="space-y-3">
        <Card>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary mb-3">Details</h3>
          <div className="space-y-2.5 text-sm">
            <Row label="Status" value={<StatusBadge status={project.status} />} />
            <Row label="Priority" value={<PriorityBadge priority={project.priority} />} />
            <Row label="Start" value={project.start_date ? formatDate(project.start_date) : "—"} />
            <Row label="Deadline" value={project.deadline ? formatDate(project.deadline) : "—"} />
            <Row label="Members" value={String(project.members_count || project.member_count || 0)} />
          </div>
        </Card>

        {(project.project_manager || project.team_lead) && (
          <Card>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary mb-3">Team</h3>
            <div className="space-y-2.5">
              {project.project_manager && (
                <div className="flex items-center gap-2">
                  <Avatar name={project.project_manager.name} size="sm" />
                  <div><p className="text-sm text-primary">{project.project_manager.name}</p><p className="text-xs text-tertiary">Project Manager</p></div>
                </div>
              )}
              {project.team_lead && (
                <div className="flex items-center gap-2">
                  <Avatar name={project.team_lead.name} size="sm" />
                  <div><p className="text-sm text-primary">{project.team_lead.name}</p><p className="text-xs text-tertiary">Team Lead</p></div>
                </div>
              )}
            </div>
          </Card>
        )}

        {members && members.length > 0 && (
          <Card>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary mb-3">All Members</h3>
            <div className="space-y-1.5">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-2">
                  <Avatar name={m.user?.name || "?"} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-primary truncate">{m.user?.name || `User #${m.user_id}`}</p>
                    <p className="text-xs text-tertiary">{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ---------- Resources Section ---------- */
function ResourcesSection({ projectId }: { projectId: number }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: attachmentsData, isLoading: attachmentsLoading } = useQuery({
    queryKey: ["project-attachments", projectId],
    queryFn: () => api.get("/attachments", { params: { model_type: "project", model_id: projectId } }).then((r) => r.data?.items || r.data?.data || r.data || []),
    enabled: !!projectId,
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: number) => api.delete(`/attachments/${attachmentId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["project-attachments", projectId] }),
  });

  const attachments = (attachmentsData || []) as Attachment[];

  const handleUpload = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", files[0]);
      formData.append("model_type", "project");
      formData.append("model_id", String(projectId));
      formData.append("collection_name", "files");
      await api.post("/attachments/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      queryClient.invalidateQueries({ queryKey: ["project-attachments", projectId] });
    } catch {
      // error handled silently
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  }, [projectId]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return <FileIcon className="h-5 w-5 text-tertiary" />;
    if (mimeType.startsWith("image/")) return <Image className="h-5 w-5 text-semantic-info" />;
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("csv")) return <FileSpreadsheet className="h-5 w-5 text-semantic-success" />;
    if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("tar") || mimeType.includes("7z")) return <FileArchive className="h-5 w-5 text-semantic-warning" />;
    if (mimeType.includes("pdf")) return <FileText className="h-5 w-5 text-semantic-danger" />;
    return <FileIcon className="h-5 w-5 text-tertiary" />;
  };

  return (
    <Card>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary mb-3">Resources</h3>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed cursor-pointer transition-colors duration-fast ${
          dragOver ? "border-primary bg-primary-soft" : "border-default hover:border-hover bg-subtle/30"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
          disabled={uploading}
        />
        {uploading ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-sm text-secondary">Uploading...</span>
          </div>
        ) : (
          <>
            <Upload className="h-6 w-6 text-tertiary mb-2" />
            <p className="text-sm text-secondary">Drop files here or click to upload</p>
            <p className="text-xs text-tertiary mt-1">PDF, DOCX, XLSX, PPTX, images, ZIP, and more</p>
          </>
        )}
      </div>

      {attachmentsLoading ? (
        <div className="space-y-2 mt-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} variant="rect" className="h-12 w-full" />)}</div>
      ) : attachments.length === 0 ? (
        <p className="text-sm text-tertiary italic mt-3">No files uploaded yet.</p>
      ) : (
        <div className="space-y-1.5 mt-3">
          {attachments.map((file) => (
            <div key={file.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-default bg-surface hover:bg-hover transition-colors duration-fast group">
              {getFileIcon(file.mime_type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-primary truncate">{file.name || file.file_name}</p>
                <p className="text-xs text-tertiary">{formatFileSize(file.size)} &middot; {formatRelative(file.created_at)}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-fast">
                <button onClick={() => window.open(file.url, "_blank")} className="p-1.5 rounded text-tertiary hover:text-primary hover:bg-hover" title="Download">
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => deleteAttachmentMutation.mutate(file.id)} className="p-1.5 rounded text-tertiary hover:text-danger hover:bg-hover" title="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ---------- Shared helpers ---------- */
function StatusBadge({ status }: { status: string }) {
  const m: Record<string, { variant: "success" | "warning" | "danger" | "neutral"; label: string }> = {
    active: { variant: "success", label: "Active" },
    on_hold: { variant: "warning", label: "On Hold" },
    completed: { variant: "neutral", label: "Completed" },
    archived: { variant: "neutral", label: "Archived" },
  };
  const c = m[status] || { variant: "neutral" as const, label: status };
  return <Badge variant={c.variant} dot>{c.label}</Badge>;
}

function PriorityBadge({ priority }: { priority: string }) {
  const m: Record<string, { variant: "success" | "warning" | "danger" | "neutral"; label: string }> = {
    low: { variant: "neutral", label: "Low" },
    medium: { variant: "warning", label: "Medium" },
    high: { variant: "danger", label: "High" },
    urgent: { variant: "danger", label: "Urgent" },
  };
  const c = m[priority] || { variant: "neutral" as const, label: priority };
  return <Badge variant={c.variant} size="sm">{c.label}</Badge>;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-tertiary text-xs">{label}</span>
      <span className="text-primary text-sm">{value}</span>
    </div>
  );
}
