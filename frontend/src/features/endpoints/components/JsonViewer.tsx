import { useState, useCallback } from "react";
import { Copy, Check, ChevronDown, ChevronRight } from "lucide-react";

interface JsonViewerProps {
  data: unknown;
  collapsed?: boolean;
  maxHeight?: string;
  className?: string;
}

export function JsonViewer({ data, collapsed = false, maxHeight, className = "" }: JsonViewerProps) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const [copied, setCopied] = useState(false);

  const formatted = formatJson(data);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(typeof data === "string" ? data : JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [data]);

  if (!data || (typeof data === "object" && Object.keys(data as object).length === 0)) {
    return <span className="text-xs text-tertiary italic">Empty</span>;
  }

  return (
    <div className={`relative rounded-md bg-subtle border border-default ${className}`}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-default">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1 text-xs text-tertiary hover:text-primary"
        >
          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {isCollapsed ? "Expand" : "Collapse"}
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-tertiary hover:text-primary"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {!isCollapsed && (
        <pre
          className="p-3 text-xs text-primary font-mono overflow-x-auto whitespace-pre-wrap"
          style={maxHeight ? { maxHeight, overflowY: "auto" } : undefined}
        >
          {formatted}
        </pre>
      )}
    </div>
  );
}

function formatJson(data: unknown): string {
  if (typeof data === "string") {
    try {
      return JSON.stringify(JSON.parse(data), null, 2);
    } catch {
      return data;
    }
  }
  return JSON.stringify(data, null, 2);
}
