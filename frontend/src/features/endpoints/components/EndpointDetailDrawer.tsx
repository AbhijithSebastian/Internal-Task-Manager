import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { HttpMethodBadge } from "./HttpMethodBadge";
import { EndpointStatusBadge } from "./EndpointStatusBadge";
import { JsonViewer } from "./JsonViewer";
import { ParameterTable } from "./ParameterTable";
import { useEndpoint } from "../hooks/useEndpoints";
import { EndpointReferencesSection } from "./EndpointReferences";
import { EndpointActivitySection } from "./EndpointActivity";
import { formatDate, formatRelative } from "@/utils/formatters";
import { Tag, User, Clock } from "lucide-react";
import type { Endpoint, EndpointParameter } from "@/types/endpoints";

interface EndpointDetailDrawerProps {
  endpointId: number | null;
  onClose: () => void;
  onEdit?: (e: Endpoint) => void;
  onDelete?: (e: Endpoint) => void;
}

type Tab = "overview" | "headers" | "auth" | "parameters" | "request" | "responses" | "examples" | "references" | "activity";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "headers", label: "Headers" },
  { id: "auth", label: "Authentication" },
  { id: "parameters", label: "Parameters" },
  { id: "request", label: "Request Body" },
  { id: "responses", label: "Responses" },
  { id: "examples", label: "Examples" },
  { id: "references", label: "References" },
  { id: "activity", label: "Activity" },
];

export function EndpointDetailDrawer({ endpointId, onClose, onEdit, onDelete }: EndpointDetailDrawerProps) {
  const { data: endpoint, isLoading } = useEndpoint(endpointId);
  const [tab, setTab] = useState<Tab>("overview");

  if (!endpointId) return null;

  const e = endpoint as Endpoint | undefined;

  return (
    <Drawer open={Boolean(endpointId)} onClose={onClose} title={e?.name || "Endpoint"}>
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton variant="rect" className="h-6 w-48" />
          <Skeleton variant="rect" className="h-8 w-full" />
          <Skeleton variant="rect" className="h-40 w-full" />
        </div>
      ) : !e ? (
        <p className="text-sm text-secondary">Endpoint not found</p>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <HttpMethodBadge method={e.method} size="md" />
            <EndpointStatusBadge status={e.status} />
            <Badge variant="neutral" size="sm">v{e.version}</Badge>
          </div>

          <p className="text-xs font-mono text-secondary break-all bg-subtle rounded p-2">{e.url}</p>

          {e.description && <p className="text-sm text-secondary">{e.description}</p>}

          {e.tags && e.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Tag className="h-3.5 w-3.5 text-tertiary" />
              {e.tags.map((tag) => (
                <Badge key={tag} variant="default" size="sm">{tag}</Badge>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-tertiary">
            {e.owner && <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{e.owner.name}</span>}
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Updated {formatRelative(e.updated_at)}</span>
          </div>

          <div className="border-t border-subtle pt-4">
            <div className="flex gap-1 overflow-x-auto pb-2 mb-4 border-b border-subtle">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`shrink-0 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    tab === t.id ? "bg-primary-soft text-primary" : "text-tertiary hover:text-secondary hover:bg-hover"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "overview" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-tertiary">Created</span><p className="text-primary">{formatDate(e.created_at)}</p></div>
                  <div><span className="text-tertiary">Updated</span><p className="text-primary">{formatRelative(e.updated_at)}</p></div>
                  <div><span className="text-tertiary">Version</span><p className="text-primary">{e.version}</p></div>
                  <div><span className="text-tertiary">Status</span><p className="text-primary"><EndpointStatusBadge status={e.status} /></p></div>
                  {e.owner && <div><span className="text-tertiary">Owner</span><p className="text-primary">{e.owner.name}</p></div>}
                  <div><span className="text-tertiary">Reference count</span><p className="text-primary">{e.reference_count}</p></div>
                </div>
                {onEdit && onDelete && (
                  <div className="flex items-center gap-2 pt-2">
                    <Button size="sm" variant="secondary" onClick={() => onEdit(e)}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => onDelete(e)}>Delete</Button>
                  </div>
                )}
              </div>
            )}

            {tab === "headers" && (
              <ParameterTable parameters={e.headers as EndpointParameter[]} title="Headers" emptyMessage="No headers defined" />
            )}

            {tab === "auth" && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-tertiary uppercase tracking-wide">Authentication</p>
                <JsonViewer data={e.authentication ?? {}} collapsed={false} />
              </div>
            )}

            {tab === "parameters" && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-tertiary uppercase tracking-wide mb-2">Query Parameters</p>
                  <ParameterTable parameters={e.query_params as EndpointParameter[]} emptyMessage="No query parameters" />
                </div>
                <div>
                  <p className="text-xs font-medium text-tertiary uppercase tracking-wide mb-2">Path Parameters</p>
                  <ParameterTable parameters={e.path_params as EndpointParameter[]} emptyMessage="No path parameters" />
                </div>
              </div>
            )}

            {tab === "request" && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-tertiary uppercase tracking-wide">Request Body</p>
                <JsonViewer data={e.request_body ?? {}} collapsed={false} />
              </div>
            )}

            {tab === "responses" && (
              <div className="space-y-4">
                {e.status_codes && e.status_codes.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-tertiary uppercase tracking-wide mb-2">Status Codes</p>
                    <div className="space-y-1">
                      {e.status_codes.map((sc, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="font-mono font-medium text-primary">{sc.code}</span>
                          <span className="text-secondary">{sc.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-tertiary uppercase tracking-wide mb-2">Response Body</p>
                  <JsonViewer data={e.response_body ?? {}} collapsed={false} />
                </div>
              </div>
            )}

            {tab === "examples" && (
              <div className="space-y-4">
                {e.example_requests && e.example_requests.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-tertiary uppercase tracking-wide mb-2">Example Requests</p>
                    {e.example_requests.map((ex, i) => (
                      <div key={i} className="mb-3">
                        {ex.title && <p className="text-xs text-secondary mb-1">{ex.title}</p>}
                        <JsonViewer data={ex.content} collapsed maxHeight="200px" />
                      </div>
                    ))}
                  </div>
                )}
                {e.example_responses && e.example_responses.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-tertiary uppercase tracking-wide mb-2">Example Responses</p>
                    {e.example_responses.map((ex, i) => (
                      <div key={i} className="mb-3">
                        {ex.title && <p className="text-xs text-secondary mb-1">{ex.title}</p>}
                        <JsonViewer data={ex.content} collapsed maxHeight="200px" />
                      </div>
                    ))}
                  </div>
                )}
                {(!e.example_requests || e.example_requests.length === 0) && (!e.example_responses || e.example_responses.length === 0) && (
                  <p className="text-xs text-tertiary italic">No examples defined</p>
                )}
              </div>
            )}

            {tab === "references" && <EndpointReferencesSection endpointId={e.id} />}
            {tab === "activity" && <EndpointActivitySection endpointId={e.id} />}
          </div>
        </div>
      )}
    </Drawer>
  );
}
