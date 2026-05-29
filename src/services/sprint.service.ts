import axiosClient from "./axiosClient";

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal?: string;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED';
  startDate?: string;
  endDate?: string;
  order: number;
  createdAt?: string;
  totalStoryPoints: number;
  completedStoryPoints: number;
  inProgressStoryPoints: number;
  unstartedStoryPoints: number;
  totalTasks: number;
  completedTasks: number;
}

export interface SprintCreateRequest {
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
}

export interface SprintUpdateRequest {
  name?: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
}

export const sprintService = {
  createSprint: async (projectId: string, data: SprintCreateRequest): Promise<Sprint> => {
    const res = await axiosClient.post(`/projects/${projectId}/sprints`, data);
    return res.data;
  },

  getSprintsByProject: async (projectId: string): Promise<Sprint[]> => {
    const res = await axiosClient.get(`/projects/${projectId}/sprints`);
    return res.data;
  },

  getActiveSprint: async (projectId: string): Promise<Sprint> => {
    const res = await axiosClient.get(`/projects/${projectId}/sprints/active`);
    return res.data;
  },

  updateSprint: async (projectId: string, sprintId: string, data: SprintUpdateRequest): Promise<Sprint> => {
    const res = await axiosClient.put(`/projects/${projectId}/sprints/${sprintId}`, data);
    return res.data;
  },

  deleteSprint: async (projectId: string, sprintId: string): Promise<void> => {
    await axiosClient.delete(`/projects/${projectId}/sprints/${sprintId}`);
  },

  startSprint: async (projectId: string, sprintId: string): Promise<Sprint> => {
    const res = await axiosClient.patch(`/projects/${projectId}/sprints/${sprintId}/start`);
    return res.data;
  },

  completeSprint: async (projectId: string, sprintId: string, moveToSprintId?: string): Promise<Sprint> => {
    const res = await axiosClient.patch(`/projects/${projectId}/sprints/${sprintId}/complete`, {
      moveToSprintId: moveToSprintId ?? null,
    });
    return res.data;
  },

  getSprintTasks: async (projectId: string, sprintId: string): Promise<any[]> => {
    const res = await axiosClient.get(`/projects/${projectId}/sprints/${sprintId}/tasks`);
    return res.data;
  },

  getBacklog: async (projectId: string): Promise<any[]> => {
    const res = await axiosClient.get(`/projects/${projectId}/sprints/backlog`);
    return res.data;
  },

  moveTaskToSprint: async (taskId: string, sprintId: string | null): Promise<any> => {
    const res = await axiosClient.patch(`/tasks/${taskId}/sprint`, { sprintId });
    return res.data;
  },

  updateTaskPosition: async (taskId: string, params: { backlogPosition?: number; boardPosition?: number }): Promise<any> => {
    const query = new URLSearchParams();
    if (params.backlogPosition !== undefined) query.set('backlogPosition', String(params.backlogPosition));
    if (params.boardPosition !== undefined) query.set('boardPosition', String(params.boardPosition));
    const res = await axiosClient.patch(`/tasks/${taskId}/position?${query.toString()}`);
    return res.data;
  },
};
