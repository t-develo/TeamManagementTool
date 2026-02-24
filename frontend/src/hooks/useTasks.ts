import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as tasksApi from "../api/tasks";
import type { TaskCreate, TaskUpdate, TaskReorderItem, TaskAssignRequest } from "../types/task";
import type { Project } from "../types/project";

export function useTaskMutations(projectId: string) {
  const queryClient = useQueryClient();
  const invalidateProject = () => {
    queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const createMutation = useMutation({
    mutationFn: (data: TaskCreate) => tasksApi.createTask(projectId, data),
    onSuccess: invalidateProject,
  });

  const updateMutation = useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: TaskUpdate }) =>
      tasksApi.updateTask(projectId, taskId, data),
    onSuccess: invalidateProject,
  });

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => tasksApi.deleteTask(projectId, taskId),
    onSuccess: invalidateProject,
  });

  const reorderMutation = useMutation({
    mutationFn: (items: TaskReorderItem[]) => tasksApi.reorderTasks(projectId, items),
    onMutate: async (items: TaskReorderItem[]) => {
      await queryClient.cancelQueries({ queryKey: ["projects", projectId] });
      const previousProject = queryClient.getQueryData<Project>(["projects", projectId]);
      if (previousProject) {
        const orderMap = new Map(items.map((item) => [item.task_id, item.sort_order]));
        const updatedTasks = [...previousProject.tasks]
          .map((task) => ({
            ...task,
            sort_order: orderMap.get(task.task_id) ?? task.sort_order,
          }))
          .sort((a, b) => a.sort_order - b.sort_order);
        queryClient.setQueryData<Project>(["projects", projectId], {
          ...previousProject,
          tasks: updatedTasks,
        });
      }
      return { previousProject };
    },
    onError: (_err, _items, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(["projects", projectId], context.previousProject);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: TaskAssignRequest }) =>
      tasksApi.assignTask(projectId, taskId, data),
    onSuccess: invalidateProject,
  });

  return { createMutation, updateMutation, deleteMutation, reorderMutation, assignMutation };
}
