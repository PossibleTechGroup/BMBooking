import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/lib/api/client';
import { logout } from './authSlice';

interface PatientState {
  profile: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: PatientState = {
  profile: null,
  loading: false,
  error: null,
};

export const fetchPatientProfile = createAsyncThunk(
  'patient/fetchProfile',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { auth: { token: string | null } };
    try {
      const response = await api.get('/patients/profile', {
        headers: { Authorization: `Bearer ${state.auth.token}` },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const updatePatientProfile = createAsyncThunk(
  'patient/updateProfile',
  async (data: any, { getState, rejectWithValue }) => {
    const state = getState() as { auth: { token: string | null } };
    try {
      const response = await api.put('/patients/profile', data, {
        headers: { Authorization: `Bearer ${state.auth.token}` },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

const patientSlice = createSlice({
  name: 'patient',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPatientProfile.pending, (state) => { state.loading = true; })
      .addCase(fetchPatientProfile.fulfilled, (state, action) => { state.loading = false; state.profile = action.payload; })
      .addCase(fetchPatientProfile.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(updatePatientProfile.fulfilled, (state, action) => { state.profile = action.payload; })
      .addCase(logout, () => initialState);
  },
});

export default patientSlice.reducer;
