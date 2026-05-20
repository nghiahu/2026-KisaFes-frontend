import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notificationService, type NotificationResponse } from '../../services/notification.service';

interface NotificationState {
  notifications: NotificationResponse[];
  loading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  loading: false,
  error: null,
};

export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationService.getMyNotifications();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch notifications');
    }
  }
);

export const acceptInvitation = createAsyncThunk(
  'notification/acceptInvitation',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await notificationService.acceptInvitation(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to accept invitation');
    }
  }
);

export const declineInvitation = createAsyncThunk(
  'notification/declineInvitation',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await notificationService.declineInvitation(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to decline invitation');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchNotifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // acceptInvitation
      .addCase(acceptInvitation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(acceptInvitation.fulfilled, (state, action) => {
        state.loading = false;
        const updatedNotification = action.payload;
        const index = state.notifications.findIndex((n) => n.id === updatedNotification.id);
        if (index !== -1) {
          state.notifications[index] = updatedNotification;
        }
      })
      .addCase(acceptInvitation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // declineInvitation
      .addCase(declineInvitation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(declineInvitation.fulfilled, (state, action) => {
        state.loading = false;
        const updatedNotification = action.payload;
        const index = state.notifications.findIndex((n) => n.id === updatedNotification.id);
        if (index !== -1) {
          state.notifications[index] = updatedNotification;
        }
      })
      .addCase(declineInvitation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
