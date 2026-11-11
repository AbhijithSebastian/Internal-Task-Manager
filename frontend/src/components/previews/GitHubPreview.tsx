import { Badge, Button, Card } from "@/design-system";
import {
  Github,
  ExternalLink,
  GitBranch,
  GitPullRequest,
  GitCommitHorizontal,
  AlertCircle,
} from "lucide-react";

interface GitHubPreviewProps {
  url: string;
  className?: string;
}

interface GitHubMeta {
  type: "repository" | "pull-request" | "issue" | "commit" | "branch";
  owner: string;
  repo: string;
  id?: string;
}

function parseGitHubUrl(url: string): GitHubMeta | null {
  try {
    const u = new URL(url);
    if (u.hostname !== "github.com") return null;
    const parts = u.pathname.replace(/^\/+/, "").split("/").filter(Boolean);
    if (parts.length < 2) return null;
    const owner = parts[0];
    const repo = parts[1];
    const type = parts[2];
    const id = parts[3];

    if (type === "pull" && id) return { type: "pull-request", owner, repo, id };
    if (type === "issues" && id) return { type: "issue", owner, repo, id };
    if (type === "commit" && id) return { type: "commit", owner, repo, id: id.substring(0, 7) };
    if (type === "tree" && id) return { type: "branch", owner, repo, id };
    return { type: "repository", owner, repo };
  } catch {
    return null;
  }
}

const typeConfig: Record<string, { icon: typeof Github; label: string }> = {
  repository: { icon: Github, label: "Repository" },
  "pull-request": { icon: GitPullRequest, label: "Pull Request" },
  issue: { icon: AlertCircle, label: "Issue" },
  commit: { icon: GitCommitHorizontal, label: "Commit" },
  branch: { icon: GitBranch, label: "Branch" },
};

export function GitHubPreview({ url, className = "" }: GitHubPreviewProps) {
  const meta = parseGitHubUrl(url);
  if (!meta) {
    return (
      <Card className={`p-4 ${className}`}>
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
          <Github className="h-5 w-5 text-tertiary" />
          <span className="truncate text-sm text-link hover:underline">{url}</span>
        </a>
      </Card>
    );
  }

  const cfg = typeConfig[meta.type];
  const Icon = cfg.icon;

  return (
    <Card className={`p-4 ${className}`}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-start gap-3"
      >
        <div className="brand-tint flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-brand-github">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-tertiary">
              GitHub {cfg.label}
            </span>
            <ExternalLink className="h-3 w-3 text-tertiary opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <p className="mt-0.5 truncate text-sm font-medium text-primary">
            {meta.owner}/{meta.repo}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Badge variant="neutral" size="sm">
              {meta.owner}
            </Badge>
            <Badge variant="default" size="sm">
              {meta.repo}
            </Badge>
            {meta.id && (
              <Badge variant="info" size="sm">
                #{meta.id}
              </Badge>
            )}
          </div>
          <div className="mt-2">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="secondary">
                <ExternalLink className="h-3.5 w-3.5" /> Open on GitHub
              </Button>
            </a>
          </div>
        </div>
      </a>
    </Card>
  );
}
