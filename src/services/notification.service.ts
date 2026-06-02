import axiosClient from "./axiosClient";

export interface NotificationResponse {
  id: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  projectId: string | null;
  projectName: string | null;
  teamId: string | null;
  teamName: string | null;
  message: string;
  type: 'INVITATION' | 'SYSTEM' | 'ASSIGNMENT' | 'SUCCESS' | 'WARNING';
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'READ';
  read: boolean;
  createdAt: string;
}

export const notificationService = {
  getMyNotifications: async (): Promise<NotificationResponse[]> => {
    const response: any = await axiosClient.get('/notifications');
    return response.data;
  },
  acceptInvitation: async (id: string): Promise<NotificationResponse> => {
    const response: any = await axiosClient.post(`/notifications/${id}/accept`);
    return response.data;
  },
  declineInvitation: async (id: string): Promise<NotificationResponse> => {
    const response: any = await axiosClient.post(`/notifications/${id}/decline`);
    return response.data;
  },
  markAsRead: async (id: string): Promise<NotificationResponse> => {
    const response: any = await axiosClient.post(`/notifications/${id}/read`);
    return response.data;
  },
  markAllAsRead: async (): Promise<void> => {
    await axiosClient.post('/notifications/read-all');
  }
};
