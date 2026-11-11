import { useState } from "react";
import { Badge, Button, Drawer, Skeleton } from "@/design-system";
import { HttpMethodBadge } from "./HttpMethodBadge";
import { EndpointStatusBadge } from "./EndpointStatusBadge";
import { JsonViewer } from "./JsonViewer";
import { ParameterTable } from "./ParameterTable";
import { useEndpoint } from "../hooks/useEndpoints";
import { EndpointReferencesSection } from "./EndpointReferences";
import { EndpointActivitySection } from "./EndpointActivity";
import { formatDate, formatRelative } from "@/utils/formatters";
import { Tag, User, Clock, Copy, Check } from "lucide-react";
import type { Endpoint, EndpointParameter } from "@/types/endpoints";

interface EndpointDetailDrawerProps {
  endpointId: number | null;
  onClose: () => void;
  onEdit?: (e: Endpoint) => void;
  onDelete?: (e: Endpoint) => void;
}

type Tab =
  | "overview"
  | "headers"
  | "auth"
  | "parameters"
  | "request"
  | "responses"
  | "examples"
  | "snippets"
  | "references"
  | "activity";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "headers", label: "Headers" },
  { id: "auth", label: "Authentication" },
  { id: "parameters", label: "Parameters" },
  { id: "request", label: "Request Body" },
  { id: "responses", label: "Responses" },
  { id: "examples", label: "Examples" },
  { id: "snippets", label: "Code Snippets" },
  { id: "references", label: "References" },
  { id: "activity", label: "Activity" },
];

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

