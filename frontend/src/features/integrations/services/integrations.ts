import { api } from "@/services/api";

export interface Integration {
  id: number;
  project_id: number;
  type: string;
  label: string | null;
  config: Record<string, unknown>;
  is_active: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntegrationsResponse {
  items: Integration[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export const integrationsService = {
  list(params?: Record<string, unknown>) {
    return api.get<IntegrationsResponse>("/integrations", { params }).then((r) => r.data);
  },
  get(id: number) {
    return api.get<Integration>(`/integrations/${id}`).then((r) => r.data);
  },
  create(data: { project_id: number; type: string; label?: string; config?: Record<string, unknown> }) {
    return api.post<Integration>("/integrations", data).then((r) => r.data);
  },
  update(id: number, data: { label?: string; config?: Record<string, unknown>; is_active?: boolean }) {
    return api.put<Integration>(`/integrations/${id}`, data).then((r) => r.data);
  },
  delete(id: number) {
    return api.delete(`/integrations/${id}`);
  },
  sync(id: number) {
    return api.post<{ message: string; result?: any; error?: string }>(`/integrations/${id}/sync`).then((r) => r.data);
  },
};
