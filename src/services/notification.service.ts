import axiosClient from "./axiosClient";

export interface NotificationResponse {
  id: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  projectId: string;
  projectName: string;
  message: string;
  type: 'INVITATION' | 'SYSTEM';
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'READ';
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
  }
};
