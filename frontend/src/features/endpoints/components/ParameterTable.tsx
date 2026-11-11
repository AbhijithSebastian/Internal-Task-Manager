import type { EndpointParameter } from "@/types/endpoints";

interface ParameterTableProps {
  parameters: EndpointParameter[];
  title?: string;
  emptyMessage?: string;
}

export function ParameterTable({
  parameters,
  title,
  emptyMessage = "No parameters",
}: ParameterTableProps) {
  if (!parameters || parameters.length === 0) {
    return <p className="text-xs italic text-tertiary">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto">
      {title && (
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-tertiary">{title}</p>
      )}
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-subtle">
            <th className="py-1.5 pr-3 text-left font-medium text-tertiary">Name</th>
            <th className="py-1.5 pr-3 text-left font-medium text-tertiary">Type</th>
            <th className="py-1.5 pr-3 text-left font-medium text-tertiary">Required</th>
            <th className="py-1.5 text-left font-medium text-tertiary">Description</th>
          </tr>
        </thead>
        <tbody>
          {parameters.map((p, i) => (
            <tr key={i} className="border-b border-subtle last:border-0">
              <td className="py-1.5 pr-3 font-mono text-primary">{p.name}</td>
              <td className="py-1.5 pr-3 text-secondary">{p.type}</td>
              <td className="py-1.5 pr-3">
                <span className={p.required ? "text-semantic-danger" : "text-tertiary"}>
                  {p.required ? "Yes" : "No"}
                </span>
              </td>
              <td className="py-1.5 text-secondary">{p.description || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
