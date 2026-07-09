import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { projectService } from "@/features/projects/services/projects";
import type { Project, Task, ProjectMember, Meeting, ActivityLog } from "@/types";

export function useProject(id: number | string | undefined) {
  return useQuery<Project>({
    queryKey: ["project", id],
    queryFn: () => projectService.getProject(id!),
    enabled: !!id,
  });
}

export function useProjectTasks(id: number | string | undefined, enabled = true) {
  return useQuery<Task[]>({
    queryKey: ["project-tasks", id],
    queryFn: () => projectService.getProjectTasks(id!),
    enabled: !!id && enabled,
  });
}

export function useProjectMembers(id: number | string | undefined, enabled = true) {
  return useQuery<ProjectMember[]>({
    queryKey: ["project-members", id],
    queryFn: () => projectService.getProjectMembers(id!),
    enabled: !!id && enabled,
  });
}

export function useProjectMeetings(id: number | string | undefined, enabled = true) {
  return useQuery<Meeting[]>({
    queryKey: ["project-meetings", id],
    queryFn: () => projectService.getProjectMeetings(id!),
    enabled: !!id && enabled,
  });
}

export function useProjectActivity(id: number | string | undefined, enabled = true) {
  return useQuery<ActivityLog[]>({
    queryKey: ["project-activity", id],
    queryFn: () => projectService.getProjectActivity(id!),
    enabled: !!id && enabled,
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: Partial<Project> }) =>
      projectService.updateProject(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-activity", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["projects", "recent"] });
      toast.success("Project updated");
    },
    onError: () => toast.error("Failed to update project"),
  });
}

export function useUpdateProjectStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number | string; status: string }) =>
      projectService.updateProject(id, { status } as Partial<Project>),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-activity", variables.id] });
      toast.success("Status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => projectService.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted");
    },
    onError: () => toast.error("Failed to delete project"),
  });
}

export function useAddProjectMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number | string; user_id: number; role: string }) =>
      projectService.addProjectMember(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project-members", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["project", variables.id] });
    },
  });
}

export function useRemoveProjectMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: { id: number | string; userId: number }) =>
      projectService.removeProjectMember(id, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project-members", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["project", variables.id] });
    },
  });
}

export function useUpdateProjectMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId, role }: { id: number | string; userId: number; role: string }) =>
      projectService.updateProjectMember(id, userId, { role }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project-members", variables.id] });
    },
  });
}

export function useRecentProjects() {
  return useQuery<Project[]>({
    queryKey: ["projects", "recent"],
    queryFn: () => projectService.getRecentProjects(),
    staleTime: 60_000,
  });
}
