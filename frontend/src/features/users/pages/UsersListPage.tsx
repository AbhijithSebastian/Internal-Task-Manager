import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersService } from "@/features/users/services/users";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Plus, UserCheck, UserX } from "lucide-react";
import { formatDate } from "@/utils/formatters";
import { useAuth } from "@/store/auth";
import type { User } from "@/types";

export default function UsersListPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["users", page, search, sortBy, sortDir],
    queryFn: () => usersService.list({ page, search, sort_by: sortBy, sort_direction: sortDir }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDeleteId(null);
    },
  });

  const canCreate = hasPermission("user-create");

  const columns: Column<User>[] = [
    { key: "name", label: "Name", sortable: true,
      render: (u) => (
        <Link to={`/users/${u.id}`} className="font-medium hover:underline">
          {u.name} {u.is_active === false && <span className="text-xs text-muted-foreground">(inactive)</span>}
        </Link>
      ),
    },
    { key: "email", label: "Email", sortable: true },
    { key: "job_title", label: "Job Title", sortable: true,
      render: (u) => u.job_title || "-",
    },
    { key: "roles", label: "Roles",
      render: (u) => u.roles?.map((r) => r.name).join(", ") || "-",
    },
    { key: "is_active", label: "Status",
      render: (u) => u.is_active !== false
        ? <span className="inline-flex items-center gap-1 text-xs text-green-600"><UserCheck className="h-3 w-3" />Active</span>
        : <span className="inline-flex items-center gap-1 text-xs text-red-600"><UserX className="h-3 w-3" />Inactive</span>,
    },
    { key: "created_at", label: "Joined", sortable: true,
      render: (u) => formatDate(u.created_at),
    },
  ];

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage all users in the system."
        actions={
          canCreate ? (
            <Link to="/users/new" className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" /> Add User
            </Link>
          ) : undefined
        }
      />
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search users..."
          className="block w-full max-w-sm rounded-md border px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={isLoading}
        sortBy={sortBy}
        sortDirection={sortDir}
        onSort={handleSort}
        page={page}
        totalPages={data?.total_pages}
        onPageChange={setPage}
        keyExtractor={(u) => u.id}
        emptyMessage="No users found."
      />
      <ConfirmDialog
        open={deleteId !== null}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
