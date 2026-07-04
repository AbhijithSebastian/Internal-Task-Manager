import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { endpointService } from "../services/endpoints";
import { toast } from "sonner";

export function useEndpoints(projectId: string | number, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["endpoints", projectId, params],
    queryFn: () => endpointService.list(projectId, params),
    enabled: !!projectId,
  });
}

export function useEndpoint(id: number | null) {
  return useQuery({
    queryKey: ["endpoint", id],
    queryFn: () => endpointService.get(id!),
    enabled: !!id,
  });
}

export function useCreateEndpoint(projectId: string | number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => endpointService.create(projectId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["endpoints", projectId] });
      toast.success("Endpoint created");
    },
    onError: () => toast.error("Failed to create endpoint"),
  });
}

export function useUpdateEndpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Record<string, unknown>> }) =>
      endpointService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["endpoints"] });
      qc.invalidateQueries({ queryKey: ["endpoint"] });
      toast.success("Endpoint updated");
    },
    onError: () => toast.error("Failed to update endpoint"),
  });
}

export function useDeleteEndpoint(projectId: string | number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => endpointService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["endpoints", projectId] });
      toast.success("Endpoint deleted");
    },
    onError: () => toast.error("Failed to delete endpoint"),
  });
}

export function useEndpointReferences(id: number | null) {
  return useQuery({
    queryKey: ["endpoint-references", id],
    queryFn: () => endpointService.getReferences(id!),
    enabled: !!id,
  });
}

export function useAddEndpointReference(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { linked_type: string; linked_id: number }) =>
      endpointService.addReference(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["endpoint-references", id] });
      toast.success("Reference added");
    },
    onError: () => toast.error("Failed to add reference"),
  });
}

export function useRemoveEndpointReference(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (referenceId: number) => endpointService.removeReference(id, referenceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["endpoint-references", id] });
      toast.success("Reference removed");
    },
    onError: () => toast.error("Failed to remove reference"),
  });
}

export function useEndpointActivity(id: number | null) {
  return useQuery({
    queryKey: ["endpoint-activity", id],
    queryFn: () => endpointService.getActivity(id!),
    enabled: !!id,
  });
}
