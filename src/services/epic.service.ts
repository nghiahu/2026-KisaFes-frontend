import axiosClient from "./axiosClient";

export interface Epic {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  color: string;
  createdBy?: string;
  createdAt?: string;
  taskCount?: number;
}

export interface EpicCreateRequest {
  name: string;
  description?: string;
  color?: string;
}

export const epicService = {
  createEpic: async (projectId: string, data: EpicCreateRequest): Promise<Epic> => {
    const res = await axiosClient.post(`/projects/${projectId}/epics`, data);
    return res.data;
  },

  getEpics: async (projectId: string): Promise<Epic[]> => {
    const res = await axiosClient.get(`/projects/${projectId}/epics`);
    return res.data;
  },

  updateEpic: async (projectId: string, epicId: string, data: EpicCreateRequest): Promise<Epic> => {
    const res = await axiosClient.put(`/projects/${projectId}/epics/${epicId}`, data);
    return res.data;
  },

  deleteEpic: async (projectId: string, epicId: string): Promise<void> => {
    await axiosClient.delete(`/projects/${projectId}/epics/${epicId}`);
  },
};
