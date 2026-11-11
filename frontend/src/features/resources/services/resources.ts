import { api } from "@/services/api";
import type {
  PaginatedResources,
  Resource,
  ResourceVersion,
  ResourceLink,
  ResourceActivity,
} from "@/types/resources";

export const resourceService = {
  list: (projectId: number | string, params?: Record<string, unknown>) =>
    api
      .get("/resources", { params: { project_id: projectId, ...params } })
      .then((r) => r.data as PaginatedResources),

  get: (resourceId: number) => api.get(`/resources/${resourceId}`).then((r) => r.data as Resource),

  create: (
    projectId: number | string,
    data: {
      name: string;
      description?: string;
      resource_type: string;
      category?: string;
      url?: string;
      tags?: string[];
      extra_metadata?: Record<string, unknown>;
    },
  ) => api.post(`/resources?project_id=${projectId}`, data).then((r) => r.data as Resource),

  upload: (projectId: number | string, formData: FormData) =>
    api
      .post(`/resources/upload?project_id=${projectId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data as Resource),

  update: (resourceId: number, data: Partial<Resource>) =>
    api.put(`/resources/${resourceId}`, data).then((r) => r.data as Resource),

  delete: (resourceId: number) => api.delete(`/resources/${resourceId}`).then((r) => r.data),

  uploadVersion: (resourceId: number, formData: FormData) =>
    api
      .post(`/resources/${resourceId}/versions`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data as Resource),

  getVersions: (resourceId: number) =>
    api
      .get(`/resources/${resourceId}/versions`)
      .then((r) => r.data as { current_version: number; versions: ResourceVersion[] }),

  trackDownload: (resourceId: number) =>
    api.post(`/resources/${resourceId}/download`).then((r) => r.data),

  getLinks: (resourceId: number) =>
    api.get(`/resources/${resourceId}/links`).then((r) => r.data as { links: ResourceLink[] }),

  addLink: (resourceId: number, data: { linked_type: string; linked_id: number }) =>
    api.post(`/resources/${resourceId}/links`, data).then((r) => r.data as ResourceLink),

  removeLink: (resourceId: number, linkId: number) =>
    api.delete(`/resources/${resourceId}/links/${linkId}`).then((r) => r.data),

  getActivity: (resourceId: number) =>
    api
      .get(`/resources/${resourceId}/activity`)
      .then((r) => r.data as { activities: ResourceActivity[] }),

  getFileUrl: (resourceId: number) => `/api/v1/resources/${resourceId}/file`,
};
