import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { announcementsService } from "@/features/announcements/services/announcements";
import { useAuth } from "@/store/auth";
import { openDrawer } from "@/hooks/useDrawer";
import {
  Avatar,
  Badge,
  Button,
  Card,
  FilterBar,
  Pagination,
  Skeleton,
  SkeletonKpiRow,
} from "@/design-system";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { formatDate, formatRelative } from "@/utils/formatters";
import { getStatusVariant, getPriorityVariant } from "@/utils/badgeVariants";
import { Plus, Megaphone, Pin } from "lucide-react";
import type { Announcement, PaginatedResponse } from "@/types";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "published", label: "Published" },
  { value: "scheduled", label: "Scheduled" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

const PRIORITY_OPTIONS = [
  { value: "", label: "All Priorities" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export default function AnnouncementListPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["announcements", search, statusFilter, priorityFilter, page],
    queryFn: () =>
      announcementsService.list({
        q: search || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        page,
        per_page: 20,
      }),
  });

  const result = data as PaginatedResponse<Announcement> | undefined;
  const anns = result?.items ?? [];
  const totalItems = result?.total ?? 0;
  const totalPages = result?.total_pages ?? 1;

  const publishedCount = result?.items?.filter((a) => a.status === "published").length ?? 0;
  const scheduledCount = result?.items?.filter((a) => a.status === "scheduled").length ?? 0;
  const draftCount = result?.items?.filter((a) => a.status === "draft").length ?? 0;
  const archivedCount = result?.items?.filter((a) => a.status === "archived").length ?? 0;

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["announcements"] });
  }, [queryClient]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => announcementsService.delete(id),
    onSuccess: () => {
      setDeleteTarget(null);
      invalidate();
    },
  });

  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      announcementsService.changeStatus(id, status),
    onSuccess: invalidate,
  });

  const statusChipLabel = (s: string) => {
    if (!s) return "";
    const map: Record<string, string> = {
      published: "Published",
      scheduled: "Scheduled",
      draft: "Draft",
      archived: "Archived",
    };
    return map[s] ?? s;
  };

  const activeChips = [
    ...(statusFilter
      ? [
          {
            key: "status",
            label: `Status: ${statusChipLabel(statusFilter)}`,
            onRemove: () => {
              setStatusFilter("");
              setPage(1);
            },
          },
        ]
      : []),
    ...(priorityFilter
      ? [
          {
            key: "priority",
            label: `Priority: ${priorityFilter}`,
            onRemove: () => {
              setPriorityFilter("");
              setPage(1);
            },
          },
        ]
      : []),
  ];

  return (
    <div className="page-container space-y-5 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary">Announcements</h1>
        {hasPermission("announcement-create") && (
          <Button onClick={() => navigate("/work/announcements/new")}>
            <Plus className="h-4 w-4" /> New Announcement
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          { label: "Total", value: totalItems, color: "text-primary" },
          { label: "Published", value: publishedCount, color: "text-semantic-success" },
          { label: "Scheduled", value: scheduledCount, color: "text-semantic-info" },
          { label: "Draft", value: draftCount, color: "text-semantic-warning" },
          { label: "Archived", value: archivedCount, color: "text-tertiary" },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-tertiary">{kpi.label}</p>
            <p className={`mt-1 text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </Card>
        ))}
      </div>

      <FilterBar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Search announcements..."
        filters={[
          {
            key: "status",
            label: "Status",
            options: STATUS_OPTIONS.slice(1),
            value: statusFilter,
            onChange: (v) => {
              setStatusFilter(v);
              setPage(1);
            },
          },
          {
            key: "priority",
            label: "Priority",
            options: PRIORITY_OPTIONS.slice(1),
            value: priorityFilter,
            onChange: (v) => {
              setPriorityFilter(v);
              setPage(1);
            },
          },
        ]}
        activeChips={activeChips}
        onClearAll={() => {
          setStatusFilter("");
          setPriorityFilter("");
          setSearch("");
          setPage(1);
        }}
      />

      {isLoading ? (
        <div className="space-y-4">
          <SkeletonKpiRow cards={4} />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rect" className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : anns.length === 0 ? (
        <div className="border-default flex flex-col items-center rounded-lg border bg-surface py-16 text-center">
          <Megaphone className="mb-3 h-12 w-12 text-tertiary" />
          <h3 className="text-lg font-semibold text-primary">No announcements</h3>
          <p className="mb-4 mt-1 text-sm text-secondary">
            {search || statusFilter || priorityFilter
              ? "No announcements match your filters."
              : "Create your first announcement."}
          </p>
          {!search && !statusFilter && !priorityFilter && hasPermission("announcement-create") && (
            <Button onClick={() => navigate("/work/announcements/new")}>
              <Plus className="h-4 w-4" /> New Announcement
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {anns.map((a) => (
            <Card key={a.id} variant="interactive" onClick={() => openDrawer("announcement", a.id)}>
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                      <Megaphone className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-primary">{a.title}</p>
                        {Boolean((a as unknown as Record<string, unknown>).is_pinned) && (
                          <Pin className="h-3.5 w-3.5 shrink-0 text-semantic-warning" />
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <Badge variant={getStatusVariant(a.status)} size="sm" dot>
                          {a.status}
                        </Badge>
                        {a.priority && (
                          <Badge variant={getPriorityVariant(a.priority)} size="sm">
                            {a.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {(a.status === "draft" || a.status === "scheduled") &&
                      hasPermission("announcement-edit") && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            changeStatusMutation.mutate({ id: a.id, status: "published" });
                          }}
                          className="hover:bg-semantic-success/20 rounded-md bg-semantic-success-soft px-2 py-1 text-xs font-medium text-semantic-success transition-colors"
                        >
                          Publish Now
                        </button>
                      )}
                    {a.status === "published" && hasPermission("announcement-edit") && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          changeStatusMutation.mutate({ id: a.id, status: "archived" });
                        }}
                        className="rounded-md bg-subtle px-2 py-1 text-xs font-medium text-tertiary transition-colors hover:bg-hover"
                      >
                        Archive
                      </button>
                    )}
                    {hasPermission("announcement-edit") && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/work/announcements/${a.id}/edit`);
                        }}
                        className="rounded p-1.5 text-tertiary transition-colors hover:bg-hover hover:text-primary"
                        title="Edit"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                    )}
                    {hasPermission("announcement-delete") && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(a);
                        }}
                        className="rounded p-1.5 text-tertiary transition-colors hover:bg-danger-soft hover:text-danger"
                        title="Delete"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                <p className="line-clamp-2 text-sm text-secondary">
                  {a.content.length > 150 ? `${a.content.slice(0, 150)}...` : a.content}
                </p>
                <div className="flex items-center justify-between text-xs text-tertiary">
                  <div className="flex items-center gap-2">
                    {a.author && (
                      <>
                        <Avatar name={a.author.name} size="sm" />
                        <span>{a.author.name}</span>
                      </>
                    )}
                  </div>
                  <span>
                    {a.published_at ? formatDate(a.published_at) : formatRelative(a.created_at)}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-tertiary">
            Page {page} of {totalPages} ({totalItems} total)
          </p>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Announcement"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
