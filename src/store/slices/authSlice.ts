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

  // Xác thực người dùng
  isAuthenticated: boolean;
  user: any | null;
  token: string | null;
}

const initialState: AuthState = {
  registrationData: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  user: null,
  token: localStorage.getItem('access_token') || null,
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
    loginSuccess: (state, action: PayloadAction<{ user: any; token: string }>) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem('access_token', action.payload.token);
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      localStorage.removeItem('access_token');
    },
  },
});

export const { setRegistrationData, clearRegistrationData, loginSuccess, logout } = authSlice.actions;

export default authSlice.reducer;
