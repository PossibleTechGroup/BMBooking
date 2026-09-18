import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { BASE_URL } from '../../constants/api';
import { logout } from './authSlice';

interface Hospital {
  id: number;
  name: string;
  address?: string;
  image?: string;
  phone?: string;
  email?: string;
  description?: string | null;
  latitude?: number;
  longitude?: number;
  cardPrice?: number | null;
  serviceFee?: { amount: number } | null;
  services?: string[];
  rating?: number;
  totalReviews?: number;
  distanceKm?: number | null;
  doctors?: any[];
  reviews?: {
    id: number;
    rating: number;
    comment?: string | null;
    createdAt: string;
    patientName: string;
  }[];
}

interface HospitalState {
  hospitals: Hospital[];
  selected: Hospital | null;
  loading: boolean;
  error: string | null;
}

const initialState: HospitalState = {
  hospitals: [],
  selected: null,
  loading: false,
  error: null,
};

export const fetchHospitals = createAsyncThunk(
  'hospitals/fetchHospitals',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/hospitals?t=${Date.now()}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch hospitals');
    }
  }
);

export const fetchHospitalById = createAsyncThunk(
  'hospitals/fetchHospitalById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/hospitals/${id}?t=${Date.now()}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch hospital');
    }
  }
);

const hospitalSlice = createSlice({
  name: 'hospitals',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHospitals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHospitals.fulfilled, (state, action) => {
        state.loading = false;
        state.hospitals = action.payload || [];
      })
      .addCase(fetchHospitals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchHospitalById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHospitalById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addCase(fetchHospitalById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(logout, () => initialState);
  },
});

export default hospitalSlice.reducer;
