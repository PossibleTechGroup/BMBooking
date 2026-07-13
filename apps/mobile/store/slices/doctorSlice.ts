import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { BASE_URL } from '../../constants/api';
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
  availability: any;
  specializations?: string[];
  hospital?: {
    id: number;
    name: string;
    cardPrice: string;
    serviceFee?: {
      amount: string;
    } | null;
    cardTemplates?: {
      id: number;
      name: string;
      price: string;
      isActive: boolean;
    }[] | null;
  } | null;
}

interface DoctorState {
  doctors: DoctorProfile[];
  loading: boolean;
  error: string | null;
  recommendations: any | null;
}

const initialState: DoctorState = {
  doctors: [],
  loading: false,
  error: null,
  recommendations: null,
};

export const fetchDoctors = createAsyncThunk(
  'doctors/fetchDoctors',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/doctors/all?t=${Date.now()}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch doctors');
    }
  }
);

export const fetchRecommendations = createAsyncThunk(
  'doctors/fetchRecommendations',
  async (category: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/appointments/recommendations/${category.toLowerCase()}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch recommendations');
    }
  }
);

const doctorSlice = createSlice({
  name: 'doctors',
  initialState,
  reducers: {
    clearRecommendations: (state) => {
      state.recommendations = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDoctors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDoctors.fulfilled, (state, action) => {
        state.loading = false;
        state.doctors = action.payload;
      })
      .addCase(fetchDoctors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        state.recommendations = action.payload;
      })
      .addCase(logout, () => initialState);
  },
});

export const { clearRecommendations } = doctorSlice.actions;
export default doctorSlice.reducer;
