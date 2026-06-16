import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { announcementsService } from "@/features/announcements/services/announcements";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Plus } from "lucide-react";
import { formatDate } from "@/utils/formatters";
import { useAuth } from "@/store/auth";
import type { Announcement } from "@/types";

export default function AnnouncementListPage() {
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["announcements", page, search],
    queryFn: () => announcementsService.list({ page, search, per_page: 15 }),
  });

  const canCreate = hasPermission("announcement-create");

  const columns: Column<Announcement>[] = [
    { key: "title", label: "Title",
      render: (a) => <span className="font-medium">{a.title}</span>,
    },
    { key: "status", label: "Status",
      render: (a) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${a.status === "published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
          {a.status}
        </span>
      ),
    },
    { key: "author", label: "Author",
      render: (a) => (a as any).author?.name || "N/A",
    },
    { key: "created_at", label: "Created",
      render: (a) => formatDate(a.created_at),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Announcements"
        description="Manage announcements."
        actions={canCreate ? (
          <Link to="/announcements/new" className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> New Announcement
          </Link>
        ) : undefined}
      />
      <div className="mb-4">
        <input type="text" placeholder="Search announcements..." className="block w-full max-w-sm rounded-md border px-3 py-2 text-sm"
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={isLoading}
        page={page}
        totalPages={data?.total_pages}
        onPageChange={setPage}
        keyExtractor={(a) => a.id}
        emptyMessage="No announcements found."
      />
    </div>
  );
}
