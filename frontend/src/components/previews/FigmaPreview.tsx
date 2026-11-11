import { useQuery } from "@tanstack/react-query";
import { proxyApi } from "@/services/api";
import { Badge, Button, Card, Skeleton } from "@/design-system";
import { Figma, ExternalLink, AlertCircle, Lock } from "lucide-react";
import { formatRelative } from "@/utils/formatters";
import { useAuthenticatedResource } from "@/hooks/useAuthenticatedResource";

interface FigmaPreviewProps {
  url: string;
  token?: string;
  className?: string;
}

interface FigmaMeta {
  fileId: string | null;
  resourceType: "file" | "design" | "proto" | "board" | "make" | "unknown";
  nodeId: string | null;
  title: string | null;
}

function parseFigmaUrl(url: string): FigmaMeta | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("figma.com")) return null;

    const segments = u.pathname.replace(/^\/+/, "").split("/").filter(Boolean);
    const first = segments[0] || "";

    if (
      first === "file" ||
      first === "proto" ||
      first === "design" ||
      first === "board" ||
      first === "make"
    ) {
      const fileId = segments[1] || null;
      const title = segments.slice(2).join("/").replace(/\/+$/, "") || null;
      const nodeId = u.hash.includes("node-id=")
        ? u.hash.split("node-id=")[1]?.split("&")[0]?.replace(/-/g, ":") || null
        : null;
      return { fileId, resourceType: first as FigmaMeta["resourceType"], nodeId, title };
    }

    if (first === "board" || first === "make") {
      const fileId = segments[1] || null;
      return {
        fileId,
        resourceType: first,
        nodeId: null,
        title: segments.slice(2).join("/").replace(/\/+$/, "") || null,
      };
    }

    const fileMatch = u.pathname.match(/\/(file|proto|design|board|make)\/([^/]+)/);
    if (fileMatch) {
      return {
        fileId: fileMatch[2],
        resourceType: fileMatch[1] as FigmaMeta["resourceType"],
        nodeId: null,
        title: null,
      };
    }

    const communityMatch = u.pathname.match(/\/community\/(\d+)/);
    if (communityMatch) {
      return {
        fileId: null,
        resourceType: "unknown",
        nodeId: null,
        title: `Community #${communityMatch[1]}`,
      };
    }

    return null;
  } catch {
    return null;
  }
}

const RESOURCE_LABELS: Record<string, string> = {
  file: "File",
  design: "Design",
  proto: "Prototype",
  board: "FigJam",
  make: "Make",
  unknown: "Figma",
};

const RESOURCE_COLORS: Record<string, string> = {
  file: "text-brand-figma",
  design: "text-brand-figma",
  proto: "text-brand-figma-proto",
  board: "text-brand-figma-board",
  make: "text-brand-figma-make",
  unknown: "text-brand-figma",
};

export function FigmaPreview({ url, token, className = "" }: FigmaPreviewProps) {
  const meta = parseFigmaUrl(url);
  const resourceLabel = RESOURCE_LABELS[meta?.resourceType || "unknown"];
  const bgColor = RESOURCE_COLORS[meta?.resourceType || "unknown"];
  const embedUrl = meta?.fileId
    ? `https://www.figma.com/embed?embed_host=opencode&url=${encodeURIComponent(url)}`
    : null;

  const {
    data: figmaMeta,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["figma-meta", meta?.fileId, token],
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

  const thumbnailApiUrl = figmaFile?.thumbnailUrl
    ? `/api/v1/figma/thumbnail?url=${encodeURIComponent(figmaFile.thumbnailUrl)}${token ? `&token=${encodeURIComponent(token)}` : ""}`
    : null;
  const { blobUrl: thumbnailBlob } = useAuthenticatedResource(thumbnailApiUrl);

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div
          className={`brand-tint h-10 w-10 shrink-0 rounded-lg ${bgColor} flex items-center justify-center`}
        >
          <Figma className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-tertiary">
              Figma {resourceLabel}
            </span>
            <Badge variant="info" size="sm">
              {resourceLabel}
            </Badge>
            {meta?.nodeId && (
              <Badge variant="neutral" size="sm">
                Frame
              </Badge>
            )}
          </div>
          {isLoading ? (
            <div className="mt-1 space-y-1">
              <Skeleton variant="rect" className="h-4 w-48" />
              <Skeleton variant="rect" className="h-3 w-32" />
            </div>
          ) : figmaFile?.name ? (
            <p className="mt-0.5 truncate text-sm text-primary">{figmaFile.name}</p>
          ) : meta?.title ? (
            <p className="mt-0.5 truncate text-sm text-primary">{meta.title}</p>
          ) : (
            <p className="mt-0.5 truncate text-sm text-primary">Figma {resourceLabel}</p>
          )}
          <a href={url} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="mt-2">
              <ExternalLink className="h-3.5 w-3.5" /> Open in Figma
            </Button>
          </a>
        </div>
      </div>

      {thumbnailBlob && (
        <div className="border-default mt-3 overflow-hidden rounded-lg border bg-subtle">
          <img
            src={thumbnailBlob}
            alt={figmaFile?.name || "Figma thumbnail"}
            className="h-48 w-full object-contain md:h-72"
          />
        </div>
      )}

      {!thumbnailBlob && meta?.fileId && embedUrl && (
        <div className="border-default mt-3 overflow-hidden rounded-lg border">
          <iframe
            src={embedUrl}
            className="h-48 w-full md:h-72"
            allowFullScreen
            title="Figma Preview"
          />
        </div>
      )}

      {meta?.fileId && (
        <div className="border-default flex items-center gap-4 border-t bg-subtle p-2.5 text-xs text-tertiary">
          {isLoading ? (
            <Skeleton variant="rect" className="h-3 w-full" />
          ) : figmaFile ? (
            <>
              <span>Pages: {figmaFile.pages?.length ?? "—"}</span>
              <span>Owner: {figmaFile.owner?.name ?? "—"}</span>
              <span>
                Updated: {figmaFile.lastModified ? formatRelative(figmaFile.lastModified) : "—"}
              </span>
            </>
          ) : (
            <>
              <span>Pages: —</span>
              <span>Owner: —</span>
              <span>Updated: —</span>
            </>
          )}
        </div>
      )}

      {!meta?.fileId && (
        <div className="border-default mt-3 flex items-start gap-2.5 rounded-lg border bg-subtle p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-tertiary" />
          <div>
            <p className="text-sm font-medium text-primary">Invalid Figma URL</p>
            <p className="mt-0.5 text-xs text-tertiary">
              The URL does not appear to be a valid Figma file link.
            </p>
          </div>
        </div>
      )}

      {isError && meta?.fileId && (
        <div className="border-default mt-3 flex items-start gap-2.5 rounded-lg border bg-subtle p-3">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-tertiary" />
          <div>
            <p className="text-sm font-medium text-primary">Preview Unavailable</p>
            <p className="mt-0.5 text-xs text-tertiary">
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
