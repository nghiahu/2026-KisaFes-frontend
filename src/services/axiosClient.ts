import axios from 'axios';
import { store } from '../store';
import { setToken } from '../store/slices/authSlice';
import { sessionExpiredEvent } from '../utils/sessionExpiredEvent';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

axiosClient.interceptors.request.use(
  (config) => {
    // Token vẫn đọc từ Redux state (memory)
    const token = store.getState().auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (!originalRequest) {
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401) {
      // 0. Loại trừ các request xác thực (như login, register, logout, checkEmail) ngoại trừ refresh
      const isAuthRequest = originalRequest.url?.includes('/auth/');
      const isRefreshRequest = originalRequest.url?.includes('/auth/refresh');
      if (isAuthRequest && !isRefreshRequest) {
        return Promise.reject(error.response?.data || error);
      }

      // Nếu Client không có token (chưa đăng nhập hoặc đã đăng xuất), bỏ qua việc refresh/hiển thị modal
      const currentToken = store.getState().auth.token;
      if (!currentToken) {
        return Promise.reject(error.response?.data || error);
      }

      // 1. Nếu đây là request đã được retry một lần rồi mà vẫn lỗi 401
      // Hoặc là request gọi refresh token bị lỗi 401 (không bao giờ retry)
      if (originalRequest._retry || isRefreshRequest) {
        sessionExpiredEvent.emit();
        return Promise.reject(error.response?.data || error);
      }

      // 2. Nếu đang có một request khác tiến hành refresh token song song
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return axiosClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      // 3. Bắt đầu luồng refresh token
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const baseURL = import.meta.env.VITE_API_URL || '/api/v1';
        const res = await axios.post(
          `${baseURL}/auth/refresh`,
          {},
          { 
            withCredentials: true,
            timeout: 10000 // Giới hạn 10 giây để tránh bị treo vô hạn
          }
        );
        
        const newAccessToken = res.data?.accessToken || res.data?.data?.accessToken;
        
        if (newAccessToken) {
          store.dispatch(setToken(newAccessToken));
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          return axiosClient(originalRequest);
        } else {
          throw new Error('No access token in response');
        }
      } catch (err) {
        processQueue(err, null);
        // Hiển thị modal "Hết phiên đăng nhập" thay vì logout ngay
        sessionExpiredEvent.emit();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error.response?.data || error);
  }
);

export default axiosClient;
