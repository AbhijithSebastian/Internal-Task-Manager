import { Card } from "@/components/ui/Card";
import { ExternalLink, Github, Figma, Youtube, File as FileIcon, Globe, Play, FileText, Sheet, Monitor } from "lucide-react";

interface UrlPreviewProps {
  url: string;
  className?: string;
}

interface ParsedUrl {
  provider: string;
  icon: typeof Globe;
  color: string;
  title?: string;
  description?: string;
  embedUrl?: string;
  metadata: Record<string, string>;
}

function parseUrl(url: string): ParsedUrl {
  try {
    const u = new URL(url);
    const host = u.hostname.replace("www.", "");

    // GitHub
    if (host === "github.com") {
      const parts = u.pathname.replace(/^\/+/, "").split("/").filter(Boolean);
      if (parts.length >= 2) {
        const owner = parts[0];
        const repo = parts[1];
        const type = parts[2];
        const id = parts[3];

        if (type === "pull" && id) {
          return { provider: "GitHub Pull Request", icon: Github, color: "#0969da", metadata: { owner, repo, "PR #": id, url } };
        }
        if (type === "issues" && id) {
          return { provider: "GitHub Issue", icon: Github, color: "#0969da", metadata: { owner, repo, "Issue #": id, url } };
        }
        if (type === "tree" && id) {
          return { provider: "GitHub Branch", icon: Github, color: "#0969da", metadata: { owner, repo, branch: id, url } };
        }
        if (type === "commit" && id) {
          return { provider: "GitHub Commit", icon: Github, color: "#0969da", metadata: { owner, repo, commit: id.substring(0, 7), url } };
        }
        return { provider: "GitHub Repository", icon: Github, color: "#0969da", metadata: { owner, repo, url: `https://github.com/${owner}/${repo}` } };
      }
    }

    // Figma
    if (host.includes("figma.com")) {
      const segments = u.pathname.replace(/^\/+/, "").split("/").filter(Boolean);
      const first = segments[0] || "";
      const resourceTypes: Record<string, string> = {
        file: "File", design: "Design", proto: "Prototype", board: "FigJam", make: "Make",
      };
      const isDevMode = u.pathname.includes("dev-mode");
      const isFrame = u.hash.includes("node-id=");
      const fileId = segments[1] || null;
      let type = resourceTypes[first] || "File";
      if (isDevMode) type = "Dev Mode";
      else if (isFrame) type = "Frame";

      return {
        provider: `Figma ${type}`, icon: Figma, color: "#a259ff",
        embedUrl: fileId ? `https://www.figma.com/embed?embed_host=astra&url=${encodeURIComponent(url)}` : undefined,
        metadata: { ...(fileId ? { "File ID": fileId.substring(0, 8) + "..." } : {}), url },
      };
    }

    // YouTube
    if (host.includes("youtube.com") || host === "youtu.be") {
      const vid = u.searchParams.get("v") || u.pathname.slice(1);
      return {
        provider: "YouTube", icon: Youtube, color: "#ff0000",
        embedUrl: vid ? `https://www.youtube.com/embed/${vid}` : undefined,
        metadata: { ...(vid ? { "Video ID": vid } : {}), url },
      };
    }

    // Vimeo
    if (host.includes("vimeo.com")) {
      const vid = u.pathname.split("/").filter(Boolean)[0];
      return {
        provider: "Vimeo", icon: Play, color: "#1ab7ea",
        embedUrl: vid ? `https://player.vimeo.com/video/${vid}` : undefined,
        metadata: { ...(vid ? { "Video ID": vid } : {}), url },
      };
    }

    // Loom
    if (host.includes("loom.com")) {
      const shareId = u.pathname.replace("/share/", "");
      return {
        provider: "Loom", icon: Monitor, color: "#625df5",
        embedUrl: shareId ? `https://www.loom.com/embed/${shareId}` : undefined,
        metadata: { ...(shareId ? { "Share ID": shareId } : {}), url },
      };
    }

    // Google Drive
    if (host === "drive.google.com") {
      const fileId = u.pathname.match(/\/file\/d\/([^/]+)/)?.[1];
      return {
        provider: "Google Drive", icon: FileIcon, color: "#4285f4",
        embedUrl: fileId ? `https://drive.google.com/file/d/${fileId}/preview` : undefined,
        metadata: { ...(fileId ? { "File ID": fileId.substring(0, 8) + "..." } : {}), url },
      };
    }

    // Google Docs
    if (host === "docs.google.com") {
      const type = u.pathname.includes("document") ? "Document" : u.pathname.includes("spreadsheets") ? "Spreadsheet" : u.pathname.includes("presentation") ? "Slides" : "Document";
      const icon = type === "Document" ? FileText : type === "Spreadsheet" ? Sheet : type === "Slides" ? Monitor : FileIcon;
      const id = u.pathname.match(/\/d\/([^/]+)/)?.[1];
      return {
        provider: `Google ${type}`, icon, color: "#4285f4",
        embedUrl: id ? `https://docs.google.com/${u.pathname.includes("document") ? "document" : u.pathname.includes("spreadsheets") ? "spreadsheets" : "presentation"}/d/${id}/preview` : undefined,
        metadata: { ...(id ? { "ID": id.substring(0, 8) + "..." } : {}), url },
      };
    }

    // Notion
    if (host.includes("notion.so") || host.includes("notion.site")) {
      const parts = u.pathname.split("/").filter(Boolean);
      const pageId = parts[parts.length - 1]?.replace(/-/g, "");
      return {
        provider: "Notion", icon: FileText, color: "#000000",
        metadata: { ...(pageId && pageId.length > 10 ? { "Page ID": pageId.substring(0, 8) + "..." } : {}), url },
      };
    }

    // Generic fallback
    return {
      provider: host, icon: Globe, color: "#64748b",
      metadata: { url, host },
    };
  } catch {
    return { provider: "Invalid URL", icon: Globe, color: "#64748b", metadata: { url } };
  }
}

export function UrlPreview({ url, className = "" }: UrlPreviewProps) {
  const parsed = parseUrl(url);
  const Icon = parsed.icon;

  return (
    <Card className={`p-4 ${className}`}>
      <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 group">
        <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: parsed.color + "1a" }}>
          <Icon className="h-5 w-5" style={{ color: parsed.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-tertiary uppercase tracking-wider">{parsed.provider}</span>
            <ExternalLink className="h-3 w-3 text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-sm text-primary truncate mt-0.5">{parsed.title || new URL(url).hostname.replace("www.", "")}</p>
          {parsed.description && <p className="text-xs text-secondary mt-0.5 line-clamp-2">{parsed.description}</p>}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {Object.entries(parsed.metadata).filter(([k]) => k !== "url").map(([k, v]) => (
              <span key={k} className="text-xs text-tertiary">
                {k}: <span className="text-secondary">{v}</span>
              </span>
            ))}
          </div>
        </div>
      </a>
      {parsed.embedUrl && (
        <div className="mt-3 aspect-video rounded-lg overflow-hidden bg-subtle">
          <iframe src={parsed.embedUrl} className="w-full h-full" allowFullScreen title={parsed.provider} />
        </div>
      )}
    </Card>
  );
}
