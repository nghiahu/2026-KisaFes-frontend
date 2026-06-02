import axiosClient from './axiosClient';
import type { Team, CreateTeamPayload, TeamActivity } from '../types/team.interface';

export const teamService = {
  getTeams: async (): Promise<Team[]> => {
    const res = await axiosClient.get('/teams/search');
    return res.data;
  },

  searchTeams: async (keyword: string): Promise<Team[]> => {
    const res = await axiosClient.get(`/teams/search?keyword=${encodeURIComponent(keyword)}`);
    return res.data;
  },

  getTeamById: async (teamId: string): Promise<Team> => {
    const res = await axiosClient.get(`/teams/${teamId}`);
    return res.data;
  },

  createTeam: async (payload: CreateTeamPayload): Promise<Team> => {
    const res = await axiosClient.post('/teams', payload);
    return res.data;
  },

  updateTeam: async (teamId: string, payload: any): Promise<Team> => {
    const res = await axiosClient.put(`/teams/${teamId}`, payload);
    return res.data;
  },

  addMember: async (teamId: string, email: string, role?: string): Promise<Team> => {
    const params = new URLSearchParams({ email });
    if (role) {
      params.append('role', role);
    }
    const res = await axiosClient.post(`/teams/${teamId}/members?${params.toString()}`);
    return res.data;
  },

  removeMember: async (teamId: string, userId: string): Promise<void> => {
    await axiosClient.delete(`/teams/${teamId}/members/${userId}`);
  },

  getTeamProjects: async (teamId: string): Promise<any[]> => {
    const response = await axiosClient.get(`/teams/${teamId}/projects`);
    return response.data;
  },

  getTeamTasks: async (teamId: string): Promise<any[]> => {
    const response = await axiosClient.get(`/teams/${teamId}/tasks`);
    return response.data ?? [];
  }
};
