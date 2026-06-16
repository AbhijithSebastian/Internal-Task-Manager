import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportsService } from "@/features/reports/services/reports";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoading } from "@/components/shared/LoadingSpinner";
import { FileText, Download } from "lucide-react";

export default function ReportsPage() {
  const [reportType, setReportType] = useState("project");
  const [params] = useState<Record<string, string>>({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["report", reportType, params],
    queryFn: () => reportsService.get({ type: reportType as any, ...params }),
    enabled: false,
  });

  const handleGenerate = () => {
    refetch();
  };

  const handleExport = async () => {
    const blob = await reportsService.export({ type: reportType as any, ...params });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportType}-report.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Generate and export reports."
        actions={
          data && (
            <button onClick={handleExport} className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted">
              <Download className="h-4 w-4" /> Export XLSX
            </button>
          )
        }
      />
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Report Type</h2>
          <div className="space-y-2">
            {["project", "user", "task", "trends"].map((type) => (
              <button
                key={type}
                className={`block w-full rounded-md px-3 py-2 text-left text-sm font-medium ${
                  reportType === type ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
                onClick={() => setReportType(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)} Report
              </button>
            ))}
          </div>
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="mt-4 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? "Generating..." : "Generate"}
          </button>
        </div>
        <div className="lg:col-span-3">
          {isLoading ? (
            <PageLoading />
          ) : data ? (
            <div className="rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold capitalize">{reportType} Report</h2>
              <pre className="overflow-auto text-sm text-muted-foreground">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-12 text-center">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-semibold">No report generated</p>
              <p className="text-sm text-muted-foreground">Select a report type and click Generate.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
