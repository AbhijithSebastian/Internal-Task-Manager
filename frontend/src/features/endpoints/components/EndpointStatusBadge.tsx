import { Badge } from "@/components/ui/Badge";

const STATUS_VARIANTS: Record<string, "neutral" | "info" | "success" | "warning" | "danger"> = {
  draft: "neutral",
  review: "warning",
  active: "success",
  deprecated: "danger",
};

export function EndpointStatusBadge({ status }: { status?: string }) {
  const s = status ?? "draft";
  return (
    <Badge variant={STATUS_VARIANTS[s] || "neutral"} size="sm" dot>
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </Badge>
  );
}
