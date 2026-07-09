import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Figma, ExternalLink, AlertCircle } from "lucide-react";

interface FigmaPreviewProps {
  url: string;
  className?: string;
}

interface FigmaMeta {
  fileId: string | null;
  isPrototype: boolean;
  isDevMode: boolean;
  isFrame: boolean;
}

function parseFigmaUrl(url: string): FigmaMeta | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("figma.com")) return null;
    const fileMatch = u.pathname.match(/\/(file|proto|design)\/([^/]+)/);
    const fileId = fileMatch?.[2] || null;
    return {
      fileId,
      isPrototype: u.pathname.includes("proto"),
      isDevMode: u.pathname.includes("dev-mode"),
      isFrame: u.hash.includes("node-id="),
    };
  } catch {
    return null;
  }
}

export function FigmaPreview({ url, className = "" }: FigmaPreviewProps) {
  const meta = parseFigmaUrl(url);
  const typeLabel = meta?.isDevMode ? "Dev Mode" : meta?.isPrototype ? "Prototype" : meta?.isFrame ? "Frame" : "File";

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-lg bg-[#a259ff]/10 flex items-center justify-center">
          <Figma className="h-5 w-5 text-[#a259ff]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-tertiary uppercase tracking-wider">Figma {typeLabel}</span>
          </div>
          <p className="text-sm text-primary truncate mt-0.5">Figma Design</p>
          <div className="flex items-center gap-2 mt-2">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="secondary">
                <ExternalLink className="h-3.5 w-3.5" /> Open in Figma
              </Button>
            </a>
          </div>
          {meta?.fileId && (
            <div className="flex items-center gap-2 mt-2 text-xs text-tertiary">
              <AlertCircle className="h-3 w-3" />
              <span>Preview requires Figma API access. Click to open in Figma.</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
