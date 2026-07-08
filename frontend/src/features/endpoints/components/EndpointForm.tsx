import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { X } from "lucide-react";
import { HTTP_METHODS, ENDPOINT_STATUSES } from "@/types/endpoints";
import { useCreateEndpoint, useUpdateEndpoint } from "../hooks/useEndpoints";
import { Badge } from "@/components/ui/Badge";
import type { Endpoint } from "@/types/endpoints";

interface EndpointFormProps {
  projectId: string | number;
  endpoint?: Endpoint | null;
  open: boolean;
  onClose: () => void;
}

export function EndpointForm({ projectId, endpoint, open, onClose }: EndpointFormProps) {
  const isEditing = Boolean(endpoint);
  const createEndpoint = useCreateEndpoint(projectId);
  const updateEndpoint = useUpdateEndpoint();

  const [name, setName] = useState("");
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("draft");
  const [version, setVersion] = useState("1.0");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (endpoint) {
      setName(endpoint.name);
      setMethod(endpoint.method);
      setUrl(endpoint.url);
      setDescription(endpoint.description ?? "");
      setStatus(endpoint.status);
      setVersion(endpoint.version);
      setTags(endpoint.tags ?? []);
    } else {
      setName("");
      setMethod("GET");
      setUrl("");
      setDescription("");
      setStatus("draft");
      setVersion("1.0");
      setTags([]);
    }
  }, [endpoint, open]);

  if (!open) return null;

  const handleAddTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); handleAddTag(); }
  };

  const handleSubmit = () => {
    if (!name.trim() || !url.trim()) return;

    const payload = {
      name: name.trim(),
      method,
      url: url.trim(),
      description: description.trim() || null,
      status,
      version,
      tags: tags.length > 0 ? tags : null,
    };

    if (isEditing && endpoint) {
      updateEndpoint.mutate(
        { id: endpoint.id, data: payload },
        { onSuccess: () => onClose() }
      );
    } else {
      createEndpoint.mutate(
        payload,
        { onSuccess: () => onClose() }
      );
    }
  };

  const isLoading = createEndpoint.isPending || updateEndpoint.isPending;

  return createPortal(
    <div className="fixed inset-0 z-modal flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-lg rounded-lg bg-surface p-6 shadow-modal" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-primary">{isEditing ? "Edit Endpoint" : "Create Endpoint"}</h3>
          <button onClick={onClose} className="p-1 rounded-md text-secondary hover:bg-hover">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4">
          <Input label="Name" placeholder="Get User Profile" value={name} onChange={(e) => setName(e.target.value)} />

          <div className="grid grid-cols-3 gap-3">
            <Select
              label="Method"
              options={HTTP_METHODS.map((m) => ({ value: m, label: m }))}
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            />
            <div className="col-span-2">
              <Input label="URL" placeholder="/api/v1/users/:id" value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
              className="w-full px-3 py-2 rounded-md border border-default bg-surface text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Status"
              options={ENDPOINT_STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            />
            <Input label="Version" placeholder="1.0" value={version} onChange={(e) => setVersion(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">Tags</label>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {tags.map((t) => (
                <Badge key={t} variant="default" size="sm">
                  {t}
                  <button onClick={() => setTags(tags.filter((x) => x !== t))} className="ml-1 hover:text-semantic-danger">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add tag..."
                className="flex-1 h-9 px-3 rounded-md border border-default bg-surface text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-ring"
              />
              <Button variant="secondary" size="sm" onClick={handleAddTag}>Add</Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading || !name.trim() || !url.trim()}>
            {isLoading ? "Saving..." : isEditing ? "Update" : "Create"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
