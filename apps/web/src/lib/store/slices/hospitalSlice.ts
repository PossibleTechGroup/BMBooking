import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/lib/api/client';
import { logout } from './authSlice';

export interface HospitalProfile {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  image?: string | null;
  cardPrice?: string;
  serviceFee?: { amount: string } | null;
}

export interface DoctorItem {
  id: number;
  fullName: string | null;
  specialization?: string | null;
  status: string;
  rejectionReason: string | null;
  user?: { id: number; phone: string | null };
  _count?: { appointments: number };
}

export interface ReceptionistItem {
  id: number;
  userId: number;
  user: {
    id: number;
    username: string | null;
    phone: string | null;
    email: string | null;
    createdAt?: string;
  };
  createdAt: string;
}

export interface HospitalListItem {
  id: number;
  name: string;
  address: string | null;
  image: string | null;
  phone: string | null;
  latitude?: number | null;
  longitude?: number | null;
  cardPrice?: string;
  serviceFee?: { amount: string } | null;
  doctorCount?: number;
  rating?: number | null;
}

export interface HospitalDetail {
  id: number;
  name: string;
  address: string | null;
  image: string | null;
  phone: string | null;
  email: string | null;
  latitude?: number | null;
  longitude?: number | null;
  cardPrice?: string;
  serviceFee?: { amount: string } | null;
  doctors: DoctorDetail[];
}

export interface DoctorDetail {
  id: number;
  fullName: string | null;
  profilePicture: string | null;
  specialization: string | null;
  specializations: string[] | null;
  bio: string | null;
  experienceYears: number | null;
  rating: number | null;
  totalReviews: number;
  clinicName: string | null;
  clinicAddress: string | null;
  baseHourlyRate: string | null;
}

export interface HospitalAppointment {
  id: number;
  doctorId?: number | null;
  doctorName?: string | null;
  specialization?: string | null;
  patientId?: number | null;
  patientPhone?: string | null;
  patientName: string;
  dateTime: string;
  status: string;
  fee?: string | number;
  isPaid?: boolean;
  paymentMethod?: string | null;
  reason?: string | null;
  confirmationCode?: string | null;
  slotStart?: string | null;
  createdAt: string;
}

interface HospitalState {
  profile: HospitalProfile | null;
  stats: {
    doctors: number;
    pendingDoctors: number;
    receptionists: number;
    appointments: number;
    pendingAppointments: number;
  } | null;
  doctors: DoctorItem[];
  receptionists: ReceptionistItem[];
  hospitals: HospitalListItem[];
  selectedHospital: HospitalDetail | null;
  appointments: HospitalAppointment[];
  loading: boolean;
  error: string | null;
}

const initialState: HospitalState = {
  profile: null,
  stats: null,
  doctors: [],
  receptionists: [],
  hospitals: [],
  selectedHospital: null,
  appointments: [],
  loading: false,
  error: null,
};

export const fetchHospitals = createAsyncThunk(
  'hospital/fetchHospitals',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`/hospitals?t=${Date.now()}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch hospitals');
    }
  }
);

export const fetchHospitalById = createAsyncThunk(
  'hospital/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/hospitals/${id}?t=${Date.now()}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch hospital');
    }
  }
);

export const fetchHospitalAppointments = createAsyncThunk(
  'hospital/fetchAppointments',
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const query = status ? `?status=${status}` : '';
      const response = await api.get(`/hospital/appointments${query}${query ? '&' : '?'}t=${Date.now()}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch appointments');
    }
  }
);

export const registerHospital = createAsyncThunk(
  'hospital/register',
  async (data: { name: string; address?: string; phone?: string; email?: string; adminPhone: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/hospital/register', data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to register hospital');
    }
  }
);

export const fetchHospitalProfile = createAsyncThunk(
  'hospital/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/hospital/profile');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const updateHospitalProfile = createAsyncThunk(
  'hospital/updateProfile',
  async (data: { name?: string; address?: string; phone?: string; email?: string }, { rejectWithValue }) => {
    try {
      const response = await api.patch('/hospital/profile', data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const fetchHospitalStats = createAsyncThunk(
  'hospital/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/hospital/stats');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch stats');
    }
  }
);

export const fetchHospitalDoctors = createAsyncThunk(
  'hospital/fetchDoctors',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/hospital/doctors?includeAll=true');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch doctors');
    }
  }
);

