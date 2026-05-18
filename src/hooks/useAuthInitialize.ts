import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { authService } from '../services/auth.service';
import { setToken, logout, setInitialized } from '../store/slices/authSlice';
import type { RootState } from '../store';

export const useAuthInitialize = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');

    // Chỉ thử khôi phục session nếu chưa được xác thực trong memory VÀ trước đó đã từng đăng nhập
    if (!isAuthenticated && storedUser) {
      const refreshSession = async () => {
        try {
          const res = await authService.refreshToken();
          const newAccessToken = res.data?.accessToken || res.data?.data?.accessToken;
          if (newAccessToken) {
            dispatch(setToken(newAccessToken));
          } else {
            throw new Error('No access token in response');
          }
        } catch (error) {
          // Nếu trước đó user đã đăng nhập nhưng khôi phục token thất bại -> session đã hết hạn thực sự
          console.log('Session expired or server error on load, logging out...');
          dispatch(logout());
        } finally {
          dispatch(setInitialized(true));
        }
      };
      refreshSession();
    } else {
      // Nếu không có session cũ hoặc đã được xác thực, hoàn thành việc khởi tạo
      dispatch(setInitialized(true));
    }
  }, [isAuthenticated, dispatch]);
};