function SnippetSection({
  url,
  method,
  headers,
  requestBody,
}: {
  url: string;
  method: string;
  headers: EndpointParameter[];
  requestBody?: Record<string, unknown>;
}) {
  const [copied, setCopied] = useState("");

  const copy = (id: string, text: string) => {
    copyToClipboard(text);
    setCopied(id);
    setTimeout(() => setCopied(""), 2000);
  };

  const headerLines = headers
    .map((h) => `  -H "${h.name}: ${h.example || h.default || ""}"`)
    .join("\n");
  const bodyJson = requestBody ? JSON.stringify(requestBody, null, 2) : "";
  const curlCmd = `curl -X ${method} "${url}"${headers.length > 0 ? `\n${headerLines}` : ""}${bodyJson ? `\n  -d '${bodyJson}'` : ""}`;
  const fetchCode = `fetch("${url}", {\n  method: "${method}",${headers.length > 0 ? `\n  headers: {\n${headers.map((h) => `    "${h.name}": "${h.example || h.default || ""}"`).join(",\n")}\n  }` : ""}${bodyJson ? `,\n  body: JSON.stringify(${bodyJson.replace(/\n/g, "\n  ")})\n` : "\n"}});`;
  const pythonCode = `import requests\n\nresponse = requests.${method.toLowerCase()}("${url}"${headers.length > 0 ? `,\n  headers={\n${headers.map((h) => `    "${h.name}": "${h.example || h.default || ""}"`).join(",\n")}\n  }` : ""}${bodyJson ? `,\n  json=${bodyJson.replace(/\n/g, "\n  ")}` : ""}\n)`;

  const snippets = [
    { id: "url", label: "URL", lang: "text", code: url },
    { id: "curl", label: "cURL", lang: "bash", code: curlCmd },
    { id: "fetch", label: "JavaScript (fetch)", lang: "javascript", code: fetchCode },
    { id: "python", label: "Python (requests)", lang: "python", code: pythonCode },
  ];

  return (
    <div className="space-y-3">
      {snippets.map((s) => (
        <div key={s.id} className="overflow-hidden rounded-lg border border-subtle">
          <div className="bg-soft flex items-center justify-between border-b border-subtle px-3 py-1.5">
            <span className="text-xs font-medium text-secondary">{s.label}</span>
            <button
              onClick={() => copy(s.id, s.code)}
              className="flex items-center gap-1 text-xs text-tertiary transition-colors hover:text-primary"
            >
              {copied === s.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied === s.id ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap break-all p-3 font-mono text-xs text-primary">
            {s.code}
          </pre>
        </div>
      ))}
    </div>
  );
}

export function EndpointDetailDrawer({
  endpointId,
  onClose,
  onEdit,
  onDelete,
}: EndpointDetailDrawerProps) {
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
          <div className="flex flex-wrap items-center gap-2">
            <HttpMethodBadge method={e.method} size="md" />
            <EndpointStatusBadge status={e.status} />
            <Badge variant="neutral" size="sm">
              v{e.version}
            </Badge>
          </div>

          <p className="break-all rounded bg-subtle p-2 font-mono text-xs text-secondary">
            {e.url}
          </p>

          {e.description && <p className="text-sm text-secondary">{e.description}</p>}

          {e.tags && e.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-tertiary" />
              {e.tags.map((tag) => (
                <Badge key={tag} variant="default" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-tertiary">
            {e.owner && (
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {e.owner.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Updated {formatRelative(e.updated_at)}
            </span>
          </div>

          <div className="border-t border-subtle pt-4">
            <div className="mb-4 flex gap-1 overflow-x-auto border-b border-subtle pb-2">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    tab === t.id
                      ? "bg-primary-soft text-primary"
                      : "text-tertiary hover:bg-hover hover:text-secondary"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "overview" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-tertiary">Created</span>
                    <p className="text-primary">{formatDate(e.created_at)}</p>
                  </div>
                  <div>
                    <span className="text-tertiary">Updated</span>
                    <p className="text-primary">{formatRelative(e.updated_at)}</p>
                  </div>
                  <div>
                    <span className="text-tertiary">Version</span>
                    <p className="text-primary">{e.version}</p>
                  </div>
                  <div>
                    <span className="text-tertiary">Status</span>
                    <p className="text-primary">
                      <EndpointStatusBadge status={e.status} />
                    </p>
                  </div>
                  {e.owner && (
                    <div>
                      <span className="text-tertiary">Owner</span>
                      <p className="text-primary">{e.owner.name}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-tertiary">Reference count</span>
                    <p className="text-primary">{e.reference_count}</p>
                  </div>
                </div>
                {onEdit && onDelete && (
                  <div className="flex items-center gap-2 pt-2">
                    <Button size="sm" variant="secondary" onClick={() => onEdit(e)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDelete(e)}>
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            )}

            {tab === "headers" && (
              <ParameterTable
                parameters={e.headers as EndpointParameter[]}
                title="Headers"
                emptyMessage="No headers defined"
              />
            )}

            {tab === "auth" && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-tertiary">
                  Authentication
                </p>
                <JsonViewer data={e.authentication ?? {}} collapsed={false} />
              </div>
            )}

            {tab === "parameters" && (
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-tertiary">
                    Query Parameters
                  </p>
                  <ParameterTable
                    parameters={e.query_params as EndpointParameter[]}
                    emptyMessage="No query parameters"
                  />
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-tertiary">
                    Path Parameters
                  </p>
                  <ParameterTable
                    parameters={e.path_params as EndpointParameter[]}
                    emptyMessage="No path parameters"
                  />
                </div>
              </div>
            )}

            {tab === "request" && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-tertiary">
                  Request Body
                </p>
                <JsonViewer data={e.request_body ?? {}} collapsed={false} />
              </div>
            )}

            {tab === "responses" && (
              <div className="space-y-4">
                {e.status_codes && e.status_codes.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-tertiary">
                      Status Codes
                    </p>
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
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-tertiary">
                    Response Body
                  </p>
                  <JsonViewer data={e.response_body ?? {}} collapsed={false} />
                </div>
              </div>
            )}

            {tab === "examples" && (
              <div className="space-y-4">
                {e.example_requests && e.example_requests.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-tertiary">
                      Example Requests
                    </p>
                    {e.example_requests.map((ex, i) => (
                      <div key={i} className="mb-3">
                        {ex.title && <p className="mb-1 text-xs text-secondary">{ex.title}</p>}
                        <JsonViewer data={ex.content} collapsed maxHeight="200px" />
                      </div>
                    ))}
                  </div>
                )}
                {e.example_responses && e.example_responses.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-tertiary">
                      Example Responses
                    </p>
                    {e.example_responses.map((ex, i) => (
                      <div key={i} className="mb-3">
                        {ex.title && <p className="mb-1 text-xs text-secondary">{ex.title}</p>}
                        <JsonViewer data={ex.content} collapsed maxHeight="200px" />
                      </div>
                    ))}
                  </div>
                )}
                {(!e.example_requests || e.example_requests.length === 0) &&
                  (!e.example_responses || e.example_responses.length === 0) && (
                    <p className="text-xs italic text-tertiary">No examples defined</p>
                  )}
              </div>
            )}

            {tab === "snippets" && (
              <SnippetSection
                url={e.url}
                method={e.method}
                headers={e.headers as EndpointParameter[]}
                requestBody={e.request_body}
              />
            )}
            {tab === "references" && <EndpointReferencesSection endpointId={e.id} />}
            {tab === "activity" && <EndpointActivitySection endpointId={e.id} />}
          </div>
        </div>
      )}
    </Drawer>
  );
}
