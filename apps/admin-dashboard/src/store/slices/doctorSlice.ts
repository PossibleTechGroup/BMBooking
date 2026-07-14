import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

import { API_URL } from '../../config/env';

interface DoctorState {
  doctors: any[];
  pendingDoctors: any[];
  loading: boolean;
  success: boolean;
  error: string | null;
}

const initialState: DoctorState = {
  doctors: [],
  pendingDoctors: [],
  loading: false,
  success: false,
  error: null,
};

const getAuthHeader = () => {
  const token = localStorage.getItem('admin_token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const fetchPendingDoctors = createAsyncThunk(
  'adminDoctor/fetchPending',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/admin/doctors/pending`, getAuthHeader());
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch pending doctors');
    }
  }
);

export const fetchAllDoctors = createAsyncThunk(
  'adminDoctor/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/admin/doctors`, getAuthHeader());
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch all doctors');
    }
  }
);

export const reviewDoctor = createAsyncThunk(
  'adminDoctor/review',
  async ({ doctorId, status, rejectionReason }: { doctorId: number; status: string; rejectionReason?: string | null }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/admin/doctors/review`, {
        doctorId,
        status,
        rejectionReason
      }, getAuthHeader());
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to review doctor');
    }
  }
);

export const deleteDoctor = createAsyncThunk(
  'adminDoctor/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/admin/doctors/${id}`, getAuthHeader());
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete doctor');
    }
  }
);

export const createDoctor = createAsyncThunk(
  'adminDoctor/create',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/admin/doctors`, formData, {
        ...getAuthHeader(),
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create doctor');
    }
  }
);

export const assignHospitalToDoctor = createAsyncThunk(
  'adminDoctor/assignHospital',
  async ({ doctorId, hospitalId }: { doctorId: number; hospitalId: number | null }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_URL}/admin/doctors/${doctorId}/assign-hospital`,
        { hospitalId },
        getAuthHeader()
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to assign hospital');
    }
  }
);

const adminDoctorSlice = createSlice({
  name: 'adminDoctor',
  initialState,
  reducers: {
    clearSuccess: (state) => {
      state.success = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPendingDoctors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingDoctors.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingDoctors = action.payload;
      })
      .addCase(fetchAllDoctors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllDoctors.fulfilled, (state, action) => {
        state.loading = false;
        state.doctors = action.payload;
      })
      .addCase(reviewDoctor.pending, (state) => {
        state.loading = true;
        state.success = false;
      })
      .addCase(reviewDoctor.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.pendingDoctors = state.pendingDoctors.filter(d => d.id !== action.payload.id);
        const allIdx = state.doctors.findIndex(d => d.id === action.payload.id);
        if (allIdx !== -1) {
          state.doctors[allIdx] = action.payload;
        } else {
          state.doctors.push(action.payload);
        }
      })
      .addCase(createDoctor.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(createDoctor.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.doctors.unshift(action.payload);
      })
      .addCase(deleteDoctor.fulfilled, (state, action) => {
        state.doctors = state.doctors.filter(d => d.id !== action.payload);
        state.pendingDoctors = state.pendingDoctors.filter(d => d.id !== action.payload);
      })
      .addCase(assignHospitalToDoctor.fulfilled, (state, action) => {
        const update = (list: any[]) => list.map((d) =>
          d.id === action.payload.id ? { ...d, hospitalId: action.payload.hospitalId, hospital: action.payload.hospital } : d
        );
        state.doctors = update(state.doctors);
        state.pendingDoctors = update(state.pendingDoctors);
      })
      .addMatcher(
        (action) => action.type.endsWith('/rejected'),
        (state, action: any) => {
          state.loading = false;
          state.error = action.payload;
        }
      );
  }
});

export const { clearSuccess } = adminDoctorSlice.actions;
export default adminDoctorSlice.reducer;
