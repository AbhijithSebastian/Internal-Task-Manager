import { ImagePreview } from "./ImagePreview";
import { DocumentPreview } from "./DocumentPreview";
import { OfficePreview } from "./OfficePreview";
import { MediaPreview } from "./MediaPreview";
import { FallbackPreview } from "./FallbackPreview";
import { UrlPreview } from "./UrlPreview";

interface PreviewEngineProps {
  mimeType?: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  url?: string;
  className?: string;
}

export function PreviewEngine({
  mimeType,
  fileName,
  fileUrl,
  fileSize,
  url,
  className = "",
}: PreviewEngineProps) {
  const mime = mimeType?.toLowerCase() || "";
  const ext = (fileName?.split(".").pop() || "").toLowerCase();

  if (url && !fileUrl) {
    return <UrlPreview url={url} className={className} />;
  }

  if (fileUrl) {
    if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "svg", "webp", "gif", "bmp", "ico"].includes(ext)) {
      return <ImagePreview src={fileUrl} alt={fileName} className={className} />;
    }

    if (mime.startsWith("video/") || ["mp4", "mov", "avi", "webm", "mkv"].includes(ext)) {
      return <MediaPreview mimeType={mimeType} fileUrl={fileUrl} fileName={fileName} className={className} />;
    }

    if (mime.startsWith("audio/") || ["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(ext)) {
      return <MediaPreview mimeType={mimeType} fileUrl={fileUrl} fileName={fileName} className={className} />;
    }

    if (mime.includes("pdf") || ext === "pdf") {
      return <DocumentPreview mimeType={mimeType} fileUrl={fileUrl} fileName={fileName} className={className} />;
    }

    if (mime.includes("json") || ext === "json") {
      return <DocumentPreview mimeType={mimeType} fileUrl={fileUrl} fileName={fileName} className={className} />;
    }

    if (ext === "md" || ext === "markdown" || mime.includes("markdown")) {
      return <DocumentPreview mimeType={mimeType} fileUrl={fileUrl} fileName={fileName} className={className} />;
    }

    if (ext === "txt" || mime.includes("text")) {
      return <DocumentPreview mimeType={mimeType} fileUrl={fileUrl} fileName={fileName} className={className} />;
    }

    if (ext === "csv") {
      return <DocumentPreview mimeType={mimeType} fileUrl={fileUrl} fileName={fileName} className={className} />;
    }

    if (
      mime.includes("zip") || mime.includes("rar") || mime.includes("tar") ||
      mime.includes("7z") || mime.includes("gzip") || mime.includes("compress") ||
      ["zip", "rar", "7z", "tar", "gz"].includes(ext)
    ) {
      return <FallbackPreview mimeType={mimeType} fileName={fileName} fileUrl={fileUrl} fileSize={fileSize} className={className} />;
    }

    if (
      mime.includes("word") || mime.includes("document") ||
      mime.includes("spreadsheet") || mime.includes("excel") ||
      mime.includes("presentation") ||
      ["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext)
    ) {
      return <OfficePreview mimeType={mimeType} fileName={fileName} fileUrl={fileUrl} className={className} />;
    }
  }

  return (
    <FallbackPreview
      mimeType={mimeType}
      fileName={fileName}
      fileUrl={fileUrl}
      fileSize={fileSize}
      className={className}
    />
  );
}
