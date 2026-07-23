import { useQuery } from "@tanstack/react-query";
import { proxyApi } from "@/services/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Figma, ExternalLink, AlertCircle, Lock } from "lucide-react";
import { formatRelative } from "@/utils/formatters";

interface FigmaPreviewProps {
  url: string;
  token?: string;
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

export function FigmaPreview({ url, token, className = "" }: FigmaPreviewProps) {
  const meta = parseFigmaUrl(url);
  const typeLabel = meta?.isDevMode ? "Dev Mode" : meta?.isPrototype ? "Prototype" : meta?.isFrame ? "Frame" : "File";
  const embedUrl = meta?.fileId ? `https://www.figma.com/embed?embed_host=opencode&url=${encodeURIComponent(url)}` : null;

  const { data: figmaMeta, isLoading, isError, error } = useQuery({
    queryKey: ["figma-meta", meta?.fileId],
    queryFn: async () => {
      if (!meta?.fileId) throw new Error("Invalid Figma URL");
      const params = new URLSearchParams();
      if (token) params.set("token", token);
      const qs = params.toString();
      const res = await proxyApi.get(`/figma/files/${meta.fileId}${qs ? `?${qs}` : ""}`);
      return res.data as {
        name: string;
        owner?: { name?: string };
        lastModified?: string;
        pages?: Array<{ name?: string }>;
        thumbnailUrl?: string;
      } | null;
    },
    enabled: !!meta?.fileId,
    staleTime: 60_000,
    retry: 1,
  });

  const embedError = error as Error | null;
  const figmaFile = isLoading ? null : figmaMeta;

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-lg bg-[#a259ff]/10 flex items-center justify-center">
          <Figma className="h-5 w-5 text-[#a259ff]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-tertiary uppercase tracking-wider">Figma {typeLabel}</span>
            <Badge variant="info" size="sm">{typeLabel}</Badge>
          </div>
          {isLoading ? (
            <div className="mt-1 space-y-1">
              <Skeleton variant="rect" className="h-4 w-48" />
              <Skeleton variant="rect" className="h-3 w-32" />
            </div>
          ) : figmaFile?.name ? (
            <p className="text-sm text-primary truncate mt-0.5">{figmaFile.name}</p>
          ) : (
            <p className="text-sm text-primary truncate mt-0.5">Figma Design</p>
          )}
          <a href={url} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="mt-2">
              <ExternalLink className="h-3.5 w-3.5" /> Open in Figma
            </Button>
          </a>
        </div>
      </div>

      {meta?.fileId && embedUrl && (
        <div className="mt-3 rounded-lg overflow-hidden border border-default">
          <iframe
            src={embedUrl}
            className="w-full h-48 md:h-72"
            allowFullScreen
            title="Figma Preview"
          />
          <div className="flex items-center gap-4 p-2.5 bg-subtle border-t border-default text-xs text-tertiary">
            {isLoading ? (
              <Skeleton variant="rect" className="h-3 w-full" />
            ) : figmaFile ? (
              <>
                <span>Pages: {figmaFile.pages?.length ?? "—"}</span>
                <span>Owner: {figmaFile.owner?.name ?? "—"}</span>
                <span>Updated: {figmaFile.lastModified ? formatRelative(figmaFile.lastModified) : "—"}</span>
              </>
            ) : (
              <>
                <span>Pages: —</span>
                <span>Owner: —</span>
                <span>Updated: —</span>
              </>
            )}
          </div>
        </div>
      )}

      {!meta?.fileId && (
        <div className="mt-3 p-3 rounded-lg bg-subtle border border-default flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-tertiary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-primary">Invalid Figma URL</p>
            <p className="text-xs text-tertiary mt-0.5">The URL does not appear to be a valid Figma file link.</p>
          </div>
        </div>
      )}

      {isError && meta?.fileId && (
        <div className="mt-3 p-3 rounded-lg bg-subtle border border-default flex items-start gap-2.5">
          <Lock className="h-4 w-4 text-tertiary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-primary">Preview Unavailable</p>
            <p className="text-xs text-tertiary mt-0.5">
              {embedError?.message?.includes("403") || embedError?.message?.includes("401")
                ? token
                  ? "Authentication failed. The token may be invalid or expired."
                  : "This file is private or requires authentication. Add a Figma API token in the project settings."
                : embedError?.message?.includes("404")
                ? "This file was not found. It may have been deleted or the URL is incorrect."
                : embedError?.message?.includes("429")
                ? "API rate limit exceeded. Please wait a moment and try again."
                : "Could not load file metadata. The embedded preview is still available above."}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
