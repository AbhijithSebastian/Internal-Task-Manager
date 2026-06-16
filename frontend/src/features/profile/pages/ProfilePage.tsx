import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/store/auth";
import { profileService } from "@/features/profile/services/profile";
import { PageHeader } from "@/components/shared/PageHeader";
import { User } from "lucide-react";
import { formatDate } from "@/utils/formatters";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "", email: "", job_title: "", password: "", password_confirmation: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        name: user.name || "",
        email: user.email || "",
        job_title: user.job_title || "",
      }));
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: (data: any) => profileService.update(data),
    onSuccess: (updatedUser) => {
      if (setUser) setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      setForm((f) => ({ ...f, password: "", password_confirmation: "" }));
      setError("");
    },
    onError: (err: any) => {
      setError(err?.response?.data?.detail || "Failed to update profile");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password && form.password !== form.password_confirmation) {
      setError("Passwords do not match");
      return;
    }
    const payload: any = { name: form.name, email: form.email, job_title: form.job_title };
    if (form.password) payload.password = form.password;
    mutation.mutate(payload);
  };

  if (!user) return null;

  return (
    <div>
      <PageHeader title="Profile" description="Manage your account information." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <User className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-xl font-semibold">{user.name}</h2>
          <p className="text-sm text-muted-foreground">{user.job_title || "No title"}</p>
          <p className="mt-2 text-xs text-muted-foreground">Member since {formatDate(user.created_at)}</p>
          <div className="mt-4">
            {user.roles?.map((r) => (
              <span key={r.id} className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize">
                {r.name}
              </span>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Edit Profile</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium">Name</label>
                  <input type="text" required className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium">Email</label>
                  <input type="email" required className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium">Job Title</label>
                  <input type="text" className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium">New Password</label>
                  <input type="password" className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" placeholder="Leave blank to keep" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium">Confirm Password</label>
                  <input type="password" className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" placeholder="Leave blank to keep" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} />
                </div>
              </div>
              <button type="submit" disabled={mutation.isPending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                {mutation.isPending ? "Saving..." : "Update Profile"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
