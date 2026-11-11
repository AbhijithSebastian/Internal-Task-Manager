import { PreviewEngine } from "@/components/previews/PreviewEngine";
import { resourceService } from "../services/resources";
import type { Resource } from "@/types/resources";

interface ResourcePreviewProps {
  resource: Resource;
  className?: string;
}

export function ResourcePreview({ resource, className = "" }: ResourcePreviewProps) {
  const fileUrl = resource.file_path ? resourceService.getFileUrl(resource.id) : undefined;

  return (
    <PreviewEngine
      mimeType={resource.mime_type}
      fileName={resource.name}
      fileUrl={fileUrl}
      fileSize={resource.file_size}
      url={resource.url}
      className={className}
    />
  );
}
