import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService, type TaskCreateRequest } from '../../services/task.service';

export const TASK_KEYS = {
  all: (projectId: string) => ['tasks', projectId] as const,
  list: (projectId: string, params?: any) => ['tasks', projectId, 'list', params] as const,
  myTasks: (params?: any) => ['my-tasks', params] as const,
  detail: (taskId: string) => ['task', taskId] as const,
};

export function useTasksQuery(projectId: string, params?: any) {
  return useQuery({
    queryKey: TASK_KEYS.list(projectId, params),
    queryFn: async () => {
      const response = await taskService.getTasksByProjectId(projectId, params);
      // Backend returns { content, page, size, totalElements, totalPages } OR just an array
      if (response && Array.isArray(response.content)) {
        return response;
      }
      // Fallback
      return {
        content: Array.isArray(response) ? response : [],
        totalElements: Array.isArray(response) ? response.length : 0,
        totalPages: 1
      };
    },
    enabled: !!projectId,
  });
}

export function useMyTasksQuery(params?: any) {
  return useQuery({
    queryKey: TASK_KEYS.myTasks(params),
    queryFn: async () => {
      const response = await taskService.getMyTasks(params);
      if (response && Array.isArray(response.content)) {
        return response.content;
      }
      return Array.isArray(response) ? response : [];
    }
  });
}

export function useCreateTaskMutation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TaskCreateRequest) => taskService.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.all(projectId) });
    },
  });
}

export function useUpdateTaskStatusMutation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, statusId }: { taskId: string; statusId: string }) => 
      taskService.updateTaskStatus(taskId, statusId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.all(projectId) });
    },
  });
}

export function useUpdateTaskAssigneeMutation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, assigneeId }: { taskId: string; assigneeId: string | null }) => 
      taskService.updateTaskAssignee(taskId, assigneeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.all(projectId) });
    },
  });
}

export function useUpdateTaskPriorityMutation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, priority }: { taskId: string; priority: string }) => 
      taskService.updateTaskPriority(taskId, priority),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.all(projectId) });
    },
  });
}

export function useUpdateTaskDueDateMutation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, dueDate }: { taskId: string; dueDate: string | null }) => 
      taskService.updateTaskDueDate(taskId, dueDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.all(projectId) });
    },
  });
}

export function useUpdateTaskTitleMutation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, title }: { taskId: string; title: string }) => 
      taskService.updateTaskTitle(taskId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.all(projectId) });
    },
  });
}

export function useDeleteTaskMutation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => taskService.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    }
  });
}

export function useUpdateTaskDescriptionMutation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, description }: { taskId: string, description: string }) => 
      taskService.updateTaskDescription(taskId, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    }
  });
}

export function useAddSubTaskMutation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, title }: { taskId: string, title: string }) => 
      taskService.addSubTask(taskId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    }
  });
}

export function useToggleSubTaskMutation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, subtaskId }: { taskId: string, subtaskId: string }) => 
      taskService.toggleSubTask(taskId, subtaskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    }
  });
}

export function useDeleteSubTaskMutation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, subtaskId }: { taskId: string, subtaskId: string }) => 
      taskService.deleteSubTask(taskId, subtaskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    }
  });
}

export function useUpdateTaskTeamMutation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, teamId }: { taskId: string; teamId: string | null }) => 
      taskService.updateTaskTeam(taskId, teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.all(projectId) });
    },
  });
}

export function useUploadAttachmentMutation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, file }: { taskId: string; file: File }) => 
      taskService.uploadAttachment(taskId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.all(projectId) });
    },
  });
}

export function useDeleteAttachmentMutation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, attachmentId }: { taskId: string; attachmentId: string }) => 
      taskService.deleteAttachment(taskId, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.all(projectId) });
    },
  });
}
