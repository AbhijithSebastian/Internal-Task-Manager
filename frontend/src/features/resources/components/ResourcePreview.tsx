import { resourceService } from "../services/resources";
import { FilePreview } from "@/components/previews/FilePreview";
import type { Resource } from "@/types/resources";

interface ResourcePreviewProps {
  resource: Resource;
  className?: string;
}

export function ResourcePreview({ resource, className = "" }: ResourcePreviewProps) {
  const fileUrl = resource.file_path ? resourceService.getFileUrl(resource.id) : undefined;

  return (
    <FilePreview
      mimeType={resource.mime_type}
      fileName={resource.name}
      fileUrl={fileUrl}
      className={className}
    />
  );
}
