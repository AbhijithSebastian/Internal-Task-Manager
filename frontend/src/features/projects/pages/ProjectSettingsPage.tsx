import { useParams } from "react-router-dom";
import { useProject } from "@/features/projects/hooks/useProject";
import { Card } from "@/components/ui/Card";
import { formatDateTime } from "@/utils/formatters";

export default function ProjectSettingsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project } = useProject(projectId);

  if (!project) return null;

  return (
    <Card>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary mb-3">Project Settings</h3>
      <div className="text-sm space-y-3">
        <Row label="ID" value={<span className="font-mono">#{project.id}</span>} />
        <Row label="Created" value={formatDateTime(project.created_at)} />
        <Row label="Updated" value={formatDateTime(project.updated_at)} />
        <Row label="Author" value={project.author?.name || "—"} />
      </div>
      <p className="text-xs text-tertiary mt-4">Use the Edit button in the header to modify project details.</p>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-tertiary text-xs">{label}</span>
      <span className="text-primary text-sm">{value}</span>
    </div>
  );
}
