import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

import { API_URL } from '../../config/env';

interface Announcement {
  id: number;
  title: string;
  message: string;
  audience: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

interface AnnouncementState {
  items: Announcement[];
  loading: boolean;
  submitting: boolean;
  success: boolean;
  error: string | null;
}

const initialState: AnnouncementState = {
  items: [],
  loading: false,
  submitting: false,
  success: false,
  error: null,
};

const getAuthHeader = () => {
  const token = localStorage.getItem('admin_token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const fetchAnnouncements = createAsyncThunk(
  'announcements/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/admin/announcements`, getAuthHeader());
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch announcements');
    }
  }
);

export const createAnnouncement = createAsyncThunk(
  'announcements/create',
  async (data: { title: string; message: string; audience: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/admin/announcements`, data, getAuthHeader());
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create announcement');
    }
  }
);

export const updateAnnouncement = createAsyncThunk(
  'announcements/update',
  async ({ id, data }: { id: number; data: { title: string; message: string; audience: string } }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/admin/announcements/${id}`, data, getAuthHeader());
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update announcement');
    }
  }
);

export const deleteAnnouncement = createAsyncThunk(
  'announcements/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/admin/announcements/${id}`, getAuthHeader());
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete announcement');
    }
  }
);

export const togglePublishAnnouncement = createAsyncThunk(
  'announcements/togglePublish',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}/admin/announcements/${id}/publish`, {}, getAuthHeader());
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle publish');
    }
  }
);

export const resendAnnouncement = createAsyncThunk(
  'announcements/resend',
  async (id: number, { rejectWithValue }) => {
    try {
      await axios.post(`${API_URL}/admin/announcements/${id}/resend`, {}, getAuthHeader());
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to resend');
    }
  }
);

const announcementSlice = createSlice({
  name: 'announcements',
  initialState,
  reducers: {
    clearSuccess: (state) => {
      state.success = false;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnnouncements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnnouncements.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(createAnnouncement.pending, (state) => {
        state.submitting = true;
        state.success = false;
        state.error = null;
      })
      .addCase(createAnnouncement.fulfilled, (state, action) => {
        state.submitting = false;
        state.success = true;
        state.items.unshift(action.payload);
      })
      .addCase(updateAnnouncement.pending, (state) => {
        state.submitting = true;
        state.success = false;
        state.error = null;
      })
      .addCase(updateAnnouncement.fulfilled, (state, action) => {
        state.submitting = false;
        state.success = true;
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(deleteAnnouncement.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload);
      })
      .addCase(togglePublishAnnouncement.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addMatcher(
        (action) => action.type.endsWith('/rejected'),
        (state, action: any) => {
          state.loading = false;
          state.submitting = false;
          state.success = false;
          state.error = action.payload || 'Operation failed';
        }
      );
  },
});

export const { clearSuccess, clearError } = announcementSlice.actions;
export default announcementSlice.reducer;
