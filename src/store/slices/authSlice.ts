import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  // Trạng thái cho luồng đăng ký
  registrationData: {
    fullName?: string;
    email?: string;
    password?: string;
    username?: string;
    bio?: string;
    avatar?: string;
    verifyToken?: string;
  } | null;

  // Trạng thái cho luồng quên mật khẩu
  resetPasswordData: {
    email?: string;
    verifyToken?: string;
  } | null;

  // Xác thực người dùng
  isAuthenticated: boolean;
  user: any | null;
  token: string | null;
  isInitialized: boolean;
}

// Function to normalize user data to camelCase and clean up legacy/duplicated fields
const normalizeUser = (user: any) => {
  if (!user) return null;
  return {
    id: user.id || user._id || '',
    userName: user.userName || user.username || user.user_name || '',
    fullName: user.fullName || user.fullname || user.full_name || '',
    email: user.email || '',
    avatar: user.avatar || user.avatarUrl || user.avatar_url || null,
    bio: user.bio || '',
    isPublic: user.isPublic !== undefined ? user.isPublic : (user.is_public !== undefined ? user.is_public : false),
    roles: Array.isArray(user.roles) ? user.roles : [],
  };
};

// Khôi phục userInfo từ localStorage
const storedUser = localStorage.getItem('user');
const initialUser = storedUser ? normalizeUser(JSON.parse(storedUser)) : null;

const initialState: AuthState = {
  registrationData: null,
  resetPasswordData: null,
  isAuthenticated: false, // Bắt đầu là false để bắt buộc kiểm tra/refresh token trước
  user: initialUser,
  token: null,
  isInitialized: !storedUser, // Nếu không có storedUser thì đã init xong, ngược lại chờ refresh token
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setRegistrationData: (state, action: PayloadAction<Partial<AuthState['registrationData']>>) => {
      if (!state.registrationData) {
        state.registrationData = {};
      }
      state.registrationData = { ...state.registrationData, ...action.payload };
    },
    clearRegistrationData: (state) => {
      state.registrationData = null;
    },
    setResetPasswordData: (state, action: PayloadAction<Partial<NonNullable<AuthState['resetPasswordData']>>>) => {
      if (!state.resetPasswordData) {
        state.resetPasswordData = {};
      }
      state.resetPasswordData = { ...state.resetPasswordData, ...action.payload };
    },
    clearResetPasswordData: (state) => {
      state.resetPasswordData = null;
    },
    loginSuccess: (state, action: PayloadAction<{ user: any; token: string }>) => {
      const normalized = normalizeUser(action.payload.user);
      state.isAuthenticated = true;
      state.user = normalized;
      state.token = action.payload.token;
      state.isInitialized = true;

      // Chỉ lưu userInfo vào localStorage
      localStorage.setItem('user', JSON.stringify(normalized));
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.isAuthenticated = true;
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
    setUser: (state, action: PayloadAction<any>) => {
      const normalized = normalizeUser(action.payload);
      state.user = normalized;
      localStorage.setItem('user', JSON.stringify(normalized));
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.isInitialized = true;

      // Xóa userInfo khỏi localStorage
      localStorage.removeItem('user');
    },
  },
});

export const { setRegistrationData, clearRegistrationData, setResetPasswordData, clearResetPasswordData, loginSuccess, setToken, setInitialized, setUser, logout } = authSlice.actions;

export default authSlice.reducer;
