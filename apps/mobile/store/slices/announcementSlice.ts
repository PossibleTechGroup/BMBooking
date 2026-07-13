import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { BASE_URL } from '../../constants/api';
import { logout } from './authSlice';

export interface Announcement {
  id: number;
  title: string;
  message: string;
  audience: string;
  isPublished: boolean;
  createdAt: string;
  publishedAt: string | null;
}

interface AnnouncementState {
  items: Announcement[];
  loading: boolean;
  error: string | null;
}

const initialState: AnnouncementState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchAnnouncements = createAsyncThunk(
  'announcements/fetchAll',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { auth: { token: string } };
    try {
      const response = await axios.get(`${BASE_URL}/api/announcements`, {
        headers: { Authorization: `Bearer ${state.auth.token}` },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch announcements');
    }
  }
);

const announcementSlice = createSlice({
  name: 'announcements',
  initialState,
  reducers: {},
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
      .addCase(fetchAnnouncements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(logout, () => initialState);
  },
});

export default announcementSlice.reducer;