export const updateDoctorStatus = createAsyncThunk(
  'hospital/updateDoctorStatus',
  async ({ id, status, rejectionReason }: { id: number; status: 'Approved' | 'Rejected'; rejectionReason?: string }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/hospital/doctors/${id}/status`, { status, rejectionReason });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update doctor status');
    }
  }
);

export const fetchHospitalReceptionists = createAsyncThunk(
  'hospital/fetchReceptionists',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/hospital/receptionists');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch receptionists');
    }
  }
);

export const createReceptionist = createAsyncThunk(
  'hospital/createReceptionist',
  async (data: { username: string; phone?: string; email?: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/hospital/receptionists', data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create receptionist');
    }
  }
);

export const updateReceptionist = createAsyncThunk(
  'hospital/updateReceptionist',
  async ({ id, data }: { id: number; data: { username?: string; phone?: string; email?: string; password?: string } }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/hospital/receptionists/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update receptionist');
    }
  }
);

export const deleteReceptionist = createAsyncThunk(
  'hospital/deleteReceptionist',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/hospital/receptionists/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete receptionist');
    }
  }
);

const hospitalSlice = createSlice({
  name: 'hospital',
  initialState,
  reducers: {
    clearHospitalError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHospitals.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchHospitals.fulfilled, (state, action) => { state.loading = false; state.hospitals = action.payload; })
      .addCase(fetchHospitals.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchHospitalById.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchHospitalById.fulfilled, (state, action) => { state.loading = false; state.selectedHospital = action.payload; })
      .addCase(fetchHospitalById.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchHospitalAppointments.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchHospitalAppointments.fulfilled, (state, action) => { state.loading = false; state.appointments = action.payload; })
      .addCase(fetchHospitalAppointments.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(registerHospital.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerHospital.fulfilled, (state) => { state.loading = false; })
      .addCase(registerHospital.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchHospitalProfile.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchHospitalProfile.fulfilled, (state, action) => { state.loading = false; state.profile = action.payload; })
      .addCase(fetchHospitalProfile.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(updateHospitalProfile.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateHospitalProfile.fulfilled, (state, action) => { state.loading = false; state.profile = action.payload; })
      .addCase(updateHospitalProfile.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchHospitalStats.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchHospitalStats.fulfilled, (state, action) => { state.loading = false; state.stats = action.payload; })
      .addCase(fetchHospitalStats.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchHospitalDoctors.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchHospitalDoctors.fulfilled, (state, action) => { state.loading = false; state.doctors = action.payload; })
      .addCase(fetchHospitalDoctors.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(updateDoctorStatus.fulfilled, (state, action) => {
        const updated = action.payload as DoctorItem;
        state.doctors = state.doctors.map((d) => (d.id === updated.id ? { ...d, status: updated.status, rejectionReason: updated.rejectionReason } : d));
      })
      .addCase(updateDoctorStatus.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(fetchHospitalReceptionists.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchHospitalReceptionists.fulfilled, (state, action) => { state.loading = false; state.receptionists = action.payload; })
      .addCase(fetchHospitalReceptionists.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(createReceptionist.fulfilled, (state, action) => {
        state.receptionists = [action.payload as ReceptionistItem, ...state.receptionists];
      })
      .addCase(createReceptionist.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(updateReceptionist.fulfilled, (state, action) => {
        const updated = action.payload as ReceptionistItem;
        state.receptionists = state.receptionists.map((r) => (r.id === updated.id ? updated : r));
      })
      .addCase(updateReceptionist.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(deleteReceptionist.fulfilled, (state, action) => {
        state.receptionists = state.receptionists.filter((r) => r.id !== action.payload);
      })
      .addCase(deleteReceptionist.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(logout, () => initialState);
  },
});

export const { clearHospitalError } = hospitalSlice.actions;
export default hospitalSlice.reducer;
