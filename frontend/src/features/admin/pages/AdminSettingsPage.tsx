import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ToggleLeft, Settings, Globe, Mail, Key, Shield } from "lucide-react";

export default function AdminSettingsPage() {
  const { data: config, isLoading, isError } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => api.get("/admin/settings").then((r) => r.data?.data || r.data || {}),
  });

  const c = (config || {}) as Record<string, unknown>;

  const sections = [
    { icon: Globe, label: "General", items: [
      { key: "app_name", label: "Application Name" },
      { key: "app_url", label: "Application URL" },
      { key: "timezone", label: "Timezone" },
      { key: "locale", label: "Locale" },
    ]},
    { icon: Mail, label: "Email", items: [
      { key: "mail_from_address", label: "From Address" },
      { key: "mail_from_name", label: "From Name" },
      { key: "mail_driver", label: "Mail Driver" },
    ]},
    { icon: Shield, label: "Security", items: [
      { key: "password_min_length", label: "Min Password Length" },
      { key: "session_lifetime", label: "Session Lifetime (min)" },
      { key: "two_factor_enabled", label: "Two-Factor Auth" },
      { key: "lockout_threshold", label: "Lockout Threshold" },
    ]},
    { icon: Key, label: "API", items: [
      { key: "api_rate_limit", label: "Rate Limit (req/min)" },
      { key: "api_version", label: "API Version" },
    ]},
  ];

  return (
    <div className="page-container py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-primary">Administration</h1>
      </div>

      <div className="flex gap-2">
        {[
          { id: "roles", label: "Roles", icon: Shield },
          { id: "permissions", label: "Permissions", icon: ToggleLeft },
          { id: "integrations", label: "Integrations", icon: Settings },
          { id: "settings", label: "Settings", icon: Globe },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => {
              if (t.id === "roles") window.location.href = "/work/admin/roles";
            }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                t.id === "settings" ? "bg-primary-soft text-primary" : "text-tertiary hover:text-primary hover:bg-hover"
              }`}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rect" className="h-32 w-full rounded-lg" />)}</div>
      ) : isError ? (
        <div className="flex flex-col items-center py-16 text-center"><p className="text-sm text-danger">Failed to load settings.</p></div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.label}>
                <div className="flex items-center gap-2 mb-4">
                  <Icon className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-primary">{section.label}</h3>
                </div>
                <div className="space-y-3">
                  {section.items.map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-1.5">
                      <span className="text-sm text-secondary">{item.label}</span>
                      <span className="text-sm text-primary font-medium">{String(c[item.key] ?? "—")}</span>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
