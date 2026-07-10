import { useState, useEffect } from "react";
import { FileText, Download, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

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
      <pre className="text-xs text-primary overflow-auto max-h-full p-3 font-mono leading-relaxed">
        {JSON.stringify(parsed, null, 2)}
      </pre>
    );
  } catch {
    return <pre className="text-xs text-primary overflow-auto max-h-full p-3 font-mono">{content}</pre>;
  }
}

function CsvViewer({ content }: { content: string }) {
  const lines = content.split("\n").filter(Boolean);
  const headers = lines[0]?.split(",").map((h) => h.trim()) || [];
  const rows = lines.slice(1).map((line) => line.split(",").map((c) => c.trim()));

  return (
    <div className="overflow-auto max-h-full">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-subtle">
            {headers.map((h, i) => (
              <th key={i} className="px-2 py-1.5 text-left text-tertiary font-medium whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-t border-subtle">
              {row.map((cell, ci) => (
                <td key={ci} className="px-2 py-1 text-primary whitespace-nowrap">{cell}</td>
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
      if (m.startsWith("<h") || m.startsWith("<li") || m.startsWith("<p") || m.startsWith("</")) return m;
      return `<p class='text-xs text-secondary mb-1'>${m}</p>`;
    });

  return (
    <div className="overflow-auto max-h-full p-3" dangerouslySetInnerHTML={{ __html: `<div>${html}</div>` }} />
  );
}

export function DocumentPreview({ mimeType, fileUrl, fileName, className = "" }: DocumentPreviewProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mime = mimeType?.toLowerCase() || "";
  const ext = (fileName?.split(".").pop() || "").toLowerCase();
  const isPdf = mime.includes("pdf") || ext === "pdf";
  const isJson = mime.includes("json") || ext === "json";
  const isMd = mime.includes("markdown") || ext === "md" || ext === "markdown";
  const isTxt = mime.includes("text") || ext === "txt";
  const isCsv = ext === "csv";

  useEffect(() => {
    if (!fileUrl || isPdf) return;
    setLoading(true);
    setError(null);
    fetch(fileUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load: ${r.status}`);
        return r.text();
      })
      .then(setContent)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [fileUrl, isPdf]);

  if (isPdf && fileUrl) {
    return (
      <div className={`flex items-center justify-center bg-subtle rounded-lg overflow-hidden ${className}`}>
        <iframe src={fileUrl} className="w-full h-full" title={fileName || "PDF"} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-subtle rounded-lg ${className}`}>
        <Skeleton variant="rect" className="w-full h-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-subtle rounded-lg p-6 ${className}`}>
        <AlertCircle className="h-8 w-8 text-tertiary mb-2" />
        <p className="text-sm text-secondary">Could not load preview</p>
        <p className="text-xs text-tertiary mt-1">{error}</p>
      </div>
    );
  }

  if ((isJson || isTxt || isMd || isCsv) && content !== null) {
    return (
      <div className={`bg-subtle rounded-lg overflow-hidden ${className}`}>
        {isJson && <JsonViewer content={content} />}
        {isCsv && <CsvViewer content={content} />}
        {isMd && <MarkdownViewer content={content} />}
        {isTxt && <pre className="text-xs text-primary overflow-auto max-h-full p-3 font-mono">{content}</pre>}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center bg-subtle rounded-lg p-6 ${className}`}>
      <FileText className="h-12 w-12 text-tertiary mb-2" />
      <p className="text-sm text-secondary">
        {isPdf ? "PDF Document" : isJson ? "JSON File" : isMd ? "Markdown File" : isTxt ? "Text File" : isCsv ? "CSV File" : "Document"}
      </p>
      {fileName && <p className="text-xs text-tertiary mt-1 truncate max-w-full">{fileName}</p>}
      {fileUrl && (
        <a href={fileUrl} download className="mt-3 inline-flex items-center gap-1.5 text-xs text-link hover:underline">
          <Download className="h-3.5 w-3.5" /> Download
        </a>
      )}
    </div>
  );
}
