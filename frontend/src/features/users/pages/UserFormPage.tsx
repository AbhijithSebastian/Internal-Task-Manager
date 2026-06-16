import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersService } from "@/features/users/services/users";
import { rolesService } from "@/features/roles/services/roles";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoading } from "@/components/shared/LoadingSpinner";

export default function UserFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "", email: "", password: "", password_confirmation: "", job_title: "",
  });
  const [roleId, setRoleId] = useState<number | string>("");
  const [error, setError] = useState("");

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: () => usersService.get(Number(id)),
    enabled: isEdit,
  });

  const { data: rolesData } = useQuery({
    queryKey: ["roles-list"],
    queryFn: () => rolesService.list({ per_page: 100 }),
  });

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, email: user.email, password: "", password_confirmation: "", job_title: user.job_title || "" });
      setRoleId(user.roles?.[0]?.id?.toString() || "");
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit ? usersService.update(Number(id), data) : usersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      navigate(isEdit ? `/users/${id}` : "/users");
    },
    onError: (err: any) => {
      setError(err?.response?.data?.detail || "Failed to save user");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isEdit && form.password !== form.password_confirmation) {
      setError("Passwords do not match");
      return;
    }
    const payload: any = {
      name: form.name,
      email: form.email,
      job_title: form.job_title,
      role_id: roleId ? Number(roleId) : undefined,
    };
    if (form.password) payload.password = form.password;
    mutation.mutate(payload);
  };

  if (isEdit && userLoading) return <PageLoading />;

  return (
    <div>
      <PageHeader title={isEdit ? "Edit User" : "Create User"} />
      <div className="max-w-lg rounded-lg border bg-card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input type="text" required className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input type="email" required className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium">Job Title</label>
            <input type="text" className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium">Role</label>
            <select className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" value={roleId} onChange={(e) => setRoleId(e.target.value)}>
              <option value="">Select role</option>
              {rolesData?.items?.map((r: any) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">{isEdit ? "New Password (leave blank to keep)" : "Password"}</label>
            <input type="password" className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium">Confirm Password</label>
              <input type="password" required className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} />
            </div>
          )}
          <div className="flex gap-3">
            <button type="submit" disabled={mutation.isPending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {mutation.isPending ? "Saving..." : isEdit ? "Update User" : "Create User"}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
