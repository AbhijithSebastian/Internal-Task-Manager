import { api } from "@/services/api";

export const reportsService = {
  getByTab: (tab: string) =>
    api.get("/reports", { params: { tab } }).then((r) => r.data?.data ?? r.data?.items ?? r.data ?? []),
  getProjectPreview: (projectId: number) =>
    api.get(`/reports/project/${projectId}/preview`).then((r) => r.data?.data ?? r.data ?? null),
  getMeetingLog: (meetingId: number) =>
    api.get(`/meetings/${meetingId}`).then((r) => r.data?.data ?? r.data ?? null),
  exportReport: (tab?: string, format?: "csv" | "xlsx") =>
    api
      .get("/reports/export", { params: { tab, format }, responseType: "blob" })
      .then((r) => r.data),
};
