import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import client from '../../api/client';

export interface DoctorUser {
  id: number;
  phone: string;
  email: string | null;
}

export interface Doctor {
  id: number;
  fullName: string;
  specialization: string;
  status: string;
  licenseNumber: string | null;
  experienceYears: number | null;
  bio: string | null;
  profilePicture: string | null;
  introVideo: string | null;
  user: DoctorUser;
}

interface DoctorsState {
  doctors: Doctor[];
  loading: boolean;
  error: string;
  page: number;
  totalPages: number;
  total: number;
  saving: boolean;
  registerResult: { tempPassword?: string } | null;
}

const initialState: DoctorsState = {
  doctors: [],
  loading: false,
  error: '',
  page: 1,
  totalPages: 1,
  total: 0,
  saving: false,
  registerResult: null,
};

export const fetchDoctors = createAsyncThunk(
  'doctors/fetchAll',
  async (page: number, { rejectWithValue }) => {
    try {
      const res = await client.get('/receptionist/doctors', { params: { page, limit: 20, includeAll: 'true' } });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load doctors');
    }
  }
);

export const registerDoctor = createAsyncThunk(
  'doctors/register',
  async (fd: FormData, { rejectWithValue }) => {
    try {
      const res = await client.post('/receptionist/doctors/register', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
  }
);

export const updateDoctor = createAsyncThunk(
  'doctors/update',
  async ({ id, payload }: { id: number; payload: Record<string, unknown> }, { rejectWithValue }) => {
    try {
      const res = await client.put(`/receptionist/doctors/${id}`, payload);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Update failed');
    }
  }
);

export const deleteDoctor = createAsyncThunk(
  'doctors/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await client.delete(`/receptionist/doctors/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Delete failed');
    }
  }
);

const doctorsSlice = createSlice({
  name: 'doctors',
  initialState,
  reducers: {
    clearDoctorsError: (state) => { state.error = ''; },
    clearRegisterResult: (state) => { state.registerResult = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDoctors.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(fetchDoctors.fulfilled, (state, action) => {
        state.loading = false;
        state.doctors = action.payload.data;
        state.page = action.payload.pagination.page;
        state.totalPages = action.payload.pagination.totalPages;
        state.total = action.payload.pagination.total;
      })
      .addCase(fetchDoctors.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to load doctors';
      })
      .addCase(registerDoctor.pending, (state) => {
        state.saving = true;
        state.error = '';
        state.registerResult = null;
      })
      .addCase(registerDoctor.fulfilled, (state, action) => {
        state.saving = false;
        state.registerResult = action.payload;
      })
      .addCase(registerDoctor.rejected, (state, action) => {
        state.saving = false;
        state.error = (action.payload as string) || 'Registration failed';
      })
      .addCase(updateDoctor.pending, (state) => {
        state.saving = true;
        state.error = '';
      })
      .addCase(updateDoctor.fulfilled, (state, action) => {
        state.saving = false;
        if (action.payload) {
          const idx = state.doctors.findIndex(d => d.id === action.payload.id);
          if (idx !== -1) state.doctors[idx] = action.payload;
        }
      })
      .addCase(updateDoctor.rejected, (state, action) => {
        state.saving = false;
        state.error = (action.payload as string) || 'Update failed';
      })
      .addCase(deleteDoctor.pending, (state) => {
        state.saving = true;
        state.error = '';
      })
      .addCase(deleteDoctor.fulfilled, (state, action) => {
        state.saving = false;
        state.doctors = state.doctors.filter(d => d.id !== action.payload);
        state.total = Math.max(0, state.total - 1);
      })
      .addCase(deleteDoctor.rejected, (state, action) => {
        state.saving = false;
        state.error = (action.payload as string) || 'Delete failed';
      });
  },
});

export const { clearDoctorsError, clearRegisterResult } = doctorsSlice.actions;
export default doctorsSlice.reducer;
