import { resourceService } from "../services/resources";
import type { Resource } from "@/types/resources";
import { FileImage, FileText, FileArchive, Package, Video, File } from "lucide-react";

interface ResourcePreviewProps {
  resource: Resource;
  className?: string;
}

export function ResourcePreview({ resource, className = "" }: ResourcePreviewProps) {
  const fileUrl = resource.file_path ? resourceService.getFileUrl(resource.id) : null;
  const mime = resource.mime_type ?? "";

  if (mime.startsWith("image/") && fileUrl) {
    return (
      <div className={`flex items-center justify-center bg-subtle rounded-lg overflow-hidden ${className}`}>
        <img src={fileUrl} alt={resource.name} className="max-w-full max-h-full object-contain" />
      </div>
    );
  }

  if (mime.startsWith("video/") && fileUrl) {
    return (
      <div className={`flex items-center justify-center bg-subtle rounded-lg overflow-hidden ${className}`}>
        <video controls className="max-w-full max-h-full">
          <source src={fileUrl} type={mime} />
        </video>
      </div>
    );
  }

  const Icon = mime.startsWith("image/") ? FileImage
    : mime.includes("pdf") || mime.includes("document") || mime.includes("text") ? FileText
    : mime.includes("zip") || mime.includes("rar") || mime.includes("tar") || mime.includes("gz") || mime.includes("7z") ? FileArchive
    : mime.includes("apk") ? Package
    : mime.startsWith("video/") ? Video
    : File;

  return (
    <div className={`flex flex-col items-center justify-center bg-subtle rounded-lg p-8 ${className}`}>
      <Icon className="h-16 w-16 text-tertiary" />
      <p className="mt-3 text-sm text-secondary">Preview not available</p>
      {resource.file_path && (
        <p className="text-xs text-tertiary mt-1">{resource.mime_type}</p>
      )}
    </div>
  );
}
