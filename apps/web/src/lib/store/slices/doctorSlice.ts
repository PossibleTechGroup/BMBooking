import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/lib/api/client';
import { logout } from './authSlice';

interface DoctorProfile {
  id: number;
  fullName: string;
  specialization: string;
  profilePicture: string | null;
  introVideo: string | null;
  experienceYears: number;
  bio: string;
  rating: number;
  totalReviews: number;
  clinicName: string;
  clinicAddress: string;
  languages: string[];
  specializations?: string[];
  hospital?: {
    id: number;
    name: string;
    cardPrice: string;
    serviceFee?: { amount: string } | null;
    latitude?: number;
    longitude?: number;
  } | null;
}

interface DoctorState {
  doctors: DoctorProfile[];
  loading: boolean;
  error: string | null;
}

const initialState: DoctorState = {
  doctors: [],
  loading: false,
  error: null,
};

export const fetchDoctors = createAsyncThunk(
  'doctors/fetchDoctors',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`/doctors/all?t=${Date.now()}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch doctors');
    }
  }
);

const doctorSlice = createSlice({
  name: 'doctors',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDoctors.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDoctors.fulfilled, (state, action) => { state.loading = false; state.doctors = action.payload; })
      .addCase(fetchDoctors.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(logout, () => initialState);
  },
});

export default doctorSlice.reducer;
