import axiosClient from './axiosClient';

export interface CommentResponse {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  content: string;
  parentId: string | null;
  imageUrls: string[] | null;
  reactions: Record<string, string[]>; // emoji -> list of userIds
  createdAt: string;
  updatedAt: string;
}

export interface CommentRequest {
  content: string;
  parentId?: string | null;
  imageUrls?: string[] | null;
}

export const commentService = {
  getCommentsByTaskId: async (taskId: string): Promise<CommentResponse[]> => {
    const response = await axiosClient.get(`/comments/task/${taskId}`);
    return response.data;
  },

  createComment: async (taskId: string, data: CommentRequest): Promise<CommentResponse> => {
    const response = await axiosClient.post(`/comments/task/${taskId}`, data);
    return response.data;
  },

  toggleReaction: async (commentId: string, emoji: string): Promise<CommentResponse> => {
    const response = await axiosClient.post(`/comments/${commentId}/react?emoji=${encodeURIComponent(emoji)}`);
    return response.data;
  },

  deleteComment: async (commentId: string): Promise<void> => {
    await axiosClient.delete(`/comments/${commentId}`);
  },

  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosClient.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data; // Returns the image URL string
  }
};
