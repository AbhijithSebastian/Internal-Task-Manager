import { useState } from "react";
import { useParams } from "react-router-dom";
import { useProject } from "@/features/projects/hooks/useProject";
import { FigmaPreview } from "@/components/previews/FigmaPreview";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Palette, Upload, Link, Figma, FileImage, FileText, Type, Download, Trash2 } from "lucide-react";

const DESIGN_TYPES = ["figma", "adobe-xd", "sketch", "illustrator", "svg", "image", "pdf", "font", "icon"] as const;

interface DesignItem {
  id: string;
  name: string;
  type: typeof DESIGN_TYPES[number];
  url?: string;
  version: number;
  updatedBy: string;
  updatedAt: string;
  preview?: string;
}

export default function ProjectDesignPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project } = useProject(projectId);
  const [items] = useState<DesignItem[]>([]);

  const hasFigmaUrl = project?.figma_url;

  if (!projectId) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary">Design</h2>
          <p className="text-sm text-tertiary">{items.length} asset{items.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => {}}>
            <Link className="h-4 w-4" /> Add Link
          </Button>
          <Button size="sm" onClick={() => {}}>
            <Upload className="h-4 w-4" /> Upload Design
          </Button>
        </div>
      </div>

      {hasFigmaUrl && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Figma className="h-4 w-4 text-[#a259ff]" />
            <h3 className="text-sm font-semibold text-primary">Connected Figma</h3>
            <Badge variant="success" size="sm" dot>Connected</Badge>
          </div>
          <FigmaPreview url={project.figma_url!} />
        </Card>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={<Palette className="h-12 w-12" />}
          title="No design assets yet"
          description="Upload design files, connect Figma, or add external design links to get started."
          action={
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => {}}>
                <Upload className="h-4 w-4" /> Upload Design
              </Button>
              <Button size="sm" variant="secondary" onClick={() => {}}>
                <Figma className="h-4 w-4" /> Connect Figma
              </Button>
              <Button size="sm" variant="secondary" onClick={() => {}}>
                <Link className="h-4 w-4" /> Add Design Link
              </Button>
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item) => (
            <DesignCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function DesignCard({ item }: { item: DesignItem }) {
  const iconMap = {
    figma: Figma, "adobe-xd": FileImage, sketch: FileImage, illustrator: FileImage,
    svg: FileImage, image: FileImage, pdf: FileText, font: Type, icon: Palette,
  };
  const Icon = iconMap[item.type] || FileImage;

  return (
    <Card className="p-4 hover:bg-hover transition-colors group">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-12 h-12 rounded-lg bg-subtle flex items-center justify-center text-tertiary overflow-hidden">
          {item.preview ? (
            <img src={item.preview} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <Icon className="h-6 w-6" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-primary truncate">{item.name}</p>
          <p className="text-xs text-tertiary">{item.type} &middot; v{item.version}</p>
          <p className="text-xs text-tertiary">{item.updatedBy} &middot; {item.updatedAt}</p>
          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="ghost"><Download className="h-3.5 w-3.5" /></Button>
            <Button size="sm" variant="ghost"><Trash2 className="h-3.5 w-3.5 text-semantic-danger" /></Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
