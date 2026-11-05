import { File, FileText, FileImage, FileArchive, FileCode, Download, ExternalLink, Layers, PenTool, Box } from "lucide-react";
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
  if (mime.includes("json") || ext === "json" || ext === "xml" || ext === "yaml" || ext === "yml") return FileCode;
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
  if (ext === "psd") return "text-[#31a8ff]";
  if (ext === "ai") return "text-[#ff9a00]";
  if (ext === "fig") return "text-[#a259ff]";
  if (ext === "xd") return "text-[#ff61f6]";
  if (ext === "sketch") return "text-[#f7b731]";
  if (ext === "eps") return "text-[#6b7280]";
  if (mime.includes("pdf")) return "text-[#ff0000]";
  if (mime.includes("zip") || mime.includes("rar") || mime.includes("tar")) return "text-[#f59e0b]";
  if (mime.includes("json") || ext === "json") return "text-[#10b981]";
  return "text-tertiary";
}

function getFileBgColor(mime: string, ext: string): string {
  if (ext === "psd") return "bg-[#31a8ff]/10";
  if (ext === "ai") return "bg-[#ff9a00]/10";
  if (ext === "fig") return "bg-[#a259ff]/10";
  if (ext === "xd") return "bg-[#ff61f6]/10";
  if (ext === "sketch") return "bg-[#f7b731]/10";
  if (ext === "eps") return "bg-[#6b7280]/10";
  if (mime.includes("pdf")) return "bg-[#ff0000]/10";
  if (mime.includes("zip") || mime.includes("rar") || mime.includes("tar")) return "bg-[#f59e0b]/10";
  if (mime.includes("json") || ext === "json") return "bg-[#10b981]/10";
  return "bg-subtle";
}

function getFileTypeLabel(mime: string, ext: string): string {
  const labels: Record<string, string> = {
    psd: "Photoshop Document", ai: "Illustrator File", eps: "PostScript File",
    fig: "Figma File", xd: "Adobe XD File", sketch: "Sketch File",
    zip: "Archive", rar: "Archive", "7z": "Archive", tar: "Archive", gz: "Archive",
  };
  if (labels[ext]) return labels[ext];
  if (mime.includes("pdf")) return "PDF Document";
  if (mime.includes("json")) return "JSON File";
  if (mime.includes("zip")) return "Archive";
  return mime || ext.toUpperCase() || "File";
}

function AuthenticatedDownload({ fileUrl, fileName, className }: { fileUrl: string; fileName?: string; className?: string }) {
  const { fetchDownload } = useAuthenticatedResource(fileUrl);

  return (
    <button
      onClick={() => fetchDownload(fileName)}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-surface border border-default text-primary hover:bg-hover transition-colors ${className || ""}`}
    >
      <Download className="h-3.5 w-3.5" /> Download
    </button>
  );
}

export function FallbackPreview({ mimeType, fileName, fileUrl, fileSize, className = "" }: FallbackPreviewProps) {
  const mime = mimeType?.toLowerCase() || "";
  const ext = (fileName?.split(".").pop() || "").toLowerCase();
  const Icon = getFileIcon(mime, ext);
  const color = getFileColor(mime, ext);
  const bgColor = getFileBgColor(mime, ext);
  const typeLabel = getFileTypeLabel(mime, ext);

  return (
    <div className={`flex flex-col items-center justify-center bg-subtle rounded-lg p-8 ${className}`}>
      <div className={`w-16 h-16 rounded-xl ${bgColor} border border-default flex items-center justify-center mb-4`}>
        <Icon className={`h-8 w-8 ${color}`} />
      </div>
      {fileName && (
        <p className="text-sm font-medium text-primary text-center truncate max-w-full">{fileName}</p>
      )}
      <div className="flex items-center gap-3 mt-1 text-xs text-tertiary">
        <span>{typeLabel}</span>
        {fileSize && <span>{formatFileSize(fileSize)}</span>}
      </div>
      {fileUrl && (
        <div className="flex items-center gap-2 mt-4">
          <AuthenticatedDownload fileUrl={fileUrl} fileName={fileName} />
          <button
            onClick={() => {
              const token = localStorage.getItem("access_token");
              fetch(fileUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
                .then(r => r.blob())
                .then(blob => {
                  const url = URL.createObjectURL(blob);
                  window.open(url, "_blank");
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                })
                .catch(() => window.open(fileUrl, "_blank"));
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-surface border border-default text-primary hover:bg-hover transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open
          </button>
        </div>
      )}
    </div>
  );
}
