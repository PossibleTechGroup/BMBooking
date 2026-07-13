import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { BASE_URL } from '../../constants/api';
import { RootState } from '../index';
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
  attachments?: string[];
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
    patientProfile?: {
      fullName: string;
      gender: string;
      bloodType: string;
      dateOfBirth: string;
    };
  };
  bookedBy?: {
    id: number;
    patientProfile?: {
      fullName: string;
    };
  };
  followUps?: { id: number }[];
}

interface Recommendation {
  category: string;
  label: string;
  documents: { key: string; label: string; description: string }[];
}

export interface OtherPatientDetails {
  fullName: string;
  phone: string;
  gender: 'male' | 'female';
  dateOfBirth: string;
  bloodType: string;
}

export interface DoctorScheduleEntry {
  id: number;
  doctorId: number;
  date: string;
  startTime: string;
  endTime: string;
  slotDuration: number;
  maxPatientsPerSlot: number;
  isActive: boolean;
  clinicRoom: string | null;
  notes: string | null;
  doctor?: {
    fullName: string;
    clinicName: string | null;
    hospital?: { name: string } | null;
  };
  hospital?: { name: string } | null;
}

interface AppointmentState {
  appointments: Appointment[];
  doctorSchedules: DoctorScheduleEntry[];
  calendarData: any[];
  recommendations: Recommendation | null;
  categories: { key: string; label: string; icon: string }[];
  stats: {
    todayAppointments: number;
    pendingRequests: number;
    upcomingTotal: number;
    totalCompleted?: number;
  } | null;
  loading: boolean;
  loadingSchedules: boolean;
  error: string | null;
  bookingFor: 'myself' | 'someone_else';
  otherPatientDetails: OtherPatientDetails;
}

const initialOtherPatient: OtherPatientDetails = {
  fullName: '',
  phone: '',
  gender: 'male',
  dateOfBirth: '',
  bloodType: '',
};

const initialState: AppointmentState = {
  appointments: [],
  doctorSchedules: [],
  calendarData: [],
  recommendations: null,
  categories: [],
  stats: null,
  loading: false,
  loadingSchedules: false,
  error: null,
  bookingFor: 'myself',
  otherPatientDetails: { ...initialOtherPatient },
};

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Patient Thunks ───────────────────────────────────────────────

export const fetchCategories = createAsyncThunk(
  'appointment/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/appointments/categories');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

export const fetchRecommendations = createAsyncThunk(
  'appointment/fetchRecommendations',
  async (category: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/appointments/recommendations/${category}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch recommendations');
    }
  }
);

