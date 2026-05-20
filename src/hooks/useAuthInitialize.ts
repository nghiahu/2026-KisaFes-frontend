import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { authService } from '../services/auth.service';
import { setToken, logout, setInitialized, setUser } from '../store/slices/authSlice';
import type { RootState } from '../store';

const normalizeUser = (user: any) => ({
  id: user.id || user._id || '',
  userName: user.userName || user.username || user.user_name || '',
  fullName: user.fullName || user.fullname || user.full_name || '',
  email: user.email || '',
  avatar: user.avatar || user.avatarUrl || user.avatar_url || null,
  bio: user.bio || '',
  isPublic: user.isPublic !== undefined ? user.isPublic : (user.is_public !== undefined ? user.is_public : false),
  roles: Array.isArray(user.roles) ? user.roles : [],
});

export const useAuthInitialize = () => {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');

    // Chỉ thử khôi phục session nếu chưa có token trong memory VÀ trước đó đã từng đăng nhập
    if (!token && storedUser) {
      const refreshSession = async () => {
        // Luôn khôi phục user data để hiển thị UI ngay lập tức
        const raw = JSON.parse(storedUser);
        dispatch(setUser(normalizeUser(raw)));

        try {
          const res = await authService.refreshToken();
          const newAccessToken = res.data?.accessToken || res.data?.data?.accessToken;
          if (newAccessToken) {
            dispatch(setToken(newAccessToken));
          } else {
            throw new Error('No access token in response');
          }
        } catch (error) {
          console.log('Session expired. Logging out.');
          dispatch(logout());
        } finally {
          dispatch(setInitialized(true));
        }
      };
      refreshSession();
    } else {
      // Nếu không có session cũ hoặc đã có token, hoàn thành việc khởi tạo
      dispatch(setInitialized(true));
    }
  }, [token, dispatch]);
};
