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
}

export const taskService = {
  getTasksByProjectId: async (projectId: string): Promise<any[]> => {
    const response = await axiosClient.get(`/tasks/project/${projectId}`);
    return response.data;
  },
  createTask: async (data: TaskCreateRequest): Promise<any> => {
    const response = await axiosClient.post('/tasks', data);
    return response.data;
  },
  updateTaskStatus: async (taskId: string, statusId: string): Promise<any> => {
    const response = await axiosClient.patch(`/tasks/${taskId}/status?statusId=${statusId}`);
    return response.data;
  }
};
