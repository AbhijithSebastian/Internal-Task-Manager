import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, proxyApi } from "@/services/api";
import { useProject } from "@/features/projects/hooks/useProject";
import { EnterpriseEmptyState } from "@/components/shared/EnterpriseEmptyState";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Github, ExternalLink, GitBranch, GitCommitHorizontal, GitPullRequest, AlertCircle, Star, GitFork, CheckCircle2, Eye, Unlink, RefreshCw, Users, Code2, Package } from "lucide-react";
import { formatRelative } from "@/utils/formatters";

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/\s?#]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

type Tab = "overview" | "commits" | "pulls" | "issues" | "branches" | "releases" | "contributors" | "languages";

export default function ProjectGitHubPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const queryClient = useQueryClient();
  const { data: project } = useProject(projectId);
  const [showConnect, setShowConnect] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [token, setToken] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [connectError, setConnectError] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  const connectMutation = useMutation({
    mutationFn: async (url: string) => {
      if (!url.trim()) throw new Error("URL is required");
      try {
        const parsed = new URL(url);
        if (!parsed.hostname.includes("github.com")) throw new Error("Not a GitHub URL");
      } catch (e) {
        throw new Error((e as Error).message.includes("Not a") ? "Not a GitHub URL" : "Invalid URL format");
      }
      const info = parseGitHubUrl(url);
      if (!info) throw new Error("Could not parse repository owner and name from URL");

      if (token) {
        try {
          const test = await proxyApi.get(`/github/repos/${info.owner}/${info.repo}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!test.data) throw new Error("Repository not found");
        } catch (e: unknown) {
          const err = e as { response?: { data?: { message?: string }; status?: number } };
          const ghMessage = err.response?.data?.message;
          if (ghMessage) throw new Error(`GitHub: ${ghMessage}`);
          if (err.response?.status === 404) throw new Error("Repository not found. Check the URL and your access permissions.");
          throw new Error("Could not validate repository access. The URL will still be saved.");
        }
      }
      return api.put(`/projects/${projectId}`, { github_url: url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-activity", projectId] });
      if (token) {
        sessionStorage.setItem(`github_token_${projectId}`, token);
      }
      setShowConnect(false);
      setRepoUrl("");
      setToken("");
      setConnectError(null);
    },
    onError: (err: Error) => {
      setConnectError(err.message);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => api.put(`/projects/${projectId}`, { github_url: "" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      sessionStorage.removeItem(`github_token_${projectId}`);
      setActiveTab("overview");
    },
  });

  const githubUrl = project?.github_url;
  const repoInfo = githubUrl ? parseGitHubUrl(githubUrl) : null;
  const isConnected = !!githubUrl && !!repoInfo;

  const storedToken = isConnected ? sessionStorage.getItem(`github_token_${projectId}`) : null;
  const authHeaders: Record<string, string> = storedToken ? { Authorization: `Bearer ${storedToken}` } : {};

  const { data: repoData, isLoading: repoLoading } = useQuery({
    queryKey: ["github-repo", repoInfo?.owner, repoInfo?.repo],
    queryFn: async () => {
      if (!repoInfo) return null;
      const res = await proxyApi.get(`/github/repos/${repoInfo.owner}/${repoInfo.repo}`, { headers: authHeaders });
      return res.data as {
        name: string;
        full_name: string;
        owner: { login: string; avatar_url: string };
        private: boolean;
        language: string | null;
        description: string | null;
        default_branch: string;
        stargazers_count: number;
        forks_count: number;
        subscribers_count: number;
        updated_at: string;
        pushed_at: string;
      } | null;
    },
    enabled: isConnected,
    staleTime: 60_000,
  });

  const { data: commitsData, isLoading: commitsLoading } = useQuery({
    queryKey: ["github-commits", repoInfo?.owner, repoInfo?.repo, selectedBranch],
    queryFn: async () => {
      if (!repoInfo) return null;
      const branch = selectedBranch || repoData?.default_branch || "main";
      const res = await proxyApi.get(`/github/repos/${repoInfo.owner}/${repoInfo.repo}/commits`, {
        params: { sha: branch, per_page: 20 },
        headers: authHeaders,
      });
      return res.data as Array<{
        sha: string;
        commit: { message: string; author: { name: string; date: string } };
        author: { login: string; avatar_url: string } | null;
      }> | null;
    },
    enabled: !!repoInfo && activeTab === "commits",
    staleTime: 30_000,
  });

  const { data: pullsData, isLoading: pullsLoading } = useQuery({
    queryKey: ["github-pulls", repoInfo?.owner, repoInfo?.repo],
    queryFn: async () => {
      if (!repoInfo) return null;
      const res = await proxyApi.get(`/github/repos/${repoInfo.owner}/${repoInfo.repo}/pulls`, {
        params: { state: "open", per_page: 20 },
        headers: authHeaders,
      });
      return res.data as Array<{
        id: number;
        number: number;
        title: string;
        state: string;
        user: { login: string };
        created_at: string;
        requested_reviewers: Array<{ login: string }>;
        merged_at: string | null;
      }> | null;
    },
    enabled: !!repoInfo && activeTab === "pulls",
    staleTime: 30_000,
  });

  const { data: issuesData, isLoading: issuesLoading } = useQuery({
    queryKey: ["github-issues", repoInfo?.owner, repoInfo?.repo],
    queryFn: async () => {
      if (!repoInfo) return null;
      const res = await proxyApi.get(`/github/repos/${repoInfo.owner}/${repoInfo.repo}/issues`, {
        params: { state: "open", per_page: 20, filter: "all" },
        headers: authHeaders,
      });
      return res.data as Array<{
        id: number;
        number: number;
        title: string;
        state: string;
        user: { login: string };
        created_at: string;
        labels: Array<{ name: string; color: string }>;
        pull_request?: unknown;
      }> | null;
    },
    enabled: !!repoInfo && activeTab === "issues",
    staleTime: 30_000,
  });

  const { data: branchesData, isLoading: branchesLoading } = useQuery({
    queryKey: ["github-branches", repoInfo?.owner, repoInfo?.repo],
    queryFn: async () => {
      if (!repoInfo) return null;
      const res = await proxyApi.get(`/github/repos/${repoInfo.owner}/${repoInfo.repo}/branches`, {
        params: { per_page: 50 },
        headers: authHeaders,
      });
      return res.data as Array<{
        name: string;
        commit: { sha: string };
        protected: boolean;
      }> | null;
    },
    enabled: !!repoInfo && (activeTab === "branches" || activeTab === "commits"),
    staleTime: 30_000,
  });

  const { data: releasesData, isLoading: releasesLoading } = useQuery({
    queryKey: ["github-releases", repoInfo?.owner, repoInfo?.repo],
    queryFn: async () => {
      if (!repoInfo) return null;
      const res = await proxyApi.get(`/github/repos/${repoInfo.owner}/${repoInfo.repo}/releases`, {
        params: { per_page: 20 },
        headers: authHeaders,
      });
      return res.data as Array<{
        id: number;
        tag_name: string;
        name: string | null;
        body: string | null;
        prerelease: boolean;
        created_at: string;
        html_url: string;
      }> | null;
    },
    enabled: !!repoInfo && activeTab === "releases",
    staleTime: 30_000,
  });

  const { data: contributorsData, isLoading: contributorsLoading } = useQuery({
    queryKey: ["github-contributors", repoInfo?.owner, repoInfo?.repo],
    queryFn: async () => {
      if (!repoInfo) return null;
      const res = await proxyApi.get(`/github/repos/${repoInfo.owner}/${repoInfo.repo}/contributors`, {
        params: { per_page: 30 },
        headers: authHeaders,
      });
      return res.data as Array<{
        login: string;
        avatar_url: string;
        contributions: number;
      }> | null;
    },
    enabled: !!repoInfo && activeTab === "contributors",
    staleTime: 60_000,
  });

  const { data: languagesData, isLoading: languagesLoading } = useQuery({
    queryKey: ["github-languages", repoInfo?.owner, repoInfo?.repo],
    queryFn: async () => {
      if (!repoInfo) return null;
      const res = await proxyApi.get(`/github/repos/${repoInfo.owner}/${repoInfo.repo}/languages`, {
        headers: authHeaders,
      });
      return res.data as Record<string, number> | null;
    },
    enabled: !!repoInfo && activeTab === "languages",
    staleTime: 60_000,
  });

  useEffect(() => {
    if (repoData?.default_branch) {
      setSelectedBranch(repoData.default_branch);
    }
  }, [repoInfo?.owner, repoInfo?.repo, repoData?.default_branch]);

  if (!projectId) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "commits", label: "Commits" },
    { id: "branches", label: "Branches" },
    { id: "pulls", label: "Pull Requests" },
    { id: "issues", label: "Issues" },
    { id: "releases", label: "Releases" },
    { id: "contributors", label: "Contributors" },
    { id: "languages", label: "Languages" },
  ];

  const renderTabContent = () => {
    if (repoLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rect" className="h-12 w-full rounded-lg" />)}
        </div>
      );
    }

    switch (activeTab) {
      case "overview":
        return <RepoOverview repoInfo={repoInfo!} repoData={repoData} />;
      case "commits":
        return <CommitsSection commits={commitsData} isLoading={commitsLoading} repoInfo={repoInfo!} branches={branchesData} selectedBranch={selectedBranch} onSelectBranch={setSelectedBranch} />;
      case "branches":
        return <BranchesSection branches={branchesData} isLoading={branchesLoading} repoInfo={repoInfo!} />;
      case "pulls":
        return <PullRequestSection pulls={pullsData} isLoading={pullsLoading} repoInfo={repoInfo!} />;
      case "issues":
        return <IssueSection issues={issuesData} isLoading={issuesLoading} repoInfo={repoInfo!} />;
      case "releases":
        return <ReleasesSection releases={releasesData} isLoading={releasesLoading} />;
      case "contributors":
        return <ContributorsSection contributors={contributorsData} isLoading={contributorsLoading} />;
      case "languages":
        return <LanguagesSection languages={languagesData} isLoading={languagesLoading} />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary">GitHub</h2>
          <p className="text-sm text-tertiary">
            {isConnected ? `${repoInfo!.owner}/${repoInfo!.repo}` : "Not connected"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isConnected && (
            <>
              <Button size="sm" variant="secondary" onClick={() => { queryClient.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).startsWith("github") }); }}>
                <RefreshCw className="h-3.5 w-3.5" /> Sync
              </Button>
              <Button size="sm" variant="secondary" onClick={() => window.open(githubUrl, "_blank")}>
                <ExternalLink className="h-3.5 w-3.5" /> Open on GitHub
              </Button>
              <Button size="sm" variant="secondary" onClick={() => { setShowConnect(true); setRepoUrl(githubUrl || ""); setToken(storedToken || ""); setConnectError(null); }}>
                <Github className="h-3.5 w-3.5" /> Change
              </Button>
              <Button size="sm" variant="secondary" onClick={() => disconnectMutation.mutate()} loading={disconnectMutation.isPending}>
                <Unlink className="h-3.5 w-3.5" /> Disconnect
              </Button>
            </>
          )}
          {!isConnected && (
            <Button size="sm" onClick={() => setShowConnect(!showConnect)}>
              <Github className="h-4 w-4" /> Connect GitHub
            </Button>
          )}
        </div>
      </div>

      {showConnect && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-primary">{isConnected ? "Update GitHub Repository" : "Connect GitHub Repository"}</h3>
            <Button size="sm" variant="secondary" onClick={() => { setShowConnect(false); setConnectError(null); }}>
              Cancel
            </Button>
          </div>
          <div className="space-y-3">
            <Input
              label="Repository URL"
              placeholder="https://github.com/owner/repo"
              value={repoUrl}
              onChange={(e) => { setRepoUrl(e.target.value); setConnectError(null); }}
              error={connectError || undefined}
            />
            <Input
              label="Personal Access Token (optional, for private repos / API access)"
              type="password"
              placeholder="ghp_..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            {connectError && (
              <p className="text-xs text-danger flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {connectError}
              </p>
            )}
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => connectMutation.mutate(repoUrl)} loading={connectMutation.isPending} disabled={!repoUrl.trim()}>
                <Github className="h-4 w-4" /> {isConnected ? "Update" : "Connect"}
              </Button>
              {isConnected && (
                <p className="text-xs text-tertiary">Leave token blank to use existing stored token.</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {isConnected ? (
        <>
          <div className="flex items-center gap-1 border-b border-default">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  activeTab === t.id
                    ? "border-primary text-primary"
                    : "border-transparent text-tertiary hover:text-secondary"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {renderTabContent()}
        </>
      ) : (
        <EnterpriseEmptyState
          icon={<Github className="h-12 w-12" />}
          title="GitHub not connected"
          description="Connect a GitHub repository to see commits, pull requests, issues, and deployment information."
          primaryAction={{ label: "Connect GitHub", onClick: () => setShowConnect(true) }}
        />
      )}
    </div>
  );
}

function RepoOverview({ repoInfo, repoData }: {
  repoInfo: { owner: string; repo: string };
  repoData: Record<string, unknown> | null | undefined;
}) {
  const hasData = !!repoData;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Star} label="Stars" value={hasData ? String((repoData as any)?.stargazers_count ?? 0) : "—"} />
        <StatCard icon={GitFork} label="Forks" value={hasData ? String((repoData as any)?.forks_count ?? 0) : "—"} />
        <StatCard icon={Eye} label="Watchers" value={hasData ? String((repoData as any)?.subscribers_count ?? 0) : "—"} />
        <StatCard icon={GitBranch} label="Default Branch" value={hasData ? String((repoData as any)?.default_branch ?? "—") : "—"} />
      </div>

      <Card>
        <h3 className="text-sm font-semibold text-primary mb-3">Repository</h3>
        {hasData ? (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Github className="h-4 w-4 text-tertiary" />
              <a href={`https://github.com/${repoInfo.owner}/${repoInfo.repo}`} target="_blank" rel="noopener noreferrer" className="text-link hover:underline">
                {(repoData as any).full_name || `${repoInfo.owner}/${repoInfo.repo}`}
              </a>
            </div>
            {(repoData as any).description && (
              <p className="text-xs text-tertiary">{(repoData as any).description}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs text-tertiary">
              {(repoData as any).language && <span>Language: {(repoData as any).language}</span>}
              <span>Visibility: {(repoData as any).private ? "Private" : "Public"}</span>
              {(repoData as any).updated_at && <span>Updated: {formatRelative((repoData as any).updated_at)}</span>}
              {(repoData as any).pushed_at && <span>Latest push: {formatRelative((repoData as any).pushed_at)}</span>}
            </div>
          </div>
        ) : (
          <p className="text-sm text-tertiary">
            No repository data available. Add a GitHub Personal Access Token to fetch repository details.
          </p>
        )}
      </Card>
    </div>
  );
}

function CommitsSection({ commits, isLoading, repoInfo, branches, selectedBranch, onSelectBranch }: {
  commits: Array<{ sha: string; commit: { message: string; author: { name: string; date: string } }; author: { login: string; avatar_url: string } | null }> | null | undefined;
  isLoading: boolean;
  repoInfo: { owner: string; repo: string };
  branches: Array<{ name: string; commit: { sha: string }; protected: boolean }> | null | undefined;
  selectedBranch: string | null;
  onSelectBranch: (b: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rect" className="h-12 w-full rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {branches && branches.length > 0 && (
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-tertiary" />
          <select
            value={selectedBranch || ""}
            onChange={(e) => onSelectBranch(e.target.value)}
            className="text-sm border border-default rounded-lg bg-surface px-2.5 py-1.5 text-primary"
          >
            {branches.map((b) => (
              <option key={b.name} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>
      )}

      {!commits || commits.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <GitCommitHorizontal className="h-8 w-8 text-tertiary mb-2" />
          <p className="text-sm text-tertiary">No commits found on this branch.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {commits.map((c) => (
            <a
              key={c.sha}
              href={`https://github.com/${repoInfo.owner}/${repoInfo.repo}/commit/${c.sha}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-2.5 rounded-lg border border-default bg-surface hover:bg-hover transition-colors no-underline"
            >
              <GitCommitHorizontal className="h-4 w-4 text-tertiary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-primary truncate">{c.commit.message.split("\n")[0]}</p>
                <div className="flex items-center gap-2 text-xs text-tertiary">
                  <span>{c.author?.login || c.commit.author.name}</span>
                  <span>{c.sha.slice(0, 7)}</span>
                  <span>{formatRelative(c.commit.author.date)}</span>
                </div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-tertiary shrink-0" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function PullRequestSection({ pulls, isLoading, repoInfo }: {
  pulls: Array<{ id: number; number: number; title: string; state: string; user: { login: string }; created_at: string; requested_reviewers: Array<{ login: string }>; merged_at: string | null }> | null | undefined;
  isLoading: boolean;
  repoInfo: { owner: string; repo: string };
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rect" className="h-12 w-full rounded-lg" />)}
      </div>
    );
  }

  if (!pulls || pulls.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <GitPullRequest className="h-8 w-8 text-tertiary mb-2" />
        <p className="text-sm text-tertiary">No open pull requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {pulls.map((pr) => (
        <a
          key={pr.id}
          href={`https://github.com/${repoInfo.owner}/${repoInfo.repo}/pull/${pr.number}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-2.5 rounded-lg border border-default bg-surface hover:bg-hover transition-colors no-underline"
        >
          <GitPullRequest className={`h-4 w-4 shrink-0 ${
            pr.merged_at ? "text-[#a371f7]" : pr.state === "closed" ? "text-[#f85149]" : "text-[#3fb950]"
          }`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm text-primary truncate">{pr.title}</span>
              <Badge size="sm" variant={pr.state === "open" ? "success" : pr.merged_at ? "info" : "danger"}>
                {pr.merged_at ? "merged" : pr.state}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-tertiary mt-0.5">
              <span>#{pr.number}</span>
              <span>by {pr.user.login}</span>
              <span>{formatRelative(pr.created_at)}</span>
              {pr.requested_reviewers?.length > 0 && (
                <span>{pr.requested_reviewers.length} reviewer{pr.requested_reviewers.length !== 1 ? "s" : ""}</span>
              )}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

function IssueSection({ issues, isLoading, repoInfo }: {
  issues: Array<{ id: number; number: number; title: string; state: string; user: { login: string }; created_at: string; labels: Array<{ name: string; color: string }>; pull_request?: unknown }> | null | undefined;
  isLoading: boolean;
  repoInfo: { owner: string; repo: string };
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rect" className="h-12 w-full rounded-lg" />)}
      </div>
    );
  }

  const actualIssues = issues?.filter((i) => !i.pull_request) || [];

  if (actualIssues.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <AlertCircle className="h-8 w-8 text-tertiary mb-2" />
        <p className="text-sm text-tertiary">No open issues.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {actualIssues.map((issue) => (
        <a
          key={issue.id}
          href={`https://github.com/${repoInfo.owner}/${repoInfo.repo}/issues/${issue.number}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-2.5 rounded-lg border border-default bg-surface hover:bg-hover transition-colors no-underline"
        >
          {issue.state === "closed" ? (
            <CheckCircle2 className="h-4 w-4 text-[#f85149] shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-[#3fb950] shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm text-primary truncate">{issue.title}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-tertiary mt-0.5">
              <span>#{issue.number}</span>
              <span>by {issue.user.login}</span>
              <span>{formatRelative(issue.created_at)}</span>
              {issue.labels?.map((l) => (
                <span key={l.name} className="px-1.5 py-0.5 rounded bg-subtle text-xs">{l.name}</span>
              ))}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

function BranchesSection({ branches, isLoading, repoInfo }: {
  branches: Array<{ name: string; commit: { sha: string }; protected: boolean }> | null | undefined;
  isLoading: boolean;
  repoInfo: { owner: string; repo: string };
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rect" className="h-10 w-full rounded-lg" />)}
      </div>
    );
  }

  if (!branches || branches.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <GitBranch className="h-8 w-8 text-tertiary mb-2" />
        <p className="text-sm text-tertiary">No branches found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {branches.map((b) => (
        <a
          key={b.name}
          href={`https://github.com/${repoInfo.owner}/${repoInfo.repo}/tree/${b.name}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-2.5 rounded-lg border border-default bg-surface hover:bg-hover transition-colors no-underline"
        >
          <GitBranch className="h-4 w-4 text-tertiary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-primary font-medium">{b.name}</p>
            <p className="text-xs text-tertiary">{b.commit.sha.slice(0, 7)}</p>
          </div>
          {b.protected && <Badge size="sm" variant="info">protected</Badge>}
          <ExternalLink className="h-3.5 w-3.5 text-tertiary shrink-0" />
        </a>
      ))}
    </div>
  );
}

function ReleasesSection({ releases, isLoading }: {
  releases: Array<{ id: number; tag_name: string; name: string | null; body: string | null; prerelease: boolean; created_at: string; html_url: string }> | null | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rect" className="h-16 w-full rounded-lg" />)}
      </div>
    );
  }

  if (!releases || releases.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <Package className="h-8 w-8 text-tertiary mb-2" />
        <p className="text-sm text-tertiary">No releases found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {releases.map((r) => (
        <a
          key={r.id}
          href={r.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col gap-1 p-3 rounded-lg border border-default bg-surface hover:bg-hover transition-colors no-underline"
        >
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-tertiary shrink-0" />
            <span className="text-sm text-primary font-medium">{r.name || r.tag_name}</span>
            {r.prerelease && <Badge size="sm" variant="warning">pre-release</Badge>}
          </div>
          <div className="flex items-center gap-2 text-xs text-tertiary ml-6">
            <span>{r.tag_name}</span>
            <span>{formatRelative(r.created_at)}</span>
          </div>
          {r.body && (
            <p className="text-xs text-tertiary ml-6 line-clamp-2">{r.body}</p>
          )}
        </a>
      ))}
    </div>
  );
}

function ContributorsSection({ contributors, isLoading }: {
  contributors: Array<{ login: string; avatar_url: string; contributions: number }> | null | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} variant="rect" className="h-12 w-full rounded-lg" />)}
      </div>
    );
  }

  if (!contributors || contributors.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <Users className="h-8 w-8 text-tertiary mb-2" />
        <p className="text-sm text-tertiary">No contributors found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {contributors.map((c) => (
        <a
          key={c.login}
          href={`https://github.com/${c.login}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-2.5 rounded-lg border border-default bg-surface hover:bg-hover transition-colors no-underline"
        >
          <img src={c.avatar_url} alt={c.login} className="w-8 h-8 rounded-full shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-primary font-medium">{c.login}</p>
          </div>
          <span className="text-xs text-tertiary tabular-nums">{c.contributions} commit{c.contributions !== 1 ? "s" : ""}</span>
        </a>
      ))}
    </div>
  );
}

function LanguagesSection({ languages, isLoading }: {
  languages: Record<string, number> | null | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rect" className="h-10 w-full rounded-lg" />)}
      </div>
    );
  }

  if (!languages || Object.keys(languages).length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <Code2 className="h-8 w-8 text-tertiary mb-2" />
        <p className="text-sm text-tertiary">No language data available.</p>
      </div>
    );
  }

  const total = Object.values(languages).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-2">
      <div className="flex h-2 rounded-full overflow-hidden bg-subtle">
        {Object.entries(languages).map(([lang, bytes]) => (
          <div
            key={lang}
            style={{ width: `${(bytes / total) * 100}%` }}
            className="h-full bg-primary"
            title={`${lang}: ${((bytes / total) * 100).toFixed(1)}%`}
          />
        ))}
      </div>
      <div className="space-y-1.5">
        {Object.entries(languages)
          .sort(([, a], [, b]) => b - a)
          .map(([lang, bytes]) => {
            const pct = ((bytes / total) * 100).toFixed(1);
            return (
              <div key={lang} className="flex items-center justify-between p-2 rounded-lg border border-default bg-surface">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-sm text-primary">{lang}</span>
                </div>
                <span className="text-xs text-tertiary tabular-nums">{pct}%</span>
              </div>
            );
          })}
      </div>
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
          <p className="text-lg font-semibold text-primary tabular-nums">{value}</p>
          <p className="text-xs text-tertiary">{label}</p>
        </div>
      </div>
    </Card>
  );
}
