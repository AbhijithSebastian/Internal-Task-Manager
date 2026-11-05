import { ImagePreview } from "./ImagePreview";
import { DocumentPreview } from "./DocumentPreview";
import { OfficePreview } from "./OfficePreview";
import { MediaPreview } from "./MediaPreview";
import { FallbackPreview } from "./FallbackPreview";
import { UrlPreview } from "./UrlPreview";
import { FigmaPreview } from "./FigmaPreview";
import { GitHubPreview } from "./GitHubPreview";

interface PreviewEngineProps {
  mimeType?: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  url?: string;
  token?: string;
  className?: string;
}

export function PreviewEngine({
  mimeType,
  fileName,
  fileUrl,
  fileSize,
  url,
  token,
  className = "",
}: PreviewEngineProps) {
  const mime = mimeType?.toLowerCase() || "";
  const ext = (fileName?.split(".").pop() || "").toLowerCase();

  if (url && !fileUrl) {
    if (url.includes("figma.com")) {
      return <FigmaPreview url={url} token={token} className={className} />;
    }
    if (url.includes("github.com")) {
      return <GitHubPreview url={url} className={className} />;
    }
    return <UrlPreview url={url} className={className} />;
  }

  if (fileUrl) {
    if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "svg", "webp", "gif", "bmp", "ico", "tiff", "tif"].includes(ext)) {
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

    if (["ai", "psd", "eps", "fig", "xd", "sketch"].includes(ext) || mime.includes("illustrator") || mime.includes("photoshop") || mime.includes("postscript")) {
      return <FallbackPreview mimeType={mimeType} fileName={fileName} fileUrl={fileUrl} fileSize={fileSize} className={className} />;
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
