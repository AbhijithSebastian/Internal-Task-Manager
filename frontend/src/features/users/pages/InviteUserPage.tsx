import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersService } from "@/features/users/services/users";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/store/auth";
import { ArrowLeft, Shield } from "lucide-react";

export default function InviteUserPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", email: "", job_title: "", role_id: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      usersService.create({ ...data, password: Math.random().toString(36).slice(2, 10) } as any).then((r) => r),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["users"] }); navigate("/work/users"); },
    onError: (err: { response?: { data?: { errors?: Record<string, string[]> } } }) => {
      const es = err.response?.data?.errors;
      if (es) {
        const flat: Record<string, string> = {};
        for (const [k, v] of Object.entries(es)) flat[k] = (v as string[])[0];
        setErrors(flat);
      }
    },
  });

  if (!hasPermission("user-create")) return <div className="page-container py-6"><p className="text-sm text-secondary">You don't have permission to invite users.</p></div>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const payload: Record<string, unknown> = { ...form, role_id: form.role_id ? Number(form.role_id) : undefined };
    if (!payload.role_id) delete payload.role_id;
    mutation.mutate(payload);
  };

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="page-container max-w-xl py-6">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate("/work/users")} className="p-1 rounded-md text-tertiary hover:text-primary hover:bg-hover transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-bold text-primary">Invite User</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <div className="space-y-4">
            <Input label="Full name" value={form.name} onChange={(e) => update("name", e.target.value)} error={errors.name} required placeholder="Jane Smith" />
            <Input label="Email address" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} error={errors.email} required placeholder="jane@company.com" />
            <Input label="Job title" value={form.job_title} onChange={(e) => update("job_title", e.target.value)} error={errors.job_title} placeholder="Software Engineer" />
            <Select label="Role" value={form.role_id} onChange={(e) => update("role_id", e.target.value)} error={errors.role_id} options={[
              { value: "", label: "No role assigned" },
              { value: "1", label: "Admin" },
              { value: "2", label: "Manager" },
              { value: "3", label: "Team Lead" },
              { value: "4", label: "Member" },
            ]} />
          </div>
        </Card>

        <div className="flex items-center gap-4 p-4 bg-semantic-info-soft rounded-lg">
          <Shield className="h-5 w-5 text-semantic-info shrink-0" />
          <p className="text-xs text-secondary">An email will be sent to the user with instructions to set up their account and password.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={mutation.isPending}>Send Invitation</Button>
          <Button variant="secondary" onClick={() => navigate("/work/users")}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
