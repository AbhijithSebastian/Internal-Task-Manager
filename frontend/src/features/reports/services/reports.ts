import { api } from "@/services/api";

export const reportsService = {
  getByTab: (tab: string) =>
    api.get("/reports", { params: { tab } }).then((r) => r.data?.data ?? r.data?.items ?? r.data ?? []),
  getProjectPreview: (projectId: number) =>
    api.get(`/reports/project/${projectId}/preview`).then((r) => r.data?.data ?? r.data ?? null),
  exportReport: (format: "csv" | "xlsx") =>
    api
      .get("/reports/export", { params: { format }, responseType: "blob" })
      .then((r) => r.data),
};
