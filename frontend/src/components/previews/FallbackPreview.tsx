import {
  File,
  FileText,
  FileImage,
  FileArchive,
  FileCode,
  Download,
  ExternalLink,
  Layers,
  PenTool,
  Box,
} from "lucide-react";
import { formatFileSize } from "@/utils/formatters";
import { useAuthenticatedResource } from "@/hooks/useAuthenticatedResource";

interface FallbackPreviewProps {
  mimeType?: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  className?: string;
}

function getFileIcon(mime: string, ext: string) {
  if (mime.startsWith("image/")) return FileImage;
  if (mime.startsWith("video/") || mime.startsWith("audio/")) return File;
  if (mime.includes("pdf")) return FileText;
  if (mime.includes("zip") || mime.includes("rar") || mime.includes("tar")) return FileArchive;
  if (mime.includes("json") || ext === "json" || ext === "xml" || ext === "yaml" || ext === "yml")
    return FileCode;
  if (mime.includes("text")) return FileText;
  if (mime.includes("spreadsheet") || mime.includes("excel")) return FileText;
  if (mime.includes("word") || mime.includes("document")) return FileText;
  if (mime.includes("presentation")) return FileText;
  if (ext === "psd") return Layers;
  if (ext === "ai") return PenTool;
  if (ext === "fig") return Layers;
  if (ext === "xd") return Box;
  if (ext === "sketch") return PenTool;
  if (ext === "eps") return FileText;
  if (["ai", "psd", "eps", "fig", "xd", "sketch"].includes(ext)) return FileImage;
  return File;
}

function getFileColor(mime: string, ext: string): string {
  if (ext === "psd") return "text-brand-photoshop";
  if (ext === "ai") return "text-brand-illustrator";
  if (ext === "fig") return "text-brand-figma";
  if (ext === "xd") return "text-brand-adobe-xd";
  if (ext === "sketch") return "text-brand-sketch";
  if (ext === "eps") return "text-brand-file-generic";
  if (mime.includes("pdf")) return "text-brand-file-pdf";
  if (mime.includes("zip") || mime.includes("rar") || mime.includes("tar"))
    return "text-brand-file-archive";
  if (mime.includes("json") || ext === "json") return "text-brand-file-data";
  return "text-tertiary";
}

function getFileBgColor(mime: string, ext: string): string {
  if (ext === "psd") return "brand-tint";
  if (ext === "ai") return "brand-tint";
  if (ext === "fig") return "brand-tint";
  if (ext === "xd") return "brand-tint";
  if (ext === "sketch") return "brand-tint";
  if (ext === "eps") return "brand-tint";
  if (mime.includes("pdf")) return "brand-tint";
  if (mime.includes("zip") || mime.includes("rar") || mime.includes("tar")) return "brand-tint";
  if (mime.includes("json") || ext === "json") return "brand-tint";
  return "bg-subtle";
}

function getFileTypeLabel(mime: string, ext: string): string {
  const labels: Record<string, string> = {
    psd: "Photoshop Document",
    ai: "Illustrator File",
    eps: "PostScript File",
    fig: "Figma File",
    xd: "Adobe XD File",
    sketch: "Sketch File",
    zip: "Archive",
    rar: "Archive",
    "7z": "Archive",
    tar: "Archive",
    gz: "Archive",
  };
  if (labels[ext]) return labels[ext];
  if (mime.includes("pdf")) return "PDF Document";
  if (mime.includes("json")) return "JSON File";
  if (mime.includes("zip")) return "Archive";
  return mime || ext.toUpperCase() || "File";
}

function AuthenticatedDownload({
  fileUrl,
  fileName,
  className,
}: {
  fileUrl: string;
  fileName?: string;
  className?: string;
}) {
  const { fetchDownload } = useAuthenticatedResource(fileUrl);

  return (
    <button
      onClick={() => fetchDownload(fileName)}
      className={`border-default inline-flex items-center gap-1.5 rounded-md border bg-surface px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-hover ${className || ""}`}
    >
      <Download className="h-3.5 w-3.5" /> Download
    </button>
  );
}

export function FallbackPreview({
  mimeType,
  fileName,
  fileUrl,
  fileSize,
  className = "",
}: FallbackPreviewProps) {
  const mime = mimeType?.toLowerCase() || "";
  const ext = (fileName?.split(".").pop() || "").toLowerCase();
  const Icon = getFileIcon(mime, ext);
  const color = getFileColor(mime, ext);
  const bgColor = getFileBgColor(mime, ext);
  const typeLabel = getFileTypeLabel(mime, ext);

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg bg-subtle p-8 ${className}`}
    >
      <div
        className={`h-16 w-16 rounded-xl ${bgColor} ${color} border-default mb-4 flex items-center justify-center border`}
      >
        <Icon className="h-8 w-8" />
      </div>
      {fileName && (
        <p className="max-w-full truncate text-center text-sm font-medium text-primary">
          {fileName}
        </p>
      )}
      <div className="mt-1 flex items-center gap-3 text-xs text-tertiary">
        <span>{typeLabel}</span>
        {fileSize && <span>{formatFileSize(fileSize)}</span>}
      </div>
      {fileUrl && (
        <div className="mt-4 flex items-center gap-2">
          <AuthenticatedDownload fileUrl={fileUrl} fileName={fileName} />
          <button
            onClick={() => {
              const token = localStorage.getItem("access_token");
              fetch(fileUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
                .then((r) => r.blob())
                .then((blob) => {
                  const url = URL.createObjectURL(blob);
                  window.open(url, "_blank");
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                })
                .catch(() => window.open(fileUrl, "_blank"));
            }}
            className="border-default inline-flex items-center gap-1.5 rounded-md border bg-surface px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-hover"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open
          </button>
        </div>
      )}
    </div>
  );
}
