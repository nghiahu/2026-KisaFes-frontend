import axiosClient from './axiosClient';
import type { User } from '../types/user.interface';

export interface UpdateProfilePayload {
  fullName: string;
  userName: string;
  bio?: string;
  avatar?: string | null;
  isPublic: boolean;
}

export const userService = {
  getMyProfile: () => {
    return axiosClient.get<{ data: User }>('/users/me');
  },

  updateMyProfile: (data: UpdateProfilePayload) => {
    return axiosClient.put<{ data: User }>('/users/me', data);
  },
};
