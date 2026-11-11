import { useParams } from "react-router-dom";
import { useProject } from "@/features/projects/hooks/useProject";
import { Card } from "@/design-system";
import { formatDateTime } from "@/utils/formatters";

export default function ProjectSettingsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project } = useProject(projectId);

  if (!project) return null;

  return (
    <Card>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-tertiary">
        Project Settings
      </h3>
      <div className="space-y-3 text-sm">
        <Row label="ID" value={<span className="font-mono">#{project.id}</span>} />
        <Row label="Created" value={formatDateTime(project.created_at)} />
        <Row label="Updated" value={formatDateTime(project.updated_at)} />
        <Row label="Author" value={project.author?.name || "—"} />
      </div>
      <p className="mt-4 text-xs text-tertiary">
        Use the Edit button in the header to modify project details.
      </p>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-tertiary">{label}</span>
      <span className="text-sm text-primary">{value}</span>
    </div>
  );
}
