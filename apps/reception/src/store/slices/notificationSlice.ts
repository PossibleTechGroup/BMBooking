import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import client from '../../api/client';

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata: Record<string, any> | null;
  createdAt: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  error: string;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: '',
};

export const fetchNotifications = createAsyncThunk(
  'receptionNotifications/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await client.get(`/notifications?limit=50&t=${Date.now()}`);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load notifications');
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'receptionNotifications/unreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const res = await client.get(`/notifications/unread-count?t=${Date.now()}`);
      return res.data.data.unreadCount;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load unread count');
    }
  }
);

export const markAsRead = createAsyncThunk(
  'receptionNotifications/markRead',
  async (id: number, { rejectWithValue }) => {
    try {
      const res = await client.patch(`/notifications/${id}/read`);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to mark as read');
    }
  }
);

export const markAllAsRead = createAsyncThunk(
  'receptionNotifications/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      const res = await client.patch('/notifications/read-all');
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to mark all as read');
    }
  }
);

const notificationSlice = createSlice({
  name: 'receptionNotifications',
  initialState,
  reducers: {
    clearNotificationError: (state) => { state.error = ''; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload?.notifications ?? [];
        state.unreadCount = action.payload?.unreadCount ?? 0;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to load notifications';
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const id = action.meta.arg;
        const n = state.notifications.find((x) => x.id === id);
        if (n && !n.isRead) {
          n.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAsRead.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Failed to mark as read';
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications = state.notifications.map((n) => ({ ...n, isRead: true }));
        state.unreadCount = 0;
      })
      .addCase(markAllAsRead.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Failed to mark all as read';
      });
  },
});

export const { clearNotificationError } = notificationSlice.actions;
export default notificationSlice.reducer;
