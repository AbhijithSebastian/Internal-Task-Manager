import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { useResourceLinks, useAddLink, useRemoveLink } from "../hooks/useResources";
import { formatRelative } from "@/utils/formatters";
import { Link, Unlink, Plus } from "lucide-react";
import { LINKED_TYPES } from "@/types/resources";

const LINKED_TYPE_LABELS: Record<string, string> = {
  task: "Task",
  endpoint: "Endpoint",
  design: "Design",
  meeting: "Meeting",
  report: "Report",
};

interface ResourceLinkedItemsProps {
  resourceId: number;
}

export function ResourceLinkedItems({ resourceId }: ResourceLinkedItemsProps) {
  const { data, isLoading } = useResourceLinks(resourceId);
  const addLink = useAddLink(resourceId);
  const removeLink = useRemoveLink(resourceId);
  const [showForm, setShowForm] = useState(false);
  const [linkedType, setLinkedType] = useState("");
  const [linkedId, setLinkedId] = useState("");

  if (isLoading) return <Skeleton variant="rect" className="h-24 w-full" />;

  const links = data?.links ?? [];

  const handleAdd = () => {
    if (!linkedType || !linkedId.trim()) return;
    addLink.mutate(
      { linked_type: linkedType, linked_id: parseInt(linkedId, 10) },
      { onSuccess: () => { setShowForm(false); setLinkedType(""); setLinkedId(""); } }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-tertiary">{links.length} link{links.length !== 1 ? "s" : ""}</p>
        <Button size="sm" variant="secondary" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-3.5 w-3.5" /> Add Link
        </Button>
      </div>
      {showForm && (
        <div className="flex items-end gap-2 p-3 rounded-md bg-subtle">
          <Select
            options={LINKED_TYPES.map((t) => ({ value: t, label: LINKED_TYPE_LABELS[t] ?? t }))}
            value={linkedType}
            onChange={(e) => setLinkedType(e.target.value)}
          />
          <Input placeholder="Record ID" value={linkedId} onChange={(e) => setLinkedId(e.target.value)} />
          <Button size="sm" onClick={handleAdd} disabled={addLink.isPending || !linkedType || !linkedId}>
            Link
          </Button>
        </div>
      )}
      {links.length === 0 ? (
        <p className="text-sm text-tertiary">No linked items yet.</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {links.map((link) => (
            <div key={link.id} className="flex items-center justify-between py-2 px-3 rounded-md bg-subtle">
              <div className="flex items-center gap-2">
                <Link className="h-4 w-4 text-tertiary" />
                <Badge variant="info" size="sm">{LINKED_TYPE_LABELS[link.linked_type] ?? link.linked_type}</Badge>
                <span className="text-sm text-primary">#{link.linked_id}</span>
                <span className="text-xs text-tertiary">{formatRelative(link.created_at)}</span>
              </div>
              <button
                onClick={() => removeLink.mutate(link.id)}
                className="p-1 rounded text-secondary hover:bg-hover hover:text-semantic-danger"
              >
                <Unlink className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
