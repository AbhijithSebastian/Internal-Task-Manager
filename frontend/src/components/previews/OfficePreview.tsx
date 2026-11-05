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
  const isSheet = mime.includes("spreadsheet") || mime.includes("excel") || ["xls", "xlsx"].includes(ext);
  const isSlide = mime.includes("presentation") || ["ppt", "pptx"].includes(ext);

  const Icon = isDoc ? FileText : isSheet ? FileSpreadsheet : isSlide ? Monitor : FileText;
  const label = isDoc ? "Word Document" : isSheet ? "Spreadsheet" : isSlide ? "Presentation" : "Office Document";
  const color = isDoc ? "text-[#2b5797]" : isSheet ? "text-[#217346]" : isSlide ? "text-[#d24726]" : "text-tertiary";
  const bgColor = isDoc ? "bg-[#2b5797]/10" : isSheet ? "bg-[#217346]/10" : isSlide ? "bg-[#d24726]/10" : "bg-subtle";

  return (
    <div className={`flex items-start gap-4 p-4 rounded-lg bg-subtle border border-default ${className}`}>
      <div className={`shrink-0 w-12 h-12 rounded-lg ${bgColor} flex items-center justify-center`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-primary truncate">{fileName || label}</p>
        <p className="text-xs text-tertiary mt-0.5">{label}</p>
        <p className="text-xs text-tertiary mt-1">
          Preview not available for this format. Download the file to view it.
        </p>
        <div className="flex items-center gap-2 mt-3">
          {fileUrl && <OfficeDownload fileUrl={fileUrl} fileName={fileName} />}
          {fileUrl && (
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
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-surface border border-default text-primary hover:bg-hover transition-colors"
    >
      Download
    </button>
  );
}
