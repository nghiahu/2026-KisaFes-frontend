import axiosClient from "./axiosClient";

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal?: string;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED';
  startDate?: string;
  endDate?: string;
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

export const sprintService = {
  /** Tạo sprint mới cho dự án */
  createSprint: async (projectId: string, data: SprintCreateRequest): Promise<Sprint> => {
    const response = await axiosClient.post(`/projects/${projectId}/sprints`, data);
    return response.data;
  },

  /** Lấy tất cả sprint của dự án */
  getSprintsByProject: async (projectId: string): Promise<Sprint[]> => {
    const response = await axiosClient.get(`/projects/${projectId}/sprints`);
    return response.data;
  },

  /** Lấy sprint đang active */
  getActiveSprint: async (projectId: string): Promise<Sprint> => {
    const response = await axiosClient.get(`/projects/${projectId}/sprints/active`);
    return response.data;
  },

  /** Bắt đầu sprint (PLANNING → ACTIVE) */
  startSprint: async (projectId: string, sprintId: string): Promise<Sprint> => {
    const response = await axiosClient.patch(`/projects/${projectId}/sprints/${sprintId}/start`);
    return response.data;
  },

  /** Hoàn thành sprint (ACTIVE → COMPLETED) */
  completeSprint: async (projectId: string, sprintId: string): Promise<Sprint> => {
    const response = await axiosClient.patch(`/projects/${projectId}/sprints/${sprintId}/complete`);
    return response.data;
  },
};
