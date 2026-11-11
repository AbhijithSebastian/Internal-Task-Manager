import { PreviewEngine } from "./PreviewEngine";

interface FilePreviewProps {
  mimeType?: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  className?: string;
}

export function FilePreview({
  mimeType,
  fileName,
  fileUrl,
  fileSize,
  className = "",
}: FilePreviewProps) {
  return (
    <PreviewEngine
      mimeType={mimeType}
      fileName={fileName}
      fileUrl={fileUrl}
      fileSize={fileSize}
      className={className}
    />
  );
}
