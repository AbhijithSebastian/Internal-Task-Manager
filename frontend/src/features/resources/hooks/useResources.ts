import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { resourceService } from "../services/resources";
import { toast } from "sonner";
import type { Resource } from "@/types/resources";

export function useResources(projectId: string | number, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["resources", projectId, params],
    queryFn: () => resourceService.list(projectId, params),
    enabled: !!projectId,
  });
}

export function useResource(resourceId: number | null) {
  return useQuery({
    queryKey: ["resource", resourceId],
    queryFn: () => resourceService.get(resourceId!),
    enabled: !!resourceId,
  });
}

export function useCreateResource(projectId: string | number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof resourceService.create>[1]) =>
      resourceService.create(projectId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resources", projectId] });
      toast.success("Resource created");
    },
    onError: () => toast.error("Failed to create resource"),
  });
}

export function useUploadResource(projectId: string | number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => resourceService.upload(projectId, formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resources", projectId] });
      toast.success("File uploaded");
    },
    onError: () => toast.error("Failed to upload file"),
  });
}

export function useUpdateResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Resource> }) =>
      resourceService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resources"] });
      qc.invalidateQueries({ queryKey: ["resource"] });
      toast.success("Resource updated");
    },
    onError: () => toast.error("Failed to update resource"),
  });
}

export function useDeleteResource(projectId: string | number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => resourceService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resources", projectId] });
      toast.success("Resource deleted");
    },
    onError: () => toast.error("Failed to delete resource"),
  });
}

export function useUploadVersion(resourceId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => resourceService.uploadVersion(resourceId, formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resource", resourceId] });
      qc.invalidateQueries({ queryKey: ["resource-versions", resourceId] });
      toast.success("New version uploaded");
    },
    onError: () => toast.error("Failed to upload version"),
  });
}

export function useResourceVersions(resourceId: number | null) {
  return useQuery({
    queryKey: ["resource-versions", resourceId],
    queryFn: () => resourceService.getVersions(resourceId!),
    enabled: !!resourceId,
  });
}

export function useTrackDownload() {
  return useMutation({
    mutationFn: (id: number) => resourceService.trackDownload(id),
  });
}

export function useResourceLinks(resourceId: number | null) {
  return useQuery({
    queryKey: ["resource-links", resourceId],
    queryFn: () => resourceService.getLinks(resourceId!),
    enabled: !!resourceId,
  });
}

export function useAddLink(resourceId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { linked_type: string; linked_id: number }) =>
      resourceService.addLink(resourceId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resource-links", resourceId] });
      toast.success("Link added");
    },
    onError: () => toast.error("Failed to add link"),
  });
}

export function useRemoveLink(resourceId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (linkId: number) => resourceService.removeLink(resourceId, linkId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resource-links", resourceId] });
      toast.success("Link removed");
    },
    onError: () => toast.error("Failed to remove link"),
  });
}

export function useResourceActivity(resourceId: number | null) {
  return useQuery({
    queryKey: ["resource-activity", resourceId],
    queryFn: () => resourceService.getActivity(resourceId!),
    enabled: !!resourceId,
  });
}
