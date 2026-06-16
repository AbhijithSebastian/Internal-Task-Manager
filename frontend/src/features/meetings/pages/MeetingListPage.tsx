import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { meetingsService } from "@/features/meetings/services/meetings";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Plus } from "lucide-react";
import { formatDate, formatDateTime } from "@/utils/formatters";
import { useAuth } from "@/store/auth";
import type { Meeting } from "@/types";

export default function MeetingListPage() {
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["meetings", page, search],
    queryFn: () => meetingsService.list({ page, search, per_page: 15 }),
  });

  const canCreate = hasPermission("meeting-create");

  const columns: Column<Meeting>[] = [
    { key: "title", label: "Title",
      render: (m) => <Link to={`/meetings`} className="font-medium hover:underline">{m.title}</Link>,
    },
    { key: "meeting_date", label: "Date",
      render: (m) => m.meeting_date ? formatDateTime(m.meeting_date) : "-",
    },
    { key: "location", label: "Location",
      render: (m) => m.location || "N/A",
    },
    { key: "organizer", label: "Organizer",
      render: (m) => (m as any).organizer?.name || "N/A",
    },
    { key: "created_at", label: "Created",
      render: (m) => formatDate(m.created_at),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Meetings"
        description="Manage meetings."
        actions={canCreate ? (
          <Link to="/meetings/new" className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> New Meeting
          </Link>
        ) : undefined}
      />
      <div className="mb-4">
        <input type="text" placeholder="Search meetings..." className="block w-full max-w-sm rounded-md border px-3 py-2 text-sm"
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={isLoading}
        page={page}
        totalPages={data?.total_pages}
        onPageChange={setPage}
        keyExtractor={(m) => m.id}
        emptyMessage="No meetings found."
      />
    </div>
  );
}
