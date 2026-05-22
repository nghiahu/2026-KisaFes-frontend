import axiosClient from "./axiosClient";

export interface ProjectCreateRequest {
  name: string;
  code: string;
  description: string;
  methodology?: 'SCRUM' | 'KANBAN';
  statuses: any[];
  boardColumns: any[];
  roles: any[];
  members: string[];
}

export const projectService = {
  createProject: async (data: ProjectCreateRequest) => {
    return await axiosClient.post('/projects', data);
  },
  getAllProjects: async (): Promise<any[]> => {
    const response = await axiosClient.get('/projects');
    return response.data;
  },
  getProjectById: async (id: string): Promise<any> => {
    const response = await axiosClient.get(`/projects/${id}`);
    return response.data;
  },
  inviteMember: async (projectId: string, email: string): Promise<any> => {
    const response = await axiosClient.post(`/projects/${projectId}/invite`, { email });
    return response.data;
  },
  removeMember: async (projectId: string, userId: string): Promise<any> => {
    const response = await axiosClient.delete(`/projects/${projectId}/members/${userId}`);
    return response.data;
  },
  restoreMember: async (projectId: string, userId: string): Promise<any> => {
    const response = await axiosClient.put(`/projects/${projectId}/members/${userId}/restore`);
    return response.data;
  },
  changeMemberRole: async (projectId: string, userId: string, roleId: string): Promise<any> => {
    const response = await axiosClient.put(`/projects/${projectId}/members/${userId}/role`, { roleId });
    return response.data;
  },
  addCustomRole: async (projectId: string, data: { name: string, permissions: string[] }): Promise<any> => {
    const response = await axiosClient.post(`/projects/${projectId}/roles`, data);
    return response.data;
  }
};
