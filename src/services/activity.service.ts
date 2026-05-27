import axiosClient from './axiosClient';

export interface ActivityResponse {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  type: 'COMMENT' | 'STATUS_CHANGE' | 'TIME_LOG';
  content: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export const activityService = {
  getActivitiesByTaskId: async (taskId: string): Promise<ActivityResponse[]> => {
    const response = await axiosClient.get(`/activities/task/${taskId}`);
    return response.data;
  },

  addComment: async (taskId: string, content: string): Promise<ActivityResponse> => {
    const response = await axiosClient.post(`/activities/task/${taskId}/comments`, { content });
    return response.data;
  },

  deleteComment: async (activityId: string): Promise<void> => {
    await axiosClient.delete(`/activities/${activityId}`);
  }
};
