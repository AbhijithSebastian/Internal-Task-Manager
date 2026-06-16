import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersService } from "@/features/users/services/users";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoading } from "@/components/shared/LoadingSpinner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useState } from "react";
import { Pencil, Trash2, UserCheck, UserX, ArrowLeft } from "lucide-react";
import { formatDate, formatDateTime } from "@/utils/formatters";
import { useAuth } from "@/store/auth";

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser, hasPermission } = useAuth();
  const [showDelete, setShowDelete] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: () => usersService.get(Number(id)),
    enabled: Boolean(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => usersService.delete(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      navigate("/users");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: () => usersService.toggleActive(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", id] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  if (isLoading) return <PageLoading />;
  if (!user) return <p>User not found.</p>;

  const canEdit = hasPermission("user-edit") || currentUser?.id === user.id;
  const canDelete = hasPermission("user-delete");

  return (
    <div>
      <PageHeader
        title={user.name}
        description={user.job_title || "No job title"}
        actions={
          <div className="flex gap-2">
            <Link to="/users" className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            {canEdit && (
              <Link to={`/users/${user.id}/edit`} className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted">
                <Pencil className="h-4 w-4" /> Edit
              </Link>
            )}
            {canDelete && (
              <button onClick={() => setShowDelete(true)} className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            )}
          </div>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Details</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Email</dt><dd>{user.email}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Job Title</dt><dd>{user.job_title || "-"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Status</dt>
              <dd>{user.is_active !== false
                ? <span className="inline-flex items-center gap-1 text-green-600"><UserCheck className="h-3 w-3" /> Active</span>
                : <span className="inline-flex items-center gap-1 text-red-600"><UserX className="h-3 w-3" /> Inactive</span>
              }</dd>
            </div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Roles</dt><dd>{user.roles?.map((r) => r.name).join(", ") || "-"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Joined</dt><dd>{formatDate(user.created_at)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Last Updated</dt><dd>{formatDateTime(user.updated_at)}</dd></div>
          </dl>
          <button
            onClick={() => toggleActiveMutation.mutate()}
            disabled={toggleActiveMutation.isPending}
            className="mt-4 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            {toggleActiveMutation.isPending ? "Updating..." : user.is_active !== false ? "Deactivate User" : "Activate User"}
          </button>
        </div>
      </div>
      <ConfirmDialog
        open={showDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${user.name}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setShowDelete(false)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
