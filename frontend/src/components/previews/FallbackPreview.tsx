import { File, FileText, FileImage, FileArchive, FileCode, Download, ExternalLink } from "lucide-react";

interface FallbackPreviewProps {
  mimeType?: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  className?: string;
}

function formatSize(bytes?: number): string {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit++;
  }
  return `${size.toFixed(1)} ${units[unit]}`;
}

function getFileIcon(mime: string, ext: string) {
  if (mime.startsWith("image/")) return FileImage;
  if (mime.startsWith("video/") || mime.startsWith("audio/")) return File;
  if (mime.includes("pdf")) return FileText;
  if (mime.includes("zip") || mime.includes("rar") || mime.includes("tar")) return FileArchive;
  if (mime.includes("json") || ext === "json" || ext === "xml" || ext === "yaml" || ext === "yml") return FileCode;
  if (mime.includes("text")) return FileText;
  if (mime.includes("spreadsheet") || mime.includes("excel")) return FileText;
  if (mime.includes("word") || mime.includes("document")) return FileText;
  if (mime.includes("presentation")) return FileText;
  return File;
}

export function FallbackPreview({ mimeType, fileName, fileUrl, fileSize, className = "" }: FallbackPreviewProps) {
  const mime = mimeType?.toLowerCase() || "";
  const ext = (fileName?.split(".").pop() || "").toLowerCase();
  const Icon = getFileIcon(mime, ext);

  return (
    <div className={`flex flex-col items-center justify-center bg-subtle rounded-lg p-8 ${className}`}>
      <div className="w-16 h-16 rounded-xl bg-surface border border-default flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-tertiary" />
      </div>
      {fileName && (
        <p className="text-sm font-medium text-primary text-center truncate max-w-full">{fileName}</p>
      )}
      <div className="flex items-center gap-3 mt-1 text-xs text-tertiary">
        <span>{mimeType || ext.toUpperCase() || "Unknown file type"}</span>
        {fileSize && <span>{formatSize(fileSize)}</span>}
      </div>
      {fileUrl && (
        <div className="flex items-center gap-2 mt-4">
          <a
            href={fileUrl}
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-surface border border-default text-primary hover:bg-hover transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </a>
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-surface border border-default text-primary hover:bg-hover transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open
          </a>
        </div>
      )}
    </div>
  );
}
