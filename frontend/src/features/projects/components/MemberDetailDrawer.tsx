import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Avatar, Badge, Drawer, Skeleton } from "@/design-system";
import { formatDate, formatRelative } from "@/utils/formatters";
import {
  Mail,
  Phone,
  Building2,
  Briefcase,
  Hash,
  CalendarDays,
  Clock,
  Shield,
  KeyRound,
} from "lucide-react";
import type { User, ProjectMember } from "@/types";

interface MemberDetailDrawerProps {
  member: ProjectMember | null;
  onClose: () => void;
}

export function MemberDetailDrawer({ member, onClose }: MemberDetailDrawerProps) {
  const { data: userData, isLoading } = useQuery({
    queryKey: ["user", member?.user_id],
    queryFn: () => api.get(`/users/${member!.user_id}`).then((r) => r.data?.data || r.data),
    enabled: Boolean(member?.user_id),
  });

  const user = userData as User | undefined;

  return (
    <Drawer open={Boolean(member)} onClose={onClose} title={member?.user?.name || "Member"}>
      {isLoading ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton variant="circle" className="h-14 w-14" />
            <div className="space-y-2">
              <Skeleton variant="rect" className="h-5 w-36" />
              <Skeleton variant="rect" className="h-3 w-24" />
            </div>
          </div>
          <Skeleton variant="rect" className="h-8 w-full" />
          <Skeleton variant="rect" className="h-48 w-full" />
        </div>
      ) : !user ? (
        <p className="text-sm text-secondary">User not found</p>
      ) : (
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <Avatar name={user.name} size="lg" />
            <div>
              <h3 className="text-lg font-semibold text-primary">{user.name}</h3>
              <div className="mt-0.5 flex items-center gap-2">
                {user.job_title && <span className="text-sm text-secondary">{user.job_title}</span>}
                {member && (
                  <Badge
                    variant={
                      member.role === "manager"
                        ? "info"
                        : member.role === "lead"
                          ? "warning"
                          : "default"
                    }
                    size="sm"
                  >
                    {member.role}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Role & Permissions */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-soft space-y-1.5 rounded-lg border border-subtle p-3">
              <div className="flex items-center gap-1.5 text-xs text-tertiary">
                <Shield className="h-3.5 w-3.5" />
                Role
              </div>
              <p className="text-sm font-medium text-primary">
                {user.role_label || user.role || "—"}
              </p>
            </div>
            <div className="bg-soft space-y-1.5 rounded-lg border border-subtle p-3">
              <div className="flex items-center gap-1.5 text-xs text-tertiary">
                <KeyRound className="h-3.5 w-3.5" />
                Permissions
              </div>
              <p className="text-sm font-medium text-primary">
                {user.effective_permissions?.length ?? user.permissions?.length ?? 0} assigned
              </p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-tertiary">Contact</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 shrink-0 text-tertiary" />
                <span className="text-primary">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 shrink-0 text-tertiary" />
                <span className="text-primary">{user.phone || "—"}</span>
              </div>
            </div>
          </div>

          {/* Employment Info */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-tertiary">
              Employment
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-tertiary">
                  <Building2 className="h-3.5 w-3.5" />
                  Department
                </div>
                <p className="text-sm text-primary">{user.department || "—"}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-tertiary">
                  <Briefcase className="h-3.5 w-3.5" />
                  Designation
                </div>
                <p className="text-sm text-primary">{user.designation || user.job_title || "—"}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-tertiary">
                  <Hash className="h-3.5 w-3.5" />
                  Employee ID
                </div>
                <p className="text-sm text-primary">{user.employee_id || "—"}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-tertiary">
                  <Shield className="h-3.5 w-3.5" />
                  Super Admin
                </div>
                <p className="text-sm text-primary">{user.is_super_admin ? "Yes" : "No"}</p>
              </div>
            </div>
          </div>

          {/* Activity Info */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-tertiary">
              Activity
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-tertiary">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Joined
                </div>
                <p className="text-sm text-primary">{formatDate(user.created_at)}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-tertiary">
                  <Clock className="h-3.5 w-3.5" />
                  Last Login
                </div>
                <p className="text-sm text-primary">
                  {user.last_login_at ? formatRelative(user.last_login_at) : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="bg-soft flex items-center justify-between rounded-lg border border-subtle p-3">
            <span className="text-sm font-medium text-primary">Account Status</span>
            <Badge variant={user.is_active ? "success" : "danger"} size="sm">
              {user.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      )}
    </Drawer>
  );
}
