import { useState, useEffect } from "react";
import { FileText, AlertCircle } from "lucide-react";
import { Skeleton } from "@/design-system";
import { useAuthenticatedResource } from "@/hooks/useAuthenticatedResource";

interface DocumentPreviewProps {
  mimeType?: string;
  fileUrl?: string;
  fileName?: string;
  className?: string;
}

function JsonViewer({ content }: { content: string }) {
  try {
    const parsed = JSON.parse(content);
    return (
      <pre className="max-h-full overflow-auto p-3 font-mono text-xs leading-relaxed text-primary">
        {JSON.stringify(parsed, null, 2)}
      </pre>
    );
  } catch {
    return (
      <pre className="max-h-full overflow-auto p-3 font-mono text-xs text-primary">{content}</pre>
    );
  }
}

function CsvViewer({ content }: { content: string }) {
  const lines = content.split("\n").filter(Boolean);
  const headers = lines[0]?.split(",").map((h) => h.trim()) || [];
  const rows = lines.slice(1).map((line) => line.split(",").map((c) => c.trim()));

  return (
    <div className="max-h-full overflow-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-subtle">
            {headers.map((h, i) => (
              <th
                key={i}
                className="whitespace-nowrap px-2 py-1.5 text-left font-medium text-tertiary"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-t border-subtle">
              {row.map((cell, ci) => (
                <td key={ci} className="whitespace-nowrap px-2 py-1 text-primary">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MarkdownViewer({ content }: { content: string }) {
  const html = content
    .replace(/^### (.+)$/gm, "<h3 class='text-sm font-semibold text-primary mt-3 mb-1'>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2 class='text-base font-semibold text-primary mt-4 mb-1'>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1 class='text-lg font-semibold text-primary mt-4 mb-2'>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code class='bg-subtle px-1 rounded text-xs'>$1</code>")
    .replace(/^- (.+)$/gm, "<li class='text-xs text-secondary ml-4 list-disc'>$1</li>")
    .replace(/^(\d+)\. (.+)$/gm, "<li class='text-xs text-secondary ml-4 list-decimal'>$1. $2</li>")
    .replace(/\n\n/g, "</p><p class='text-xs text-secondary mb-2'>")
    .replace(/^(.+)$/gm, (m) => {
      if (m.startsWith("<h") || m.startsWith("<li") || m.startsWith("<p") || m.startsWith("</"))
        return m;
      return `<p class='text-xs text-secondary mb-1'>${m}</p>`;
    });

  return (
    <div
      className="max-h-full overflow-auto p-3"
      dangerouslySetInnerHTML={{ __html: `<div>${html}</div>` }}
    />
  );
}

export function DocumentPreview({
  mimeType,
  fileUrl,
  fileName,
  className = "",
}: DocumentPreviewProps) {
  const mime = mimeType?.toLowerCase() || "";
  const ext = (fileName?.split(".").pop() || "").toLowerCase();
  const isPdf = mime.includes("pdf") || ext === "pdf";
  const isJson = mime.includes("json") || ext === "json";
  const isMd = mime.includes("markdown") || ext === "md" || ext === "markdown";
  const isTxt = mime.includes("text") || ext === "txt";
  const isCsv = ext === "csv";

  const {
    blobUrl,
    loading: blobLoading,
    error: blobError,
  } = useAuthenticatedResource(fileUrl && !isPdf ? fileUrl : null);

  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!blobUrl || isPdf) return;
    setLoading(true);
    setError(null);
    fetch(blobUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load: ${r.status}`);
        return r.text();
      })
      .then(setContent)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [blobUrl, isPdf]);

  if (isPdf && fileUrl) {
    return <PdfPreview fileUrl={fileUrl} fileName={fileName} className={className} />;
  }

  if (blobLoading || loading) {
    return (
      <div className={`flex items-center justify-center rounded-lg bg-subtle ${className}`}>
        <Skeleton variant="rect" className="h-full w-full" />
      </div>
    );
  }

  if (error || blobError) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-lg bg-subtle p-6 ${className}`}
      >
        <AlertCircle className="mb-2 h-8 w-8 text-tertiary" />
        <p className="text-sm text-secondary">Could not load preview</p>
        <p className="mt-1 text-xs text-tertiary">{error || blobError}</p>
      </div>
    );
  }

  if ((isJson || isTxt || isMd || isCsv) && content !== null) {
    return (
      <div className={`overflow-hidden rounded-lg bg-subtle ${className}`}>
        {isJson && <JsonViewer content={content} />}
        {isCsv && <CsvViewer content={content} />}
        {isMd && <MarkdownViewer content={content} />}
        {isTxt && (
          <pre className="max-h-full overflow-auto p-3 font-mono text-xs text-primary">
            {content}
          </pre>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg bg-subtle p-6 ${className}`}
    >
      <FileText className="mb-2 h-12 w-12 text-tertiary" />
      <p className="text-sm text-secondary">
        {isPdf
          ? "PDF Document"
          : isJson
            ? "JSON File"
            : isMd
              ? "Markdown File"
              : isTxt
                ? "Text File"
                : isCsv
                  ? "CSV File"
                  : "Document"}
      </p>
      {fileName && <p className="mt-1 max-w-full truncate text-xs text-tertiary">{fileName}</p>}
    </div>
  );
}

function PdfPreview({
  fileUrl,
  fileName,
  className,
}: {
  fileUrl: string;
  fileName?: string;
  className: string;
}) {
  const { blobUrl, loading, error } = useAuthenticatedResource(fileUrl);

  if (loading) {
    return (
      <div className={`flex items-center justify-center rounded-lg bg-subtle ${className}`}>
        <Skeleton variant="rect" className="h-full w-full" />
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-lg bg-subtle p-6 ${className}`}
      >
        <AlertCircle className="mb-2 h-8 w-8 text-tertiary" />
        <p className="text-sm text-secondary">Could not load PDF</p>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-lg bg-subtle ${className}`}
    >
      <iframe src={blobUrl} className="h-full w-full" title={fileName || "PDF"} />
    </div>
  );
}
