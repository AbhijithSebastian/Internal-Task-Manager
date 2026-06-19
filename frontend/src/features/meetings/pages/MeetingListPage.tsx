import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useAuth } from "@/store/auth";
import { openDrawer } from "@/hooks/useDrawer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { FilterBar } from "@/components/ui/FilterBar";
import { Table, type TableColumn } from "@/components/ui/Table";
import { SkeletonKpiRow } from "@/components/ui/Skeleton";
import { Plus, CalendarDays, UserCheck, FileText, Video, Edit3 } from "lucide-react";
import { formatDateTime } from "@/utils/formatters";
import type { Meeting } from "@/types";

export default function MeetingListPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [pageSize] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: ["meetings", page, search],
    queryFn: () => api.get("/meetings", { params: { page, search, per_page: pageSize, sort_by: "meeting_date", sort_direction: "desc" } }).then((r) => r.data?.items || r.data?.data || r.data || []),
  });

  const meetings: Meeting[] = Array.isArray(data) ? data : data?.items || [];
  const total = data?.total || meetings.length;

  const upcoming = meetings.filter((m) => new Date(m.meeting_date) > new Date()).length;

  const columns: TableColumn<Meeting>[] = [
    { key: "title", label: "Title", render: (m) => (
      <div>
        <p className="text-sm font-medium text-primary">{m.title}</p>
        {m.project_name && <p className="text-xs text-tertiary">{m.project_name}</p>}
      </div>
    )},
    { key: "date", label: "Date", render: (m) => <span className="text-sm text-secondary">{formatDateTime(m.meeting_date)}</span> },
    { key: "organizer", label: "Organizer", render: (m) => m.organizer ? (
      <div className="flex items-center gap-1.5"><Avatar name={m.organizer.name} size="sm" /><span className="text-sm text-secondary">{m.organizer.name}</span></div>
    ) : <span className="text-sm text-tertiary">—</span>},
    { key: "attendees", label: "Attendees", render: (m) => <span className="text-sm text-secondary">{m.attendees?.length || 0}</span> },
    { key: "location", label: "Location", render: (m) => (
      <span className="flex items-center gap-1 text-sm text-secondary">{m.location === "virtual" ? <Video className="h-3.5 w-3.5" /> : null}{m.location || "—"}</span>
    )},
    { key: "actions", label: "", width: "60px", render: (m) => (
      <button onClick={(e) => { e.stopPropagation(); navigate(`/work/meetings/${m.id}/edit`); }} className="p-1.5 rounded text-tertiary hover:text-primary hover:bg-hover transition-colors" title="Edit">
        <Edit3 className="h-3.5 w-3.5" />
      </button>
    )},
  ];

  return (
    <div className="page-container py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary">Meetings</h1>
        </div>
        {hasPermission("meeting-create") && (
          <Button onClick={() => navigate("/work/meetings/new")}>
            <Plus className="h-4 w-4" /> Schedule Meeting
          </Button>
        )}
      </div>

      {isLoading ? (
        <SkeletonKpiRow cards={3} />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-tertiary">
              <CalendarDays className="h-3.5 w-3.5" /> Total
            </div>
            <p className="text-xl font-bold text-primary">{total}</p>
          </Card>
          <Card className="p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-tertiary">
              <UserCheck className="h-3.5 w-3.5" /> Upcoming
            </div>
            <p className="text-xl font-bold text-primary">{upcoming}</p>
          </Card>
          <Card className="p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-tertiary">
              <FileText className="h-3.5 w-3.5" /> Past
            </div>
            <p className="text-xl font-bold text-primary">{Math.max(0, total - upcoming)}</p>
          </Card>
        </div>
      )}

      <FilterBar
        search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} searchPlaceholder="Search meetings..."
        filters={[]}
      />

      <Table
        columns={columns} data={meetings} loading={isLoading}
        onRowClick={(m) => openDrawer("meeting", m.id)}
        keyExtractor={(m) => m.id}
        page={page} total={total} totalPages={data?.total_pages}
        onPageChange={setPage}
        emptyState={
          <div className="flex flex-col items-center py-16 text-center">
            <CalendarDays className="h-12 w-12 text-tertiary mb-3" />
            <h3 className="text-lg font-semibold text-primary">No meetings</h3>
            <p className="text-sm text-secondary mt-1 mb-4">Schedule your first meeting.</p>
            <Button onClick={() => navigate("/work/meetings/new")}><Plus className="h-4 w-4" /> Schedule Meeting</Button>
          </div>
        }
      />
    </div>
  );
}
