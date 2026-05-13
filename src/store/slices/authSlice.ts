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
}

// Khôi phục userInfo từ localStorage
const storedUser = localStorage.getItem('user');

const initialState: AuthState = {
  registrationData: null,
  resetPasswordData: null,
  isAuthenticated: false,
  user: storedUser ? JSON.parse(storedUser) : null,
  token: null,
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
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;

      // Chỉ lưu userInfo vào localStorage
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.isAuthenticated = true;
    },
    setUser: (state, action: PayloadAction<any>) => {
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;

      // Xóa userInfo khỏi localStorage
      localStorage.removeItem('user');
    },
  },
});

export const { setRegistrationData, clearRegistrationData, setResetPasswordData, clearResetPasswordData, loginSuccess, setToken, setUser, logout } = authSlice.actions;

export default authSlice.reducer;
