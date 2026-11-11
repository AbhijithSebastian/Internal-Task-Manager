import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  useProject,
  useProjectTasks,
  useProjectMembers,
  useProjectMeetings,
  useProjectActivity,
} from "@/features/projects/hooks/useProject";
import { EditProjectDialog } from "@/features/projects/components/EditProjectDialog";
import { MemberDetailDrawer } from "@/features/projects/components/MemberDetailDrawer";
import { useEndpoints } from "@/features/endpoints/hooks/useEndpoints";
import { useResources } from "@/features/resources/hooks/useResources";
import { Avatar, Badge, Button, Card, Skeleton } from "@/design-system";
import { openDrawer } from "@/hooks/useDrawer";
import {
  Link2,
  ListTodo,
  CalendarDays,
  Globe,
  Users,
  Target,
  ChevronRight,
  FileText,
  Github,
  Palette,
  Plus,
  ExternalLink,
} from "lucide-react";
import { formatDate, formatRelative, formatDateTime, formatFileSize } from "@/utils/formatters";
import { getStatusVariant, getPriorityVariant } from "@/utils/badgeVariants";
import type { ProjectMember } from "@/types";

export default function ProjectOverviewPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ProjectMember | null>(null);

  const { data: project, isLoading } = useProject(projectId);
  const { data: tasks } = useProjectTasks(projectId);
  const { data: members } = useProjectMembers(projectId);
  const { data: meetings } = useProjectMeetings(projectId);
  const { data: activity } = useProjectActivity(projectId);
  const { data: endpointsData } = useEndpoints(projectId!);
  const { data: resourcesData } = useResources(projectId!, { per_page: 6 });

  const tasksData = tasks || [];
  const membersData = members || [];
  const meetingsData = meetings || [];
  const activityData = activity || [];
  const endpoints = endpointsData?.items ?? [];
  const resources = resourcesData?.items ?? [];

  const openTasks = tasksData.filter(
    (t) => t.status !== "done" && t.status !== "closed" && t.status !== "cancelled",
  );
  const completedTasks = tasksData.filter((t) => t.status === "done" || t.status === "closed");
  const progress =
    tasksData.length > 0 ? Math.round((completedTasks.length / tasksData.length) * 100) : 0;
  const upcomingMeetings = meetingsData
    .filter((m) => new Date(m.meeting_date) >= new Date())
    .slice(0, 5);
  const recentActivity = activityData.slice(0, 5);
  const recentEndpoints = endpoints.slice(0, 5);
  const recentResources = resources.slice(0, 6);

  const openPrCount = 2;
  const openIssueCount = 3;

  if (isLoading || !project) {
    return (
      <div className="space-y-5">
        <Skeleton variant="rect" className="h-32 w-full rounded-lg" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Skeleton variant="rect" className="h-24 w-full rounded-lg" />
            <Skeleton variant="rect" className="h-24 w-full rounded-lg" />
          </div>
          <div className="space-y-3">
            <Skeleton variant="rect" className="h-48 w-full rounded-lg" />
            <Skeleton variant="rect" className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left column: main content */}
        <div className="space-y-5 lg:col-span-2">
          {/* Description */}
          <Card>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-tertiary">
              Description
            </h3>
            {project.description ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-secondary">
                {project.description}
              </p>
            ) : (
              <p className="text-sm italic text-tertiary">
                No description provided.{" "}
                <button onClick={() => setEditOpen(true)} className="text-link hover:underline">
                  Add one
                </button>
              </p>
            )}
          </Card>

          {/* Stat cards row */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              icon={ListTodo}
              label="Open Tasks"
              value={String(openTasks.length)}
              action={
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate(`/work/projects/${projectId}/tasks`)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              }
            />
            <StatCard
              icon={Target}
              label="Completed"
              value={String(completedTasks.length)}
              sub={`${progress}%`}
            />
            <StatCard
              icon={Users}
              label="Members"
              value={String(membersData.length)}
              action={
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate(`/work/projects/${projectId}/members`)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              }
            />
            <StatCard
              icon={Globe}
              label="Endpoints"
              value={String(endpoints.length)}
              action={
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate(`/work/projects/${projectId}/endpoints`)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              }
            />
          </div>

          {/* Quick Actions */}
          <Card>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-tertiary">
              Quick Actions
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => navigate(`/work/projects/${projectId}/tasks`)}
              >
                <Plus className="h-3.5 w-3.5" /> Add Task
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => navigate(`/work/meetings/new?project_id=${projectId}`)}
              >
                <CalendarDays className="h-3.5 w-3.5" /> Schedule Meeting
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => navigate(`/work/projects/${projectId}/resources`)}
              >
                <FileText className="h-3.5 w-3.5" /> Upload Resource
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => navigate(`/work/projects/${projectId}/design`)}
              >
                <Palette className="h-3.5 w-3.5" /> Open Design
              </Button>
              {project?.github_url && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => window.open(project.github_url, "_blank")}
                >
                  <Github className="h-3.5 w-3.5" /> Open GitHub
                </Button>
              )}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">
                Recent Activity
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate(`/work/projects/${projectId}/activity`)}
              >
                View all <ChevronRight className="ml-0.5 h-3 w-3" />
              </Button>
            </div>
            {recentActivity.length === 0 ? (
              <p className="text-sm italic text-tertiary">No activity yet.</p>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((a) => (
                  <div key={a.id} className="flex items-start gap-2.5">
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-soft" />
                    <div className="min-w-0">
                      <p className="text-sm text-primary">{a.description}</p>
                      <p className="text-xs text-tertiary">{formatRelative(a.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Upcoming Meetings */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">
                Upcoming Meetings
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate(`/work/projects/${projectId}/meetings`)}
              >
                View all <ChevronRight className="ml-0.5 h-3 w-3" />
              </Button>
            </div>
            {upcomingMeetings.length === 0 ? (
              <div className="flex items-center justify-center py-6 text-center">
                <div>
                  <CalendarDays className="mx-auto mb-2 h-8 w-8 text-tertiary" />
                  <p className="text-sm text-tertiary">No upcoming meetings</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-2"
                    onClick={() => navigate(`/work/meetings/new?project_id=${projectId}`)}
                  >
                    Schedule Meeting
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingMeetings.map((m) => (
                  <div
                    key={m.id}
                    className="border-default flex cursor-pointer items-center justify-between rounded-lg border p-2 transition-colors hover:bg-hover"
                    onClick={() => openDrawer("meeting", m.id)}
                  >
                    <div className="mr-2 min-w-0">
                      <p className="truncate text-sm font-medium text-primary">{m.title}</p>
                      <p className="text-xs text-tertiary">{formatDateTime(m.meeting_date)}</p>
                    </div>
                    {m.organizer && <Avatar name={m.organizer.name} size="sm" />}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Latest Endpoints */}
          {recentEndpoints.length > 0 && (
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">
                  Recent Endpoints
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate(`/work/projects/${projectId}/endpoints`)}
                >
                  View all <ChevronRight className="ml-0.5 h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-1.5">
                {recentEndpoints.map((e) => (
                  <div
                    key={e.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-colors hover:bg-hover"
                    onClick={() => openDrawer("endpoint", e.id)}
                  >
                    <Badge
                      variant={
                        e.method === "GET"
                          ? "success"
                          : e.method === "POST"
                            ? "info"
                            : e.method === "DELETE"
                              ? "danger"
                              : "warning"
                      }
                      size="sm"
                    >
                      {e.method}
                    </Badge>
                    <span className="truncate font-mono text-sm text-primary">{e.url}</span>
                    <span className="ml-auto truncate text-xs text-tertiary">{e.name}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recent Resources */}
          {recentResources.length > 0 && (
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">
                  Recent Resources
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate(`/work/projects/${projectId}/resources`)}
                >
                  View all <ChevronRight className="ml-0.5 h-3 w-3" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {recentResources.map((r) => (
                  <div
                    key={r.id}
                    className="border-default flex cursor-pointer items-center gap-2 rounded-lg border p-2 transition-colors hover:bg-hover"
                    onClick={() => openDrawer("resource", r.id)}
                  >
                    <FileText className="h-4 w-4 shrink-0 text-tertiary" />
                    <div className="min-w-0">
                      <p className="truncate text-xs text-primary">{r.name}</p>
                      <p className="text-2xs text-tertiary">
                        {r.file_size ? formatFileSize(r.file_size) : r.resource_type}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right column: sidebar */}
        <div className="space-y-3">
          {/* Project Details */}
          <Card>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-tertiary">
              Details
            </h3>
            <div className="space-y-2.5 text-sm">
              <Row
                label="Status"
                value={
                  project.status ? (
                    <Badge variant={getStatusVariant(project.status)} dot>
                      {statusLabel(project.status)}
                    </Badge>
                  ) : (
                    "—"
                  )
                }
              />
              <Row
                label="Priority"
                value={
                  project.priority ? (
                    <Badge variant={getPriorityVariant(project.priority)} size="sm">
                      {priorityLabel(project.priority)}
                    </Badge>
                  ) : (
                    "—"
                  )
                }
              />
              <Row
                label="Start"
                value={project.start_date ? formatDate(project.start_date) : "—"}
              />
              <Row label="Deadline" value={project.deadline ? formatDate(project.deadline) : "—"} />
              <Row label="Progress" value={<span className="tabular-nums">{progress}%</span>} />
              <Row
                label="Tasks"
                value={
                  <span className="tabular-nums">
                    {completedTasks.length}/{tasksData.length}
                  </span>
                }
              />
            </div>
          </Card>

          {/* Owner */}
          {project.author && (
            <Card>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-tertiary">
                Owner
              </h3>
              <div className="flex items-center gap-2">
                <Avatar name={project.author.name} size="sm" />
                <div>
                  <p className="text-sm text-primary">{project.author.name}</p>
                  <p className="text-xs text-tertiary">Project Owner</p>
                </div>
              </div>
            </Card>
          )}

          {/* Links */}
          <Card>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-tertiary">
              Links
            </h3>
            <div className="space-y-1.5">
              {project.figma_url && (
                <a
                  href={project.figma_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-link hover:underline"
                >
                  <Link2 className="h-3.5 w-3.5" /> Figma
                </a>
              )}
              {project.github_url && (
                <a
                  href={project.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-link hover:underline"
                >
                  <Link2 className="h-3.5 w-3.5" /> GitHub
                </a>
              )}
              {project.docs_url && (
                <a
                  href={project.docs_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-link hover:underline"
                >
                  <Link2 className="h-3.5 w-3.5" /> Docs
                </a>
              )}
              {!project.figma_url && !project.github_url && !project.docs_url && (
                <p className="text-sm italic text-tertiary">No links configured.</p>
              )}
            </div>
          </Card>

          {/* GitHub Overview */}
          {project?.github_url && (
            <Card>
              <div className="mb-3 flex items-center gap-2">
                <Github className="h-4 w-4 text-tertiary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">
                  GitHub
                </h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-tertiary">PRs:</span>
                  <span className="font-medium text-primary">{openPrCount} open</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-tertiary">Issues:</span>
                  <span className="font-medium text-primary">{openIssueCount} open</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-1"
                  onClick={() => navigate(`/work/projects/${projectId}/github`)}
                >
                  <ExternalLink className="h-3 w-3" /> View details
                </Button>
              </div>
            </Card>
          )}

          {/* Team Members */}
          {membersData.length > 0 && (
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-tertiary">
                  Team
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate(`/work/projects/${projectId}/members`)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="space-y-2">
                {membersData.slice(0, 5).map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMember(m)}
                    className="flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-80"
                  >
                    <Avatar name={m.user?.name || "?"} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-primary">
                        {m.user?.name || `User #${m.user_id}`}
                      </p>
                      <p className="text-xs text-tertiary">{m.role}</p>
                    </div>
                  </div>
                ))}
                {membersData.length > 5 && (
                  <button
                    onClick={() => navigate(`/work/projects/${projectId}/members`)}
                    className="text-xs text-link hover:underline"
                  >
                    +{membersData.length - 5} more
                  </button>
                )}
              </div>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-tertiary">
              Timeline
            </h3>
            <div className="space-y-2.5 text-sm">
              <Row
                label="Created"
                value={project.created_at ? formatDate(project.created_at) : "—"}
              />
              <Row
                label="Updated"
                value={project.updated_at ? formatRelative(project.updated_at) : "—"}
              />
            </div>
            {project.start_date && project.deadline && (
              <div className="mt-3 border-t border-subtle pt-3">
                <div className="relative h-2 overflow-hidden rounded-full bg-subtle">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs text-tertiary">
                  <span>{formatDate(project.start_date)}</span>
                  <span>{formatDate(project.deadline)}</span>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {project && (
        <EditProjectDialog open={editOpen} onClose={() => setEditOpen(false)} project={project} />
      )}
      <MemberDetailDrawer member={selectedMember} onClose={() => setSelectedMember(null)} />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  action,
}: {
  icon: typeof ListTodo;
  label: string;
  value: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-grey-500">
          {label}
        </span>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <p className="text-2xl font-bold tracking-tight text-grey-900 tabular-nums">
          {value}
          {sub ? <span className="ml-1 text-xs font-normal text-grey-500">({sub})</span> : null}
        </p>
        {action}
      </div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-tertiary">{label}</span>
      <span className="text-sm text-primary">{value}</span>
    </div>
  );
}

function statusLabel(s: string): string {
  const m: Record<string, string> = {
    active: "Active",
    on_hold: "On Hold",
    completed: "Completed",
    archived: "Archived",
  };
  return m[s] || s;
}

function priorityLabel(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
