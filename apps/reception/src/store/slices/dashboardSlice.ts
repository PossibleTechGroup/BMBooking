import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import client from '../../api/client';

export interface CardPackageTemplate {
  id: number;
  name: string;
  price: number;
  durationDays?: number;
  description?: string;
}

export interface DashboardStats {
  todaysAppointments: number;
  todaysApprovedAppointments: number;
  totalBookings: number;
  pendingBookings: number;
  cardPackages: {
    active: number;
    expired: number;
    recent: any[];
    templates: CardPackageTemplate[];
  };
  visitingCards: any[];
  unreadNotifications: number;
}

interface DashboardState {
  stats: DashboardStats | null;
  loading: boolean;
  error: string;
}

const initialState: DashboardState = {
  stats: null,
  loading: false,
  error: '',
};

export const fetchDashboardStats = createAsyncThunk(
  'receptionDashboard/stats',
  async (_, { rejectWithValue }) => {
    try {
      const res = await client.get(`/receptionist/stats/dashboard?t=${Date.now()}`);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load dashboard stats');
    }
  }
);

const dashboardSlice = createSlice({
  name: 'receptionDashboard',
  initialState,
  reducers: {
    clearDashboardError: (state) => { state.error = ''; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to load dashboard stats';
      });
  },
});

export const { clearDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
