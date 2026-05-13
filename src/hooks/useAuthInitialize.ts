import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { authService } from '../services/auth.service';
import { setToken } from '../store/slices/authSlice';
import type { RootState } from '../store';

export const useAuthInitialize = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  useEffect(() => {
    // Nếu chưa có token trong memory, thử gọi refresh để lấy lại session
    if (!isAuthenticated) {
      const refreshSession = async () => {
        try {
          const res = await authService.refreshToken();
          const newAccessToken = res.data?.accessToken || res.data?.data?.accessToken;
          if (newAccessToken) {
            dispatch(setToken(newAccessToken));
          }
        } catch (error) {
          // Lỗi do không có refresh token cookie, bỏ qua vì user chưa login
          console.log('No valid session found on load');
        }
      };
      refreshSession();
    }
  }, [isAuthenticated, dispatch]);
};
