

const METHOD_STYLES: Record<string, string> = {
  GET: "bg-semantic-success-soft text-semantic-success",
  POST: "bg-semantic-info-soft text-semantic-info",
  PUT: "bg-semantic-warning-soft text-semantic-warning",
  PATCH: "bg-semantic-warning-soft text-semantic-warning",
  DELETE: "bg-semantic-danger-soft text-semantic-danger",
};

export function HttpMethodBadge({ method, size = "sm" }: { method?: string; size?: "sm" | "md" }) {
  const m = (method ?? "GET").toUpperCase();
  const base = size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs";
  return (
    <span className={`inline-flex items-center rounded font-medium ${base} ${METHOD_STYLES[m] || "bg-subtle text-secondary"}`}>
      {m}
    </span>
  );
}
