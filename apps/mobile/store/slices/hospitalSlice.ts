import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { BASE_URL } from '../../constants/api';
import { logout } from './authSlice';

interface Hospital {
  id: number;
  name: string;
  address?: string;
  image?: string;
}

interface HospitalState {
  hospitals: Hospital[];
  loading: boolean;
  error: string | null;
}

const initialState: HospitalState = {
  hospitals: [],
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
      .addCase(logout, () => initialState);
  },
});

export default hospitalSlice.reducer;
