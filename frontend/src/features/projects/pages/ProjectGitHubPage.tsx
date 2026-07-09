import { useState } from "react";
import { useParams } from "react-router-dom";
import { useProject } from "@/features/projects/hooks/useProject";
import { GitHubPreview } from "@/components/previews/GitHubPreview";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Github, GitBranch, GitCommitHorizontal, GitPullRequest, AlertCircle } from "lucide-react";

export default function ProjectGitHubPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project } = useProject(projectId);
  const [showConnect, setShowConnect] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [token, setToken] = useState("");

  const githubUrl = project?.github_url;
  const isConnected = !!githubUrl;

  if (!projectId) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary">GitHub</h2>
          <p className="text-sm text-tertiary">
            {isConnected ? "Connected to GitHub" : "Not connected"}
          </p>
        </div>
        {!isConnected && (
          <Button size="sm" onClick={() => setShowConnect(!showConnect)}>
            <Github className="h-4 w-4" /> Connect GitHub
          </Button>
        )}
      </div>

      {showConnect && !isConnected && (
        <Card>
          <h3 className="text-sm font-semibold text-primary mb-3">Connect GitHub Repository</h3>
          <div className="space-y-3">
            <Input
              label="Repository URL"
              placeholder="https://github.com/owner/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
            />
            <Input
              label="Personal Access Token (optional)"
              type="password"
              placeholder="ghp_..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <Button size="sm" onClick={() => setShowConnect(false)}>
              <Github className="h-4 w-4" /> Connect
            </Button>
          </div>
        </Card>
      )}

      {isConnected ? (
        <>
          <GitHubPreview url={githubUrl!} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={GitBranch} label="Branches" value="—" />
            <StatCard icon={GitCommitHorizontal} label="Commits" value="—" />
            <StatCard icon={GitPullRequest} label="Pull Requests" value="—" />
            <StatCard icon={AlertCircle} label="Issues" value="—" />
          </div>
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-tertiary" />
              <p className="text-sm text-tertiary">Connect a GitHub Personal Access Token for detailed repository statistics.</p>
            </div>
          </Card>
        </>
      ) : (
        <EmptyState
          icon={<Github className="h-12 w-12" />}
          title="GitHub not connected"
          description="Connect a GitHub repository to see commits, pull requests, issues, and deployment information."
          action={
            <Button size="sm" onClick={() => setShowConnect(true)}>
              <Github className="h-4 w-4" /> Connect GitHub
            </Button>
          }
        />
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Github; label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <div className="shrink-0 w-8 h-8 rounded-lg bg-subtle flex items-center justify-center">
          <Icon className="h-4 w-4 text-tertiary" />
        </div>
        <div>
          <p className="text-lg font-semibold text-primary">{value}</p>
          <p className="text-xs text-tertiary">{label}</p>
        </div>
      </div>
    </Card>
  );
}
