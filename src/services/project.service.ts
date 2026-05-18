import axiosClient from "./axiosClient";

export interface ProjectCreateRequest {
  name: string;
  code: string;
  description: string;
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
  }
};
