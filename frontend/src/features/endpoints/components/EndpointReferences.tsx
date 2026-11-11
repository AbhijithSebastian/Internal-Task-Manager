import { useState } from "react";
import { Badge, Button, Input, Select, Skeleton } from "@/design-system";
import {
  useEndpointReferences,
  useAddEndpointReference,
  useRemoveEndpointReference,
} from "../hooks/useEndpoints";
import { formatRelative } from "@/utils/formatters";
import { Link, Unlink, Plus } from "lucide-react";
import { REFERENCE_TYPES } from "@/types/endpoints";

const REFERENCE_LABELS: Record<string, string> = {
  task: "Task",
  resource: "Resource",
  design: "Design",
  meeting: "Meeting",
};

interface EndpointReferencesSectionProps {
  endpointId: number;
}

export function EndpointReferencesSection({ endpointId }: EndpointReferencesSectionProps) {
  const { data, isLoading } = useEndpointReferences(endpointId);
  const addReference = useAddEndpointReference(endpointId);
  const removeReference = useRemoveEndpointReference(endpointId);
  const [showForm, setShowForm] = useState(false);
  const [linkedType, setLinkedType] = useState("");
  const [linkedId, setLinkedId] = useState("");

  if (isLoading) return <Skeleton variant="rect" className="h-24 w-full" />;

  const refs = data?.references ?? [];

  const handleAdd = () => {
    if (!linkedType || !linkedId.trim()) return;
    addReference.mutate(
      { linked_type: linkedType, linked_id: parseInt(linkedId, 10) },
      {
        onSuccess: () => {
          setShowForm(false);
          setLinkedType("");
          setLinkedId("");
        },
      },
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-tertiary">
          {refs.length} reference{refs.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" variant="secondary" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>
      {showForm && (
        <div className="flex items-end gap-2 rounded-md bg-subtle p-3">
          <Select
            options={REFERENCE_TYPES.map((t) => ({ value: t, label: REFERENCE_LABELS[t] ?? t }))}
            value={linkedType}
            onChange={(e) => setLinkedType(e.target.value)}
          />
          <Input placeholder="ID" value={linkedId} onChange={(e) => setLinkedId(e.target.value)} />
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={addReference.isPending || !linkedType || !linkedId}
          >
            Link
          </Button>
        </div>
      )}
      {refs.length === 0 ? (
        <p className="text-sm text-tertiary">No references yet.</p>
      ) : (
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {refs.map((ref) => (
            <div
              key={ref.id}
              className="flex items-center justify-between rounded-md bg-subtle px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <Link className="h-4 w-4 text-tertiary" />
                <Badge variant="info" size="sm">
                  {REFERENCE_LABELS[ref.linked_type] ?? ref.linked_type}
                </Badge>
                <span className="text-sm text-primary">#{ref.linked_id}</span>
                <span className="text-xs text-tertiary">{formatRelative(ref.created_at)}</span>
              </div>
              <button
                onClick={() => removeReference.mutate(ref.id)}
                className="rounded p-1 text-secondary hover:bg-hover hover:text-semantic-danger"
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
