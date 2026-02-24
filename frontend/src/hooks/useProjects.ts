import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as projectsApi from "../api/projects";
import type { ProjectCreate, ProjectUpdate, ProjectListParams } from "../types/project";

export function useProjectList(params?: ProjectListParams) {
  return useQuery({
    queryKey: ["projects", params],
    queryFn: () => projectsApi.getProjects(params),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: () => projectsApi.getProject(id),
    enabled: !!id,
  });
}

export function useProjectCost(id: string) {
  return useQuery({
    queryKey: ["projects", id, "cost"],
    queryFn: () => projectsApi.getProjectCost(id),
    enabled: !!id,
  });
}

export function useBudgetVsActual(id: string) {
  return useQuery({
    queryKey: ["projects", id, "budget-vs-actual"],
    queryFn: () => projectsApi.getBudgetVsActual(id),
    enabled: !!id,
  });
}

export function useProjectMutations() {
  const queryClient = useQueryClient();
  const invalidateProjects = () => {
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const createMutation = useMutation({
    mutationFn: (data: ProjectCreate) => projectsApi.createProject(data),
    onSuccess: invalidateProjects,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProjectUpdate }) =>
      projectsApi.updateProject(id, data),
    onSuccess: invalidateProjects,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsApi.deleteProject(id),
    onSuccess: invalidateProjects,
  });

  return { createMutation, updateMutation, deleteMutation };
}
