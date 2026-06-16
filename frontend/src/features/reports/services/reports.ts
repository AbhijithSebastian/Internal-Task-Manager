import { api } from "@/services/api";

export interface ReportParams {
  type: "project" | "user" | "task" | "trends";
  project_id?: number;
  user_id?: number;
  status?: string;
  priority?: string;
  start_date?: string;
  end_date?: string;
}

export const reportsService = {
  get(params: ReportParams) {
    return api.get("/reports", { params }).then((r) => r.data);
  },
  getProjectPreview(projectId: number) {
    return api.get(`/reports/projects/${projectId}/preview`).then((r) => r.data);
  },
  export(params: ReportParams) {
    return api.get("/reports/export", { params, responseType: "blob" }).then((r) => r.data);
  },
};
