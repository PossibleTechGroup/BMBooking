import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { BASE_URL } from '../../constants/api';
import { RootState } from '../index';
import { logout } from './authSlice';

interface PatientProfile {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  bloodType?: string;
  emergencyContact?: string;
}

interface PatientState {
  profile: PatientProfile | null;
  loading: boolean;
  error: string | null;
}

const initialState: PatientState = {
  profile: null,
  loading: false,
  error: null,
};

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const submitPatientProfile = createAsyncThunk(
  'patient/submitProfile',
  async (formData: PatientProfile, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    try {
      const response = await api.post('/api/patients/profile', formData, {
        headers: { Authorization: `Bearer ${state.auth.token}` },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save profile');
    }
  }
);

export const fetchPatientProfile = createAsyncThunk(
  'patient/fetchProfile',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    try {
      const response = await api.get('/api/patients/profile', {
        headers: { Authorization: `Bearer ${state.auth.token}` },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

const patientSlice = createSlice({
  name: 'patient',
  initialState,
  reducers: {
    clearPatientError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitPatientProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(submitPatientProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(submitPatientProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchPatientProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(logout, () => initialState);
  },
});

export const { clearPatientError } = patientSlice.actions;
export default patientSlice.reducer;
