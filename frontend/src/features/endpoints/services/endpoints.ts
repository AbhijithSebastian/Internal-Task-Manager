import { api } from "@/services/api";
import type {
  PaginatedEndpoints,
  Endpoint,
  EndpointReference,
  EndpointActivity,
} from "@/types/endpoints";

export const endpointService = {
  list: (projectId: number | string, params?: Record<string, unknown>) =>
    api
      .get("/endpoints", { params: { project_id: projectId, ...params } })
      .then((r) => r.data as PaginatedEndpoints),

  get: (id: number) => api.get(`/endpoints/${id}`).then((r) => r.data as Endpoint),

  create: (projectId: number | string, data: Record<string, unknown>) =>
    api.post(`/endpoints?project_id=${projectId}`, data).then((r) => r.data as Endpoint),

  update: (id: number, data: Partial<Endpoint>) =>
    api.put(`/endpoints/${id}`, data).then((r) => r.data as Endpoint),

  delete: (id: number) => api.delete(`/endpoints/${id}`).then((r) => r.data),

  getReferences: (id: number) =>
    api
      .get(`/endpoints/${id}/references`)
      .then((r) => r.data as { references: EndpointReference[] }),

  addReference: (id: number, data: { linked_type: string; linked_id: number }) =>
    api.post(`/endpoints/${id}/references`, data).then((r) => r.data as EndpointReference),

  removeReference: (id: number, referenceId: number) =>
    api.delete(`/endpoints/${id}/references/${referenceId}`).then((r) => r.data),

  getActivity: (id: number) =>
    api.get(`/endpoints/${id}/activity`).then((r) => r.data as { activities: EndpointActivity[] }),
};
