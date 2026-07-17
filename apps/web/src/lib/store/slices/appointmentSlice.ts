import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api/client';
import { logout } from './authSlice';

export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  dateTime: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  fee: number;
  isPaid: boolean;
  reason?: string;
  issueCategory?: string;
  notes?: string;
  declineReason?: string;
  createdAt: string;
  doctor?: {
    fullName: string;
    specialization: string;
    profilePicture?: string;
    clinicName?: string;
  };
  patient?: {
    phone: string;
    patientProfile?: { fullName: string; gender: string; bloodType: string; dateOfBirth: string };
  };
}

export interface DoctorScheduleEntry {
  id: number;
  doctorId: number;
  date: string;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
  clinicRoom: string | null;
}

interface AppointmentState {
  appointments: Appointment[];
  doctorSchedules: DoctorScheduleEntry[];
  stats: { todayAppointments: number; pendingRequests: number; upcomingTotal: number; totalCompleted: number } | null;
  loading: boolean;
  loadingSchedules: boolean;
  error: string | null;
}

const initialState: AppointmentState = {
  appointments: [],
  doctorSchedules: [],
  stats: null,
  loading: false,
  loadingSchedules: false,
  error: null,
};

export const fetchMyAppointments = createAsyncThunk(
  'appointment/fetchMy',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { auth: { token: string | null } };
    try {
      const response = await api.get('/appointments/my', {
        headers: { Authorization: `Bearer ${state.auth.token}` },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch appointments');
    }
  }
);

export const cancelAppointment = createAsyncThunk(
  'appointment/cancel',
  async (appointmentId: number, { getState, rejectWithValue }) => {
    const state = getState() as { auth: { token: string | null } };
    try {
      const response = await api.patch(`/appointments/${appointmentId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${state.auth.token}` },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel');
    }
  }
);

export const fetchDoctorScheduleSlots = createAsyncThunk(
  'appointment/fetchDoctorScheduleSlots',
  async ({ doctorId, from, to }: { doctorId: number; from?: string; to?: string }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/doctors/${doctorId}/schedules`, { params: { from, to } });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch schedule');
    }
  }
);

export const createAppointment = createAsyncThunk(
  'appointment/create',
  async (data: any, { getState, rejectWithValue }) => {
    const state = getState() as { auth: { token: string | null } };
    try {
      const response = await api.post('/appointments', data, {
        headers: { Authorization: `Bearer ${state.auth.token}` },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create appointment');
    }
  }
);

export const fetchDoctorAppointments = createAsyncThunk(
  'appointment/fetchDoctor',
  async (filters: any, { getState, rejectWithValue }) => {
    const state = getState() as { auth: { token: string | null } };
    try {
      const response = await api.get('/appointments/doctor', {
        params: filters,
        headers: { Authorization: `Bearer ${state.auth.token}` },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch appointments');
    }
  }
);

export const acceptAppointment = createAsyncThunk(
  'appointment/accept',
  async (id: number, { getState, rejectWithValue }) => {
    const state = getState() as { auth: { token: string | null } };
    try {
      const response = await api.patch(`/appointments/${id}/accept`, {}, {
        headers: { Authorization: `Bearer ${state.auth.token}` },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to accept');
    }
  }
);

export const declineAppointment = createAsyncThunk(
  'appointment/decline',
  async ({ id, reason }: { id: number; reason: string }, { getState, rejectWithValue }) => {
    const state = getState() as { auth: { token: string | null } };
    try {
      await api.patch(`/appointments/${id}/decline`, { reason }, {
        headers: { Authorization: `Bearer ${state.auth.token}` },
      });
      return { id, status: 'declined' as const, declineReason: reason };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to decline');
    }
  }
);

export const fetchDoctorStats = createAsyncThunk(
  'appointment/fetchStats',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { auth: { token: string | null } };
    try {
      const response = await api.get('/appointments/doctor/stats', {
        headers: { Authorization: `Bearer ${state.auth.token}` },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch stats');
    }
  }
);

const appointmentSlice = createSlice({
  name: 'appointment',
  initialState,
  reducers: {
    clearAppointmentError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyAppointments.fulfilled, (state, action) => { state.appointments = action.payload; })
      .addCase(fetchDoctorAppointments.fulfilled, (state, action) => { state.appointments = action.payload; })
      .addCase(createAppointment.pending, (state) => { state.loading = true; })
      .addCase(createAppointment.fulfilled, (state, action) => { state.loading = false; state.appointments.unshift(action.payload); })
      .addCase(createAppointment.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(acceptAppointment.fulfilled, (state, action) => {
        const idx = state.appointments.findIndex(a => a.id === action.payload.id);
        if (idx !== -1) state.appointments[idx] = action.payload;
      })
      .addCase(declineAppointment.fulfilled, (state, action) => {
        const idx = state.appointments.findIndex(a => a.id === action.payload.id);
        if (idx !== -1) { state.appointments[idx].status = 'declined'; state.appointments[idx].declineReason = action.payload.declineReason; }
      })
      .addCase(cancelAppointment.fulfilled, (state, action) => {
        const idx = state.appointments.findIndex(a => a.id === action.payload.id);
        if (idx !== -1) state.appointments[idx].status = 'cancelled';
      })
      .addCase(fetchDoctorStats.fulfilled, (state, action) => { state.stats = action.payload; })
      .addCase(fetchDoctorScheduleSlots.fulfilled, (state, action) => { state.doctorSchedules = action.payload; })
      .addCase(logout, () => initialState);
  },
});

export const { clearAppointmentError } = appointmentSlice.actions;
export default appointmentSlice.reducer;
