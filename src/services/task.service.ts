import axiosClient from "./axiosClient";

export interface TaskCreateRequest {
  projectId: string;
  sprintId?: string;
  title: string;
  description?: string;
  statusId?: string;
  priority?: string;
  storyPoints?: number;
  assigneeId?: string;
  type?: string;
  dueDate?: string | null;
}

export const taskService = {
  getTasksByProjectId: async (projectId: string, params?: any): Promise<any> => {
    const response = await axiosClient.get(`/tasks/project/${projectId}`, { params });
    return response.data;
  },
  createTask: async (data: TaskCreateRequest): Promise<any> => {
    const response = await axiosClient.post('/tasks', data);
    return response.data;
  },
  updateTaskStatus: async (taskId: string, statusId: string): Promise<any> => {
    const response = await axiosClient.patch(`/tasks/${taskId}/status?statusId=${statusId}`);
    return response.data;
  },
  updateTaskAssignee: async (taskId: string, assigneeId: string | null): Promise<any> => {
    const params = assigneeId ? `?assigneeId=${assigneeId}` : '';
    const response = await axiosClient.patch(`/tasks/${taskId}/assignee${params}`);
    return response.data;
  },
  updateTaskPriority: async (taskId: string, priority: string): Promise<any> => {
    const response = await axiosClient.patch(`/tasks/${taskId}/priority?priority=${encodeURIComponent(priority)}`);
    return response.data;
  },
  updateTaskDueDate: async (taskId: string, dueDate: string | null): Promise<any> => {
    const params = dueDate ? `?dueDate=${encodeURIComponent(dueDate)}` : '';
    const response = await axiosClient.patch(`/tasks/${taskId}/due-date${params}`);
    return response.data;
  },
  updateTaskTitle: async (taskId: string, title: string): Promise<any> => {
    const response = await axiosClient.patch(`/tasks/${taskId}/title?title=${encodeURIComponent(title)}`);
    return response.data;
  },
  deleteTask: async (taskId: string): Promise<any> => {
    const response = await axiosClient.delete(`/tasks/${taskId}`);
    return response.data;
  }
};
