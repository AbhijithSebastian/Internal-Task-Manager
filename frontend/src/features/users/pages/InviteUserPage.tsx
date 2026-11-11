import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { usersService } from "@/features/users/services/users";
import { Button, Card, Input, Select } from "@/design-system";
import { useAuth } from "@/store/auth";
import { ArrowLeft, Shield } from "lucide-react";

export default function InviteUserPage() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const isEdit = !!userId;
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", email: "", job_title: "", role_name: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: userData } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => usersService.get(Number(userId)),
    enabled: isEdit,
  });

  const { data: rolesData, isError: rolesError } = useQuery({
    queryKey: ["roles"],
    queryFn: () => api.get("/roles").then((r) => r.data || []),
  });

  const roles = (Array.isArray(rolesData) ? rolesData : []) as {
    id: number;
    name: string;
    label: string;
  }[];

  useEffect(() => {
    if (userData && isEdit) {
      const u = userData as any;
      setForm({
        name: u.name || "",
        email: u.email || "",
        job_title: u.job_title || "",
        role_name: u.role || "",
      });
    }
  }, [userData, isEdit]);

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => {
      const pw = Math.random().toString(36).slice(2, 10);
      return usersService.create({
        name: data.name,
        email: data.email,
        job_title: data.job_title,
        role: (data.role as string) || "",
        password: pw,
        password_confirmation: pw,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      navigate("/work/users");
    },
    onError: (err: { response?: { data?: { errors?: Record<string, string[]> } } }) => {
      const es = err.response?.data?.errors;
      if (es) {
        const flat: Record<string, string> = {};
        for (const [k, v] of Object.entries(es)) flat[k] = (v as string[])[0];
        setErrors(flat);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => {
      const payload = { ...data };
      return usersService.update(Number(userId), payload as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      navigate("/work/users");
    },
    onError: (err: { response?: { data?: { errors?: Record<string, string[]> } } }) => {
      const es = err.response?.data?.errors;
      if (es) {
        const flat: Record<string, string> = {};
        for (const [k, v] of Object.entries(es)) flat[k] = (v as string[])[0];
        setErrors(flat);
      }
    },
  });

  const mutation = isEdit ? updateMutation : createMutation;

  if (!hasPermission("user-create")) {
    return (
      <div className="page-container py-6">
        <p className="text-sm text-secondary">You don't have permission to invite users.</p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const payload: Record<string, unknown> = {
      name: form.name,
      email: form.email,
      job_title: form.job_title,
      role: form.role_name || undefined,
    };
    if (!payload.role) delete payload.role;
    mutation.mutate(payload);
  };

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const roleOptions = roles.map((r) => ({ value: r.name, label: r.label || r.name }));
  const isSending = createMutation.isPending || updateMutation.isPending;

  if (rolesError) {
    return (
      <div className="page-container py-6">
        <p className="text-sm text-danger">Failed to load roles. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="page-container max-w-xl py-6">
      <div className="mb-5 flex items-center gap-3">
        <button
          onClick={() => navigate("/work/users")}
          className="rounded-md p-1 text-tertiary transition-colors hover:bg-hover hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-bold text-primary">{isEdit ? "Edit User" : "Invite User"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <div className="space-y-4">
            <Input
              label="Full name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              error={errors.name}
              required
              placeholder="Jane Smith"
            />
            <Input
              label="Email address"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              error={errors.email}
              required
              placeholder="jane@company.com"
            />
            <Input
              label="Job title"
              value={form.job_title}
              onChange={(e) => update("job_title", e.target.value)}
              error={errors.job_title}
              placeholder="Software Engineer"
            />
            <Select
              label="Role"
              value={form.role_name}
              onChange={(e) => update("role_name", e.target.value)}
              error={errors.role_name}
              placeholder="No role assigned"
              options={roleOptions}
            />
          </div>
        </Card>

        {!isEdit && (
          <div className="flex items-center gap-4 rounded-lg bg-semantic-info-soft p-4">
            <Shield className="h-5 w-5 shrink-0 text-semantic-info" />
            <p className="text-xs text-secondary">
              An email will be sent to the user with instructions to set up their account and
              password.
            </p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSending}>
            {isEdit ? "Save Changes" : "Send Invitation"}
          </Button>
          <Button variant="secondary" onClick={() => navigate("/work/users")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
