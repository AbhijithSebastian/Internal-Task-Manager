import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, proxyApi } from "@/services/api";
import { useProject } from "@/features/projects/hooks/useProject";
import { EnterpriseEmptyState } from "@/components/shared/EnterpriseEmptyState";
import { Badge, Button, Card, Input, Skeleton } from "@/design-system";
import { useClipboard } from "@/hooks/useClipboard";
import {
  Github,
  ExternalLink,
  GitBranch,
  GitCommitHorizontal,
  GitPullRequest,
  AlertCircle,
  Star,
  GitFork,
  Eye,
  Unlink,
  RefreshCw,
  Users,
  Code2,
  Package,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Shield,
  Tag,
  Globe,
  HardDrive,
  Clock,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { formatRelative, formatNum, formatFileSize } from "@/utils/formatters";

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/\s?#]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

type Tab =
  | "overview"
  | "commits"
  | "branches"
  | "pulls"
  | "issues"
  | "releases"
  | "contributors"
  | "languages";

const PER_PAGE = 20;

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
  const [page, setPage] = useState<Record<Tab, number>>({
    overview: 1,
    commits: 1,
    branches: 1,
    pulls: 1,
    issues: 1,
    releases: 1,
    contributors: 1,
    languages: 1,
  });

  const setPageFor = (tab: Tab, p: number) => setPage((prev) => ({ ...prev, [tab]: p }));

  const connectMutation = useMutation({
    mutationFn: async (url: string) => {
      if (!url.trim()) throw new Error("URL is required");
      try {
        const parsed = new URL(url);
        if (!parsed.hostname.includes("github.com")) throw new Error("Not a GitHub URL");
      } catch (e) {
        throw new Error(
          (e as Error).message.includes("Not a") ? "Not a GitHub URL" : "Invalid URL format",
        );
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
          if (err.response?.status === 404)
            throw new Error("Repository not found. Check the URL and your access permissions.");
          if (err.response?.status === 403)
            throw new Error(
              "GitHub API rate limit exceeded or access denied. Try adding a Personal Access Token.",
            );
          throw new Error("Could not validate repository access. The URL will still be saved.");
        }
      }
      return api.put(`/projects/${projectId}`, { github_url: url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-activity", projectId] });
      if (token) sessionStorage.setItem(`github_token_${projectId}`, token);
      setShowConnect(false);
      setRepoUrl("");
      setToken("");
      setConnectError(null);
    },
    onError: (err: Error) => setConnectError(err.message),
  });

  const disconnectMutation = useMutation({
    mutationFn: () => api.put(`/projects/${projectId}`, { github_url: "" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      sessionStorage.removeItem(`github_token_${projectId}`);
      setActiveTab("overview");
      setSelectedBranch(null);
    },
  });

  const githubUrl = project?.github_url;
  const repoInfo = githubUrl ? parseGitHubUrl(githubUrl) : null;
  const isConnected = !!githubUrl && !!repoInfo;
  const storedToken = isConnected ? sessionStorage.getItem(`github_token_${projectId}`) : null;
  const authHeaders: Record<string, string> = storedToken
    ? { Authorization: `Bearer ${storedToken}` }
    : {};

  const refreshGitHub = useCallback(() => {
    queryClient.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).startsWith("github") });
  }, [queryClient]);

  const {
    data: repoData,
    isLoading: repoLoading,
    error: repoError,
  } = useQuery({
    queryKey: ["github-repo", repoInfo?.owner, repoInfo?.repo],
    queryFn: async () => {
      if (!repoInfo) return null;
      const res = await proxyApi.get(`/github/repos/${repoInfo.owner}/${repoInfo.repo}`, {
        headers: authHeaders,
      });
      return res.data;
    },
    enabled: isConnected,
    staleTime: 60_000,
    retry: 2,
  });

  const {
    data: commitsData,
    isLoading: commitsLoading,
    error: commitsError,
  } = useQuery({
    queryKey: ["github-commits", repoInfo?.owner, repoInfo?.repo, selectedBranch, page.commits],
    queryFn: async () => {
      if (!repoInfo) return null;
      const branch = selectedBranch || repoData?.default_branch || "main";
      const res = await proxyApi.get(`/github/repos/${repoInfo.owner}/${repoInfo.repo}/commits`, {
        params: { sha: branch, per_page: PER_PAGE, page: page.commits },
        headers: authHeaders,
      });
      return res.data;
    },
    enabled: !!repoInfo && activeTab === "commits",
    staleTime: 30_000,
  });

  const {
    data: pullsData,
    isLoading: pullsLoading,
    error: pullsError,
  } = useQuery({
    queryKey: ["github-pulls", repoInfo?.owner, repoInfo?.repo, page.pulls],
    queryFn: async () => {
      if (!repoInfo) return null;
      const res = await proxyApi.get(`/github/repos/${repoInfo.owner}/${repoInfo.repo}/pulls`, {
        params: { state: "all", per_page: PER_PAGE, page: page.pulls },
        headers: authHeaders,
      });
      return res.data;
    },
    enabled: !!repoInfo && activeTab === "pulls",
    staleTime: 30_000,
  });

  const {
    data: issuesData,
    isLoading: issuesLoading,
    error: issuesError,
  } = useQuery({
    queryKey: ["github-issues", repoInfo?.owner, repoInfo?.repo, page.issues],
    queryFn: async () => {
      if (!repoInfo) return null;
      const res = await proxyApi.get(`/github/repos/${repoInfo.owner}/${repoInfo.repo}/issues`, {
        params: { state: "open", per_page: PER_PAGE, page: page.issues, filter: "all" },
        headers: authHeaders,
      });
      return res.data;
    },
    enabled: !!repoInfo && activeTab === "issues",
    staleTime: 30_000,
  });

  const {
    data: branchesData,
    isLoading: branchesLoading,
    error: branchesError,
  } = useQuery({
    queryKey: ["github-branches", repoInfo?.owner, repoInfo?.repo, page.branches],
    queryFn: async () => {
      if (!repoInfo) return null;
      const res = await proxyApi.get(`/github/repos/${repoInfo.owner}/${repoInfo.repo}/branches`, {
        params: { per_page: 50, page: page.branches },
        headers: authHeaders,
      });
      return res.data;
    },
    enabled: !!repoInfo && (activeTab === "branches" || activeTab === "commits"),
    staleTime: 30_000,
  });

  const {
    data: releasesData,
    isLoading: releasesLoading,
    error: releasesError,
  } = useQuery({
    queryKey: ["github-releases", repoInfo?.owner, repoInfo?.repo, page.releases],
    queryFn: async () => {
      if (!repoInfo) return null;
      const res = await proxyApi.get(`/github/repos/${repoInfo.owner}/${repoInfo.repo}/releases`, {
        params: { per_page: PER_PAGE, page: page.releases },
        headers: authHeaders,
      });
      return res.data;
    },
    enabled: !!repoInfo && activeTab === "releases",
    staleTime: 30_000,
  });

  const {
    data: contributorsData,
    isLoading: contributorsLoading,
    error: contributorsError,
  } = useQuery({
    queryKey: ["github-contributors", repoInfo?.owner, repoInfo?.repo, page.contributors],
    queryFn: async () => {
      if (!repoInfo) return null;
      const res = await proxyApi.get(
        `/github/repos/${repoInfo.owner}/${repoInfo.repo}/contributors`,
        {
          params: { per_page: 30, page: page.contributors },
          headers: authHeaders,
        },
      );
      return res.data;
    },
    enabled: !!repoInfo && activeTab === "contributors",
    staleTime: 60_000,
  });

  const {
    data: languagesData,
    isLoading: languagesLoading,
    error: languagesError,
  } = useQuery({
    queryKey: ["github-languages", repoInfo?.owner, repoInfo?.repo],
    queryFn: async () => {
      if (!repoInfo) return null;
      const res = await proxyApi.get(`/github/repos/${repoInfo.owner}/${repoInfo.repo}/languages`, {
        headers: authHeaders,
      });
      return res.data;
    },
    enabled: !!repoInfo && activeTab === "languages",
    staleTime: 60_000,
  });

  useEffect(() => {
    if (repoData?.default_branch) setSelectedBranch(repoData.default_branch);
  }, [repoInfo?.owner, repoInfo?.repo, repoData?.default_branch]);

  useEffect(() => {
    setPage((prev) => ({ ...prev, [activeTab]: 1 }));
  }, [repoInfo?.owner, repoInfo?.repo, activeTab]);

  if (!projectId) return null;

  const tabs: { id: Tab; label: string; icon: typeof Github }[] = [
    { id: "overview", label: "Overview", icon: Eye },
    { id: "commits", label: "Commits", icon: GitCommitHorizontal },
    { id: "branches", label: "Branches", icon: GitBranch },
    { id: "pulls", label: "Pull Requests", icon: GitPullRequest },
    { id: "issues", label: "Issues", icon: AlertCircle },
    { id: "releases", label: "Releases", icon: Package },
    { id: "contributors", label: "Contributors", icon: Users },
    { id: "languages", label: "Languages", icon: Code2 },
  ];

  const renderTabContent = () => {
    if (repoLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rect" className="h-12 w-full rounded-lg" />
          ))}
        </div>
      );
    }

    if (repoError) {
      const msg = (repoError as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      if (
        msg === "API rate limit exceeded for unauthenticated requests." ||
        (repoError as { response?: { status?: number } })?.response?.status === 403
      ) {
        return <GitHubErrorBanner type="rate-limit" onRetry={refreshGitHub} />;
      }
      return (
        <GitHubErrorBanner
          type="error"
          message={msg || "Failed to load repository data"}
          onRetry={refreshGitHub}
        />
      );
    }

    switch (activeTab) {
      case "overview":
        return <RepoOverview repoInfo={repoInfo!} repoData={repoData} />;
      case "commits":
        return (
          <CommitsSection
            commits={commitsData}
            isLoading={commitsLoading}
            error={commitsError}
            repoInfo={repoInfo!}
            branches={branchesData}
            selectedBranch={selectedBranch}
            onSelectBranch={setSelectedBranch}
            page={page.commits}
            onPageChange={(p) => setPageFor("commits", p)}
          />
        );
      case "branches":
        return (
          <BranchesSection
            branches={branchesData}
            isLoading={branchesLoading}
            error={branchesError}
            repoInfo={repoInfo!}
            defaultBranch={repoData?.default_branch}
            page={page.branches}
            onPageChange={(p) => setPageFor("branches", p)}
          />
        );
      case "pulls":
        return (
          <PullRequestSection
            pulls={pullsData}
            isLoading={pullsLoading}
            error={pullsError}
            repoInfo={repoInfo!}
            page={page.pulls}
            onPageChange={(p) => setPageFor("pulls", p)}
          />
        );
      case "issues":
        return (
          <IssueSection
            issues={issuesData}
            isLoading={issuesLoading}
            error={issuesError}
            repoInfo={repoInfo!}
            page={page.issues}
            onPageChange={(p) => setPageFor("issues", p)}
          />
        );
      case "releases":
        return (
          <ReleasesSection
            releases={releasesData}
            isLoading={releasesLoading}
            error={releasesError}
            page={page.releases}
            onPageChange={(p) => setPageFor("releases", p)}
          />
        );
      case "contributors":
        return (
          <ContributorsSection
            contributors={contributorsData}
            isLoading={contributorsLoading}
            error={contributorsError}
            page={page.contributors}
            onPageChange={(p) => setPageFor("contributors", p)}
          />
        );
      case "languages":
        return (
          <LanguagesSection
            languages={languagesData}
            isLoading={languagesLoading}
            error={languagesError}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary">GitHub</h2>
          <p className="text-sm text-tertiary">
            {isConnected ? (
              <span className="flex items-center gap-1.5">
                {repoData?.owner?.avatar_url && (
                  <img src={repoData.owner.avatar_url} alt="" className="h-4 w-4 rounded-full" />
                )}
                {repoInfo!.owner}/{repoInfo!.repo}
              </span>
            ) : (
              "Not connected"
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isConnected && (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={refreshGitHub}
                title="Refresh all GitHub data"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Sync
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => window.open(githubUrl, "_blank")}
                title="Open in new tab"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Open on GitHub
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setShowConnect(true);
                  setRepoUrl(githubUrl || "");
                  setToken(storedToken || "");
                  setConnectError(null);
                }}
                title="Change repository or token"
              >
                <Github className="h-3.5 w-3.5" /> Change
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => disconnectMutation.mutate()}
                loading={disconnectMutation.isPending}
                title="Disconnect repository"
              >
                <Unlink className="h-3.5 w-3.5" /> Disconnect
              </Button>
            </>
          )}
          {!isConnected && (
            <Button size="sm" onClick={() => setShowConnect(true)}>
              <Github className="h-4 w-4" /> Connect GitHub
            </Button>
          )}
        </div>
      </div>

      {showConnect && (
        <Card className="animate-slide-up">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-primary">
              {isConnected ? "Update GitHub Repository" : "Connect GitHub Repository"}
            </h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowConnect(false);
                setConnectError(null);
              }}
            >
              Cancel
            </Button>
          </div>
          <div className="space-y-3">
            <Input
              label="Repository URL"
              placeholder="https://github.com/owner/repo"
              value={repoUrl}
              onChange={(e) => {
                setRepoUrl(e.target.value);
                setConnectError(null);
              }}
              error={connectError || undefined}
            />
            <Input
              label="Personal Access Token (optional, for private repos)"
              type="password"
              placeholder="ghp_..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => connectMutation.mutate(repoUrl)}
                loading={connectMutation.isPending}
                disabled={!repoUrl.trim()}
              >
                <Github className="h-4 w-4" /> {isConnected ? "Update" : "Connect"}
              </Button>
              {isConnected && (
                <p className="text-xs text-tertiary">
                  Leave token blank to keep the existing stored token.
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {isConnected ? (
        <>
          <div
            className="border-default flex items-center gap-1 overflow-x-auto border-b"
            role="tablist"
          >
            {tabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={activeTab === t.id}
                onClick={() => setActiveTab(t.id)}
                className={`-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === t.id
                    ? "border-primary text-primary"
                    : "border-transparent text-tertiary hover:text-secondary"
                }`}
              >
                <t.icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            ))}
          </div>
          {renderTabContent()}
        </>
      ) : (
        <EnterpriseEmptyState
          icon={<Github className="h-12 w-12" />}
          title="GitHub not connected"
          description="Connect a GitHub repository to see commits, pull requests, issues, branches, releases, and more."
          primaryAction={{ label: "Connect GitHub", onClick: () => setShowConnect(true) }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// OVERVIEW
// ═══════════════════════════════════════════════════════════════

function RepoOverview({
  repoInfo,
  repoData,
}: {
  repoInfo: { owner: string; repo: string };
  repoData: Record<string, unknown> | null | undefined;
}) {
  const d = repoData as Record<string, unknown> | undefined;
  const owner = d?.owner as Record<string, unknown> | undefined;
  const license = d?.license as Record<string, string> | undefined;
  const topics = d?.topics as string[] | undefined;
  const isArchived = Boolean(d?.archived);
  const isFork = Boolean(d?.fork);
  const isPrivate = Boolean(d?.private);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        <GitHubStatCard icon={Star} label="Stars" value={formatNum(d?.stargazers_count)} />
        <GitHubStatCard icon={GitFork} label="Forks" value={formatNum(d?.forks_count)} />
        <GitHubStatCard icon={Eye} label="Watchers" value={formatNum(d?.subscribers_count)} />
        <GitHubStatCard
          icon={AlertCircle}
          label="Open Issues"
          value={formatNum(d?.open_issues_count)}
        />
        <GitHubStatCard
          icon={GitBranch}
          label="Default Branch"
          value={String(d?.default_branch || "—")}
        />
        <GitHubStatCard
          icon={HardDrive}
          label="Size"
          value={d?.size ? `${Math.round((d.size as number) / 1024)} MB` : "—"}
        />
      </div>

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-primary">Repository</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            {!!owner?.avatar_url && (
              <img
                src={owner.avatar_url as string}
                alt=""
                className="h-10 w-10 shrink-0 rounded-full"
              />
            )}
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Github className="h-4 w-4 text-tertiary" />
                <a
                  href={`https://github.com/${repoInfo.owner}/${repoInfo.repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-link hover:underline"
                >
                  {String(d?.full_name || `${repoInfo.owner}/${repoInfo.repo}`)}
                </a>
                {isArchived && (
                  <Badge variant="warning" size="sm">
                    archived
                  </Badge>
                )}
                {isFork && (
                  <Badge variant="info" size="sm">
                    fork
                  </Badge>
                )}
                <Badge variant={isPrivate ? "warning" : "success"} size="sm">
                  {isPrivate ? "Private" : "Public"}
                </Badge>
              </div>
              {!!d?.description && (
                <p className="text-xs text-tertiary">{String(d.description as string)}</p>
              )}
              {!!d?.homepage && (
                <a
                  href={String(d.homepage as string)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-link hover:underline"
                >
                  <Globe className="h-3 w-3" /> {String(d.homepage as string)}
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-tertiary">
            {!!d?.language && (
              <span className="flex items-center gap-1">
                <Code2 className="h-3 w-3" /> {String(d.language as string)}
              </span>
            )}
            {!!license?.name && (
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" /> {license.name}
              </span>
            )}
            {!!d?.created_at && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> Created {formatRelative(String(d.created_at))}
              </span>
            )}
            {!!d?.updated_at && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> Updated {formatRelative(String(d.updated_at))}
              </span>
            )}
            {!!d?.pushed_at && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> Pushed {formatRelative(String(d.pushed_at))}
              </span>
            )}
          </div>

          {topics && topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {topics.map((t) => (
                <Badge key={t} variant="neutral" size="sm">
                  <Tag className="mr-1 inline h-2.5 w-2.5" />
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMMITS
// ═══════════════════════════════════════════════════════════════

function CommitsSection({
  commits,
  isLoading,
  error,
  repoInfo,
  branches,
  selectedBranch,
  onSelectBranch,
  page: pageNum,
  onPageChange,
}: {
  commits:
    | Array<{
        sha: string;
        commit: {
          message: string;
          author: { name: string; date: string; email?: string };
          verification?: { verified: boolean };
        };
        author: { login: string; avatar_url: string } | null;
        stats?: { additions: number; deletions: number; total: number };
        parents: Array<{ sha: string }>;
      }>
    | null
    | undefined;
  isLoading: boolean;
  error: unknown;
  repoInfo: { owner: string; repo: string };
  branches: Array<{ name: string; commit: { sha: string }; protected: boolean }> | null | undefined;
  selectedBranch: string | null;
  onSelectBranch: (b: string) => void;
  page: number;
  onPageChange: (p: number) => void;
}) {
  const { copied, copy } = useClipboard();

  if (error)
    return <GitHubErrorBanner type="error" message="Failed to load commits" onRetry={() => {}} />;
  if (isLoading)
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="rect" className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );

  return (
    <div className="space-y-3">
      {branches && branches.length > 0 && (
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-tertiary" />
          <select
            value={selectedBranch || ""}
            onChange={(e) => onSelectBranch(e.target.value)}
            className="border-default focus:ring-primary-ring rounded-lg border bg-surface px-2.5 py-1.5 text-sm text-primary focus:outline-none focus:ring-2"
          >
            {branches.map((b) => (
              <option key={b.name} value={b.name}>
                {b.name}
                {b.protected ? " 🔒" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {!commits || commits.length === 0 ? (
        <GitHubEmptyState icon={GitCommitHorizontal} message="No commits found on this branch." />
      ) : (
        <>
          <div className="space-y-1">
            {commits.map((c) => (
              <div
                key={c.sha}
                className="border-default flex items-center gap-3 rounded-lg border bg-surface p-2.5 transition-colors hover:bg-hover"
              >
                {c.author ? (
                  <img src={c.author.avatar_url} alt="" className="h-8 w-8 shrink-0 rounded-full" />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-subtle">
                    <GitCommitHorizontal className="h-4 w-4 text-tertiary" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <a
                    href={`https://github.com/${repoInfo.owner}/${repoInfo.repo}/commit/${c.sha}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-sm text-primary hover:underline"
                  >
                    {c.commit.message.split("\n")[0]}
                  </a>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-tertiary">
                    <span>{c.author?.login || c.commit.author.name}</span>
                    <span className="font-mono">{c.sha.slice(0, 7)}</span>
                    <span>{formatRelative(c.commit.author.date)}</span>
                    {c.commit.verification?.verified && (
                      <Badge variant="success" size="sm">
                        verified
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {c.stats && (
                    <span
                      className="text-xs tabular-nums text-tertiary"
                      title={`${c.stats.additions} additions, ${c.stats.deletions} deletions`}
                    >
                      <span className="text-brand-github-added">+{c.stats.additions}</span>{" "}
                      <span className="text-brand-github-removed">−{c.stats.deletions}</span>
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      copy(c.sha);
                    }}
                    className="rounded p-1 transition-colors hover:bg-subtle"
                    title="Copy full SHA"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-brand-github-added" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-tertiary" />
                    )}
                  </button>
                  <a
                    href={`https://github.com/${repoInfo.owner}/${repoInfo.repo}/commit/${c.sha}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded p-1 transition-colors hover:bg-subtle"
                    title="View on GitHub"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-tertiary" />
                  </a>
                </div>
              </div>
            ))}
          </div>
          <GitHubPagination page={pageNum} onPageChange={onPageChange} />
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BRANCHES
// ═══════════════════════════════════════════════════════════════

function BranchesSection({
  branches,
  isLoading,
  error,
  repoInfo,
  defaultBranch,
  page: pageNum,
  onPageChange,
}: {
  branches: Array<{ name: string; commit: { sha: string }; protected: boolean }> | null | undefined;
  isLoading: boolean;
  error: unknown;
  repoInfo: { owner: string; repo: string };
  defaultBranch?: string;
  page: number;
  onPageChange: (p: number) => void;
}) {
  if (error)
    return <GitHubErrorBanner type="error" message="Failed to load branches" onRetry={() => {}} />;
  if (isLoading)
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="rect" className="h-10 w-full rounded-lg" />
        ))}
      </div>
    );
  if (!branches || branches.length === 0)
    return <GitHubEmptyState icon={GitBranch} message="No branches found." />;

  return (
    <div className="space-y-1">
      {branches.map((b) => (
        <a
          key={b.name}
          href={`https://github.com/${repoInfo.owner}/${repoInfo.repo}/tree/${b.name}`}
          target="_blank"
          rel="noopener noreferrer"
          className="border-default group flex items-center gap-3 rounded-lg border bg-surface p-2.5 no-underline transition-colors hover:bg-hover"
        >
          <GitBranch className="h-4 w-4 shrink-0 text-tertiary" />
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="text-sm font-medium text-primary">{b.name}</span>
            {b.name === defaultBranch && (
              <Badge variant="success" size="sm">
                default
              </Badge>
            )}
            {b.protected && (
              <Badge variant="info" size="sm">
                <Shield className="mr-0.5 inline h-2.5 w-2.5" />
                protected
              </Badge>
            )}
          </div>
          <span className="font-mono text-xs text-tertiary">{b.commit.sha.slice(0, 7)}</span>
          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-tertiary opacity-0 transition-opacity group-hover:opacity-100" />
        </a>
      ))}
      <GitHubPagination page={pageNum} onPageChange={onPageChange} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PULL REQUESTS
// ═══════════════════════════════════════════════════════════════

function PullRequestSection({
  pulls,
  isLoading,
  error,
  repoInfo,
  page: pageNum,
  onPageChange,
}: {
  pulls:
    | Array<{
        id: number;
        number: number;
        title: string;
        state: string;
        draft?: boolean;
        user: { login: string; avatar_url: string };
        created_at: string;
        updated_at: string;
        requested_reviewers: Array<{ login: string }>;
        merged_at: string | null;
        merged_by?: { login: string } | null;
        body?: string | null;
        head: { ref: string; label: string };
        base: { ref: string; label: string };
        labels: Array<{ name: string; color: string }>;
        assignees: Array<{ login: string; avatar_url: string }>;
        comments: number;
        review_comments: number;
        commits: number;
        additions?: number;
        deletions?: number;
        changed_files?: number;
      }>
    | null
    | undefined;
  isLoading: boolean;
  error: unknown;
  repoInfo: { owner: string; repo: string };
  page: number;
  onPageChange: (p: number) => void;
}) {
  if (error)
    return (
      <GitHubErrorBanner type="error" message="Failed to load pull requests" onRetry={() => {}} />
    );
  if (isLoading)
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="rect" className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  if (!pulls || pulls.length === 0)
    return <GitHubEmptyState icon={GitPullRequest} message="No pull requests found." />;

  return (
    <div className="space-y-1">
      {pulls.map((pr) => (
        <a
          key={pr.id}
          href={`https://github.com/${repoInfo.owner}/${repoInfo.repo}/pull/${pr.number}`}
          target="_blank"
          rel="noopener noreferrer"
          className="border-default group flex items-start gap-3 rounded-lg border bg-surface p-3 no-underline transition-colors hover:bg-hover"
        >
          <img src={pr.user.avatar_url} alt="" className="mt-0.5 h-6 w-6 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-medium text-primary">{pr.title}</span>
              {pr.draft && (
                <Badge variant="neutral" size="sm">
                  draft
                </Badge>
              )}
              <Badge
                size="sm"
                variant={pr.merged_at ? "info" : pr.state === "open" ? "success" : "danger"}
              >
                {pr.merged_at ? "merged" : pr.state}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-tertiary">
              <span>#{pr.number}</span>
              <span>by {pr.user.login}</span>
              <span>{formatRelative(pr.created_at)}</span>
              {pr.labels?.slice(0, 3).map((l) => (
                <span
                  key={l.name}
                  className="rounded-full px-1.5 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: `#${l.color}20`, color: `#${l.color}` }}
                >
                  {l.name}
                </span>
              ))}
              {pr.requested_reviewers?.length > 0 && (
                <span className="flex items-center gap-0.5">
                  <Users className="h-3 w-3" />
                  {pr.requested_reviewers.length}
                </span>
              )}
              {pr.comments > 0 && (
                <span className="flex items-center gap-0.5">
                  <MessageSquare className="h-3 w-3" />
                  {pr.comments}
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-tertiary">
              <Badge variant="neutral" size="sm">
                {pr.head.ref}
              </Badge>
              <span>→</span>
              <Badge variant="neutral" size="sm">
                {pr.base.ref}
              </Badge>
              {pr.additions !== undefined && pr.deletions !== undefined && (
                <span className="tabular-nums">
                  <span className="text-brand-github-added">+{pr.additions}</span>{" "}
                  <span className="text-brand-github-removed">−{pr.deletions}</span>
                </span>
              )}
            </div>
          </div>
          <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-tertiary opacity-0 transition-opacity group-hover:opacity-100" />
        </a>
      ))}
      <GitHubPagination page={pageNum} onPageChange={onPageChange} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ISSUES
// ═══════════════════════════════════════════════════════════════

function IssueSection({
  issues,
  isLoading,
  error,
  repoInfo,
  page: pageNum,
  onPageChange,
}: {
  issues:
    | Array<{
        id: number;
        number: number;
        title: string;
        state: string;
        user: { login: string; avatar_url: string };
        created_at: string;
        updated_at: string;
        closed_at: string | null;
        labels: Array<{ name: string; color: string }>;
        assignees: Array<{ login: string; avatar_url: string }>;
        milestone: { title: string; state: string } | null;
        comments: number;
        pull_request?: unknown;
        body?: string | null;
      }>
    | null
    | undefined;
  isLoading: boolean;
  error: unknown;
  repoInfo: { owner: string; repo: string };
  page: number;
  onPageChange: (p: number) => void;
}) {
  if (error)
    return <GitHubErrorBanner type="error" message="Failed to load issues" onRetry={() => {}} />;
  if (isLoading)
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="rect" className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );

  const actualIssues = issues?.filter((i) => !i.pull_request) || [];
  if (actualIssues.length === 0)
    return <GitHubEmptyState icon={AlertCircle} message="No open issues." />;

  return (
    <div className="space-y-1">
      {actualIssues.map((issue) => (
        <a
          key={issue.id}
          href={`https://github.com/${repoInfo.owner}/${repoInfo.repo}/issues/${issue.number}`}
          target="_blank"
          rel="noopener noreferrer"
          className="border-default group flex items-start gap-3 rounded-lg border bg-surface p-3 no-underline transition-colors hover:bg-hover"
        >
          <img
            src={issue.user.avatar_url}
            alt=""
            className="mt-0.5 h-6 w-6 shrink-0 rounded-full"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-medium text-primary">{issue.title}</span>
              {issue.state === "closed" ? (
                <Badge variant="danger" size="sm">
                  closed
                </Badge>
              ) : (
                <Badge variant="success" size="sm">
                  open
                </Badge>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-tertiary">
              <span>#{issue.number}</span>
              <span>by {issue.user.login}</span>
              <span>{formatRelative(issue.created_at)}</span>
              {issue.labels?.slice(0, 3).map((l) => (
                <span
                  key={l.name}
                  className="rounded-full px-1.5 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: `#${l.color}20`, color: `#${l.color}` }}
                >
                  {l.name}
                </span>
              ))}
              {issue.milestone && (
                <Badge variant="info" size="sm">
                  {issue.milestone.title}
                </Badge>
              )}
              {issue.assignees?.length > 0 && (
                <span className="flex items-center gap-0.5">
                  {issue.assignees.slice(0, 3).map((a) => (
                    <img
                      key={a.login}
                      src={a.avatar_url}
                      alt={a.login}
                      className="h-4 w-4 rounded-full"
                      title={a.login}
                    />
                  ))}
                </span>
              )}
              {issue.comments > 0 && (
                <span className="flex items-center gap-0.5">
                  <MessageSquare className="h-3 w-3" />
                  {issue.comments}
                </span>
              )}
            </div>
          </div>
          <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-tertiary opacity-0 transition-opacity group-hover:opacity-100" />
        </a>
      ))}
      <GitHubPagination page={pageNum} onPageChange={onPageChange} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// RELEASES
// ═══════════════════════════════════════════════════════════════

function ReleasesSection({
  releases,
  isLoading,
  error,
  page: pageNum,
  onPageChange,
}: {
  releases:
    | Array<{
        id: number;
        tag_name: string;
        name: string | null;
        body: string | null;
        prerelease: boolean;
        draft?: boolean;
        created_at: string;
        published_at: string | null;
        html_url: string;
        author: { login: string; avatar_url: string } | null;
        assets: Array<{
          name: string;
          size: number;
          download_count: number;
          browser_download_url: string;
        }>;
      }>
    | null
    | undefined;
  isLoading: boolean;
  error: unknown;
  page: number;
  onPageChange: (p: number) => void;
}) {
  if (error)
    return <GitHubErrorBanner type="error" message="Failed to load releases" onRetry={() => {}} />;
  if (isLoading)
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="rect" className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  if (!releases || releases.length === 0)
    return <GitHubEmptyState icon={Package} message="No releases found." />;

  return (
    <div className="space-y-1">
      {releases.map((r, idx) => (
        <a
          key={r.id}
          href={r.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="border-default group flex flex-col gap-1.5 rounded-lg border bg-surface p-3 no-underline transition-colors hover:bg-hover"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Package className="h-4 w-4 shrink-0 text-tertiary" />
            <span className="text-sm font-medium text-primary">{r.name || r.tag_name}</span>
            {idx === 0 && !r.draft && (
              <Badge variant="success" size="sm">
                latest
              </Badge>
            )}
            {r.prerelease && (
              <Badge variant="warning" size="sm">
                pre-release
              </Badge>
            )}
            {r.draft && (
              <Badge variant="neutral" size="sm">
                draft
              </Badge>
            )}
          </div>
          <div className="ml-6 flex items-center gap-2 text-xs text-tertiary">
            {r.author && <img src={r.author.avatar_url} alt="" className="h-4 w-4 rounded-full" />}
            <span>{r.tag_name}</span>
            <span>{formatRelative(r.published_at || r.created_at)}</span>
          </div>
          {r.body && <p className="ml-6 line-clamp-2 text-xs text-tertiary">{r.body}</p>}
          {r.assets?.length > 0 && (
            <div className="ml-6 mt-1 flex flex-wrap gap-2">
              {r.assets.slice(0, 5).map((a) => (
                <a
                  key={a.name}
                  href={a.browser_download_url}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-xs text-link hover:underline"
                >
                  <HardDrive className="h-3 w-3" />
                  {a.name}{" "}
                  <span className="text-tertiary">
                    ({formatBytes(a.size)}, {a.download_count} downloads)
                  </span>
                </a>
              ))}
            </div>
          )}
        </a>
      ))}
      <GitHubPagination page={pageNum} onPageChange={onPageChange} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CONTRIBUTORS
// ═══════════════════════════════════════════════════════════════

function ContributorsSection({
  contributors,
  isLoading,
  error,
  page: pageNum,
  onPageChange,
}: {
  contributors:
    | Array<{ login: string; avatar_url: string; contributions: number; html_url: string }>
    | null
    | undefined;
  isLoading: boolean;
  error: unknown;
  page: number;
  onPageChange: (p: number) => void;
}) {
  if (error)
    return (
      <GitHubErrorBanner type="error" message="Failed to load contributors" onRetry={() => {}} />
    );
  if (isLoading)
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="rect" className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  if (!contributors || contributors.length === 0)
    return <GitHubEmptyState icon={Users} message="No contributors found." />;

  const maxContributions = Math.max(...contributors.map((c) => c.contributions));

  return (
    <div className="space-y-1">
      {contributors.map((c) => (
        <a
          key={c.login}
          href={c.html_url || `https://github.com/${c.login}`}
          target="_blank"
          rel="noopener noreferrer"
          className="border-default group flex items-center gap-3 rounded-lg border bg-surface p-2.5 no-underline transition-colors hover:bg-hover"
        >
          <img src={c.avatar_url} alt={c.login} className="h-8 w-8 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-primary">{c.login}</span>
              <span className="text-xs tabular-nums text-tertiary">
                {c.contributions} commit{c.contributions !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-subtle">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${(c.contributions / maxContributions) * 100}%` }}
              />
            </div>
          </div>
          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-tertiary opacity-0 transition-opacity group-hover:opacity-100" />
        </a>
      ))}
      <GitHubPagination page={pageNum} onPageChange={onPageChange} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// LANGUAGES
// ═══════════════════════════════════════════════════════════════

function LanguagesSection({
  languages,
  isLoading,
  error,
}: {
  languages: Record<string, number> | null | undefined;
  isLoading: boolean;
  error: unknown;
}) {
  if (error)
    return <GitHubErrorBanner type="error" message="Failed to load languages" onRetry={() => {}} />;
  if (isLoading)
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="rect" className="h-10 w-full rounded-lg" />
        ))}
      </div>
    );
  if (!languages || Object.keys(languages).length === 0)
    return <GitHubEmptyState icon={Code2} message="No language data available." />;

  const total = Object.values(languages).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(languages).sort(([, a], [, b]) => b - a);
  const top10 = sorted.slice(0, 10);
  const otherBytes = sorted.slice(10).reduce((sum, [, b]) => sum + b, 0);

  const COLORS = [
    "var(--lang-1)",
    "var(--lang-2)",
    "var(--lang-3)",
    "var(--lang-4)",
    "var(--lang-5)",
    "var(--lang-6)",
    "var(--lang-7)",
    "var(--lang-8)",
    "var(--lang-9)",
    "var(--lang-10)",
    "var(--lang-11)",
    "var(--lang-12)",
  ];

  return (
    <div className="space-y-4">
      <Card padding="none">
        <div className="flex h-3 overflow-hidden rounded-t-md">
          {top10.map(([lang, bytes], i) => (
            <div
              key={lang}
              style={{
                width: `${(bytes / total) * 100}%`,
                backgroundColor: COLORS[i % COLORS.length],
              }}
              className="h-full transition-all"
              title={`${lang}: ${((bytes / total) * 100).toFixed(1)}%`}
            />
          ))}
          {otherBytes > 0 && (
            <div
              style={{ width: `${(otherBytes / total) * 100}%` }}
              className="bg-tertiary h-full"
              title={`Other: ${((otherBytes / total) * 100).toFixed(1)}%`}
            />
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {sorted.map(([lang, bytes], i) => {
          const pct = ((bytes / total) * 100).toFixed(1);
          return (
            <div
              key={lang}
              className="border-default flex items-center justify-between rounded-lg border bg-surface p-2"
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-sm text-primary">{lang}</span>
              </div>
              <span className="text-xs tabular-nums text-tertiary">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════

function GitHubStatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Github;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-subtle">
          <Icon className="h-4 w-4 text-tertiary" />
        </div>
        <div>
          <p className="text-lg font-semibold tabular-nums text-primary">{value}</p>
          <p className="text-xs text-tertiary">{label}</p>
        </div>
      </div>
    </Card>
  );
}

function GitHubEmptyState({ icon: Icon, message }: { icon: typeof Github; message: string }) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <Icon className="mb-2 h-8 w-8 text-tertiary" />
      <p className="text-sm text-tertiary">{message}</p>
    </div>
  );
}

function GitHubPagination({
  page,
  onPageChange,
}: {
  page: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <div className="border-default flex items-center justify-between border-t pt-2">
      <p className="text-xs text-tertiary">Page {page}</p>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Prev
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onPageChange(page + 1)}>
          Next <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function GitHubErrorBanner({
  type,
  message,
  onRetry,
}: {
  type: "rate-limit" | "error" | "offline";
  message?: string;
  onRetry?: () => void;
}) {
  if (type === "rate-limit") {
    return (
      <Card className="border border-warning-border bg-warning-soft">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-warning-strong mt-0.5 h-5 w-5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-warning">GitHub API rate limit exceeded</p>
            <p className="text-xs text-warning">
              Anonymous requests are limited to 60 per hour. Add a Personal Access Token to increase
              your limit to 5,000 requests per hour.
            </p>
          </div>
          {onRetry && (
            <Button size="sm" variant="secondary" onClick={onRetry} className="shrink-0">
              <RefreshCw className="h-3 w-3" /> Retry
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="border border-danger-border bg-danger-soft">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger-strong" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-danger">{message || "Something went wrong"}</p>
          <p className="text-xs text-danger">
            There was an error loading GitHub data. Check your connection and try again.
          </p>
        </div>
        {onRetry && (
          <Button size="sm" variant="secondary" onClick={onRetry} className="shrink-0">
            <RefreshCw className="h-3 w-3" /> Retry
          </Button>
        )}
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

function formatBytes(bytes: number): string {
  return formatFileSize(bytes);
}
