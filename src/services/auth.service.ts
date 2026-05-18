import axios from 'axios';
import axiosClient from './axiosClient';

export const authService = {
  checkEmail: (email: string) => {
    return axiosClient.get(`/auth/checkEmail`, { params: { email } });
  },

  checkUsername: (username: string) => {
    return axiosClient.get(`/auth/checkUsername`, { params: { username } });
  },

  sendOtp: (email: string) => {
    return axiosClient.post(`/auth/send-otp`, { email });
  },

  verifyOtp: (email: string, otp: string) => {
    return axiosClient.post(`/auth/verify-otp`, { email, otp });
  },

  register: (data: any) => {
    return axiosClient.post(`/auth/register`, data);
  },

  login: (data: any) => {
    return axiosClient.post(`/auth/login`, data);
  },

  refreshToken: () => {
    return axios.post(
      `${import.meta.env.VITE_API_URL || '/api/v1'}/auth/refresh`,
      {},
      { withCredentials: true }
    );
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    return axiosClient.post(`/upload/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // ===== RESET PASSWORD =====

  sendResetPasswordOtp: (email: string) => {
    return axiosClient.post(`/auth/send-reset-password`, {
      email,
    });
  },

  verifyResetPasswordOtp: (email: string, otp: string) => {
    return axiosClient.post(`/auth/verify-otp-reset`, {
      email,
      otp,
    });
  },

  resetPassword: (data: {
    email: string;
    token: string;
    newPassword: string;
  }) => {
    return axiosClient.post(`/auth/reset-password`, data);
  },

  logout: () => {
    return axiosClient.post(`/auth/logout`);
  },
};