export const createAppointment = createAsyncThunk(
  'appointment/create',
  async (data: any, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    try {
      const response = await api.post('/api/appointments', data, {
        headers: { Authorization: `Bearer ${state.auth.token}` },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create appointment');
    }
  }
);

export const fetchDoctorScheduleSlots = createAsyncThunk(
  'appointment/fetchDoctorScheduleSlots',
  async ({ doctorId, from, to }: { doctorId: number; from?: string; to?: string }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/doctors/${doctorId}/schedules`, {
        params: { from, to },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch doctor schedule');
    }
  }
);

export const fetchMyAppointments = createAsyncThunk(
  'appointment/fetchMy',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    try {
      const response = await api.get('/api/appointments/my', {
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
    const state = getState() as RootState;
    try {
      const response = await api.patch(
        `/api/appointments/${appointmentId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${state.auth.token}` } },
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel appointment');
    }
  }
);

export const rescheduleAppointment = createAsyncThunk(
  'appointment/reschedule',
  async ({ appointmentId, dateTime, slotId }: { appointmentId: number; dateTime: string; slotId?: number }, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    try {
      const response = await api.patch(
        `/api/appointments/${appointmentId}/reschedule`,
        { dateTime, slotId },
        { headers: { Authorization: `Bearer ${state.auth.token}` } },
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reschedule appointment');
    }
  }
);

export const fetchDoctorOwnSchedules = createAsyncThunk(
  'appointment/fetchDoctorOwnSchedules',
  async (params: { from: string; to: string }, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const doctorId = (state.auth.user as any)?.doctorProfile?.id;
    if (!doctorId) return rejectWithValue('No doctor profile');
    try {
      const response = await api.get(`/api/doctors/${doctorId}/schedules`, {
        params,
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch schedules');
    }
  }
);

export const createDoctorSchedule = createAsyncThunk(
  'appointment/createDoctorSchedule',
  async (data: {
    date: string;
    startTime: string;
    endTime: string;
    slotDuration?: number;
    maxPatientsPerSlot?: number;
    repeatWeeks?: number;
    daysOfWeek?: number[];
    repeatEndDate?: string;
    notes?: string;
    hospitalId?: number | null;
  }, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    try {
      const response = await api.post('/api/doctors/schedules', data, {
        headers: { Authorization: `Bearer ${state.auth.token}` },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create schedule');
    }
  }
);

// ─── Doctor Thunks ────────────────────────────────────────────────

export const fetchDoctorAppointments = createAsyncThunk(
  'appointment/fetchDoctor',
  async (filters: any, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    try {
      const response = await api.get('/api/appointments/doctor', {
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
    const state = getState() as RootState;
    try {
      const response = await api.patch(`/api/appointments/${id}/accept`, {}, {
        headers: { Authorization: `Bearer ${state.auth.token}` },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to accept appointment');
    }
  }
);

export const declineAppointment = createAsyncThunk(
  'appointment/decline',
  async ({ id, reason }: { id: number; reason: string }, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    try {
      const response = await api.patch(`/api/appointments/${id}/decline`, { reason }, {
        headers: { Authorization: `Bearer ${state.auth.token}` },
      });
      return { id, status: 'declined', declineReason: reason };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to decline appointment');
    }
  }
);

export const completeAppointment = createAsyncThunk(
  'appointment/complete',
  async (id: number, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    try {
      const response = await api.patch(`/api/appointments/${id}/complete`, {}, {
        headers: { Authorization: `Bearer ${state.auth.token}` },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to complete appointment');
    }
  }
);

export const createFollowUp = createAsyncThunk(
  'appointment/createFollowUp',
  async ({ parentId, dateTime, reason }: { parentId: number; dateTime: string; reason?: string }, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    try {
      const response = await api.post(`/api/appointments/${parentId}/follow-up`, { dateTime, reason }, {
        headers: { Authorization: `Bearer ${state.auth.token}` },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to schedule follow-up');
    }
  }
);

export const fetchDoctorStats = createAsyncThunk(
  'appointment/fetchStats',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    try {
      const response = await api.get('/api/appointments/doctor/stats', {
        headers: { Authorization: `Bearer ${state.auth.token}` },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch stats');
    }
  }
);

export const fetchCalendarData = createAsyncThunk(
  'appointment/fetchCalendar',
  async ({ month, year }: { month: number; year: number }, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    try {
      const response = await api.get('/api/appointments/doctor/calendar', {
        params: { month, year },
        headers: { Authorization: `Bearer ${state.auth.token}` },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch calendar data');
    }
  }
);

const appointmentSlice = createSlice({
  name: 'appointment',
  initialState,
  reducers: {
    clearAppointmentError: (state) => {
      state.error = null;
    },
    resetRecommendations: (state) => {
      state.recommendations = null;
    },
    setBookingFor: (state, action: PayloadAction<'myself' | 'someone_else'>) => {
      state.bookingFor = action.payload;
    },
    setOtherPatientField: (state, action: PayloadAction<{ field: keyof OtherPatientDetails; value: string }>) => {
      const { field, value } = action.payload;
      state.otherPatientDetails[field] = value as any;
    },
    setOtherPatientDetails: (state, action: PayloadAction<OtherPatientDetails>) => {
      state.otherPatientDetails = action.payload;
    },
    resetBookingState: (state) => {
      state.bookingFor = 'myself';
      state.otherPatientDetails = { ...initialOtherPatient };
    },
  },
  extraReducers: (builder) => {
    builder
      // Categories
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })
      // Recommendations
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        state.recommendations = action.payload;
      })
      // Create
      .addCase(createAppointment.pending, (state) => {
        state.loading = true;
      })
      .addCase(createAppointment.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments.unshift(action.payload);
      })
      .addCase(createAppointment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch My
      .addCase(fetchMyAppointments.fulfilled, (state, action) => {
        state.appointments = action.payload;
      })
      // Doctor Appointments
      .addCase(fetchDoctorAppointments.fulfilled, (state, action) => {
        state.appointments = action.payload;
      })
      // Create Doctor Schedule
      .addCase(createDoctorSchedule.fulfilled, (state, action) => {
        const schedules = Array.isArray(action.payload) ? action.payload : [action.payload];
        state.doctorSchedules = [...state.doctorSchedules, ...schedules];
      })
      // Doctor Own Schedules
      .addCase(fetchDoctorOwnSchedules.pending, (state) => {
        state.loadingSchedules = true;
      })
      .addCase(fetchDoctorOwnSchedules.fulfilled, (state, action) => {
        state.loadingSchedules = false;
        state.doctorSchedules = action.payload;
      })
      .addCase(fetchDoctorOwnSchedules.rejected, (state) => {
        state.loadingSchedules = false;
      })
      // Accept
      .addCase(acceptAppointment.fulfilled, (state, action) => {
        const index = state.appointments.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.appointments[index] = action.payload;
        }
      })
      // Decline
      .addCase(declineAppointment.fulfilled, (state, action) => {
        const index = state.appointments.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.appointments[index].status = 'declined';
          state.appointments[index].declineReason = action.payload.declineReason;
        }
      })
      // Complete
      .addCase(completeAppointment.fulfilled, (state, action) => {
        const index = state.appointments.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.appointments[index].status = 'completed';
        }
      })
      // Follow-up
      .addCase(createFollowUp.fulfilled, (state, action) => {
        state.appointments.push(action.payload);
      })
      // Cancel
      .addCase(cancelAppointment.fulfilled, (state, action) => {
        const index = state.appointments.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.appointments[index].status = 'cancelled';
        }
      })
      // Reschedule
      .addCase(rescheduleAppointment.fulfilled, (state, action) => {
        const index = state.appointments.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.appointments[index] = action.payload;
        }
      })
      // Stats
      .addCase(fetchDoctorStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      // Calendar
      .addCase(fetchCalendarData.fulfilled, (state, action) => {
        state.calendarData = action.payload;
      })
      .addCase(logout, () => initialState);
  },
});

export const {
  clearAppointmentError,
  resetRecommendations,
  setBookingFor,
  setOtherPatientField,
  setOtherPatientDetails,
  resetBookingState,
} = appointmentSlice.actions;
export default appointmentSlice.reducer;
