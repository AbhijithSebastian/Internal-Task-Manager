import { FileText, FileSpreadsheet, Monitor, ExternalLink } from "lucide-react";
import { useAuthenticatedResource } from "@/hooks/useAuthenticatedResource";

interface OfficePreviewProps {
  mimeType?: string;
  fileName?: string;
  fileUrl?: string;
  className?: string;
}

export function OfficePreview({ mimeType, fileName, fileUrl, className = "" }: OfficePreviewProps) {
  const mime = mimeType?.toLowerCase() || "";
  const ext = (fileName?.split(".").pop() || "").toLowerCase();

  const isDoc = mime.includes("word") || mime.includes("document") || ["doc", "docx"].includes(ext);
  const isSheet =
    mime.includes("spreadsheet") || mime.includes("excel") || ["xls", "xlsx"].includes(ext);
  const isSlide = mime.includes("presentation") || ["ppt", "pptx"].includes(ext);

  const Icon = isDoc ? FileText : isSheet ? FileSpreadsheet : isSlide ? Monitor : FileText;
  const label = isDoc
    ? "Word Document"
    : isSheet
      ? "Spreadsheet"
      : isSlide
        ? "Presentation"
        : "Office Document";
  const color = isDoc
    ? "text-brand-office-word"
    : isSheet
      ? "text-brand-office-excel"
      : isSlide
        ? "text-brand-office-powerpoint"
        : "text-tertiary";
  const bgColor = isDoc
    ? "brand-tint"
    : isSheet
      ? "brand-tint"
      : isSlide
        ? "brand-tint"
        : "bg-subtle";

  return (
    <div
      className={`border-default flex items-start gap-4 rounded-lg border bg-subtle p-4 ${className}`}
    >
      <div
        className={`h-12 w-12 shrink-0 rounded-lg ${bgColor} ${color} flex items-center justify-center`}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-primary">{fileName || label}</p>
        <p className="mt-0.5 text-xs text-tertiary">{label}</p>
        <p className="mt-1 text-xs text-tertiary">
          Preview not available for this format. Download the file to view it.
        </p>
        <div className="mt-3 flex items-center gap-2">
          {fileUrl && <OfficeDownload fileUrl={fileUrl} fileName={fileName} />}
          {fileUrl && (
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
          )}
        </div>
      </div>
    </div>
  );
}

function OfficeDownload({ fileUrl, fileName }: { fileUrl: string; fileName?: string }) {
  const { fetchDownload } = useAuthenticatedResource(fileUrl);

  return (
    <button
      onClick={() => fetchDownload(fileName)}
      className="border-default inline-flex items-center gap-1.5 rounded-md border bg-surface px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-hover"
    >
      Download
    </button>
  );
}
