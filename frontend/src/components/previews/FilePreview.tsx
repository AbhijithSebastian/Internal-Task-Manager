import {
  FileText, FileSpreadsheet, FileArchive, FileCode,
  File, Video, Music, Package, Image,
} from "lucide-react";

interface FilePreviewProps {
  mimeType?: string;
  fileName?: string;
  fileUrl?: string;
  className?: string;
}

export function FilePreview({ mimeType, fileName, fileUrl, className = "" }: FilePreviewProps) {
  const mime = mimeType?.toLowerCase() || "";
  const ext = (fileName?.split(".").pop() || "").toLowerCase();

  // Images
  if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "svg", "webp", "gif", "bmp"].includes(ext)) {
    if (fileUrl) {
      return (
        <div className={`flex items-center justify-center bg-subtle rounded-lg overflow-hidden ${className}`}>
          <img src={fileUrl} alt={fileName || ""} className="max-w-full max-h-full object-contain" />
        </div>
      );
    }
    return <FileIconPreview icon={Image} label="Image file" className={className} />;
  }

  // Videos
  if (mime.startsWith("video/") || ["mp4", "mov", "avi", "webm", "mkv"].includes(ext)) {
    if (fileUrl) {
      return (
        <div className={`flex items-center justify-center bg-subtle rounded-lg overflow-hidden ${className}`}>
          <video controls className="max-w-full max-h-full">
            <source src={fileUrl} type={mime || "video/mp4"} />
          </video>
        </div>
      );
    }
    return <FileIconPreview icon={Video} label="Video file" className={className} />;
  }

  // Audio
  if (mime.startsWith("audio/") || ["mp3", "wav", "ogg", "flac", "aac"].includes(ext)) {
    if (fileUrl) {
      return (
        <div className={`flex flex-col items-center justify-center bg-subtle rounded-lg p-6 ${className}`}>
          <Music className="h-12 w-12 text-tertiary mb-3" />
          <audio controls className="w-full max-w-sm">
            <source src={fileUrl} type={mime || "audio/mpeg"} />
          </audio>
        </div>
      );
    }
    return <FileIconPreview icon={Music} label="Audio file" className={className} />;
  }

  // PDF
  if (mime.includes("pdf") || ext === "pdf") {
    if (fileUrl) {
      return (
        <div className={`flex items-center justify-center bg-subtle rounded-lg overflow-hidden ${className}`}>
          <iframe src={fileUrl} className="w-full h-full" title={fileName || "PDF"} />
        </div>
      );
    }
    return <FileIconPreview icon={FileText} label="PDF document" className={className} />;
  }

  // Code / Dev files
  if (["json", "yaml", "yml", "xml", "md", "txt"].includes(ext)) {
    return <FileIconPreview icon={FileCode} label={`${ext.toUpperCase()} file`} className={className} />;
  }

  // ZIP / Archives
  if (mime.includes("zip") || mime.includes("rar") || mime.includes("tar") || mime.includes("7z") || mime.includes("gzip") || ["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return <FileIconPreview icon={FileArchive} label="Archive" className={className} />;
  }

  // APK
  if (mime.includes("android") || ext === "apk") {
    return <FileIconPreview icon={Package} label="Android Package" className={className} />;
  }

  // Office documents
  if (mime.includes("spreadsheet") || mime.includes("excel") || ["xls", "xlsx", "csv"].includes(ext)) {
    return <FileIconPreview icon={FileSpreadsheet} label="Spreadsheet" className={className} />;
  }
  if (mime.includes("presentation") || ["ppt", "pptx"].includes(ext)) {
    return <FileIconPreview icon={Monitor} label="Presentation" className={className} />;
  }
  if (mime.includes("word") || mime.includes("document") || ["doc", "docx"].includes(ext)) {
    return <FileIconPreview icon={FileText} label="Document" className={className} />;
  }

  // Generic fallback
  return <FileIconPreview icon={File} label={mimeType || "Unknown file"} className={className} />;
}

function FileIconPreview({ icon: Icon, label, className }: { icon: typeof File; label: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center bg-subtle rounded-lg p-8 ${className || ""}`}>
      <Icon className="h-16 w-16 text-tertiary" />
      <p className="mt-3 text-sm text-secondary">{label}</p>
    </div>
  );
}

// Re-export Monitor for presentation type
import { Monitor } from "lucide-react";
