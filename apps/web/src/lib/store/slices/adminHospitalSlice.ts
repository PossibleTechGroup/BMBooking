import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api as client } from '@/lib/api/client';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Hospital {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  image: string | null;
  cardPrice: number;
  serviceFee: number | null;
  _count?: {
    doctors: number;
    receptionists: number;
    equipment: number;
  };
}

export interface ReceptionistProfile {
  id: number;
  userId: number;
  hospitalId: number;
  user: {
    id: number;
    username: string | null;
    phone: string | null;
    email: string | null;
    createdAt: string;
  };
  hospital: {
    id: number;
    name: string;
    cardPrice: number;
  };
}

interface HospitalState {
  hospitals: Hospital[];
  pagination: Pagination;
  receptionists: ReceptionistProfile[];
  loading: boolean;
  success: boolean;
  error: string | null;
}

const initialState: HospitalState = {
  hospitals: [],
  pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
  receptionists: [],
  loading: false,
  success: false,
  error: null,
};

export const fetchHospitals = createAsyncThunk(
  'hospitals/fetchAll',
  async (params: { page?: number; limit?: number } | undefined = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 12 } = params || {};
      const response = await client.get(`/admin/hospitals?page=${page}&limit=${limit}`);
      return {
        hospitals: response.data.data.map((h: Hospital) => ({
          ...h,
          cardPrice: Number(h.cardPrice),
        })),
        pagination: response.data.pagination,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch hospitals');
    }
  }
);

export const createHospital = createAsyncThunk(
  'hospitals/create',
  async (payload: FormData | Record<string, unknown>, { rejectWithValue }) => {
    try {
      const isFormData = payload instanceof FormData;
      const response = await client.post('/admin/hospitals', payload, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
      });
      const h = response.data.data;
      return { ...h, cardPrice: Number(h.cardPrice) };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create hospital');
    }
  }
);

export const updateHospital = createAsyncThunk(
  'hospitals/update',
  async ({ id, payload }: { id: number; payload: FormData | Record<string, unknown> }, { rejectWithValue }) => {
    try {
      const isFormData = payload instanceof FormData;
      const response = await client.put(`/admin/hospitals/${id}`, payload, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
      });
      const h = response.data.data;
      return { ...h, cardPrice: Number(h.cardPrice) };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update hospital');
    }
  }
);

export const deleteHospital = createAsyncThunk(
  'hospitals/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await client.delete(`/admin/hospitals/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete hospital');
    }
  }
);

export const fetchReceptionists = createAsyncThunk(
  'hospitals/fetchReceptionists',
  async (_, { rejectWithValue }) => {
    try {
      const response = await client.get('/admin/receptionists');
      return response.data.data.map((r: ReceptionistProfile) => ({
        ...r,
        hospital: {
          ...r.hospital,
          cardPrice: Number(r.hospital.cardPrice),
        },
      }));
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch receptionists');
    }
  }
);

export const updateReceptionist = createAsyncThunk(
  'hospitals/updateReceptionist',
  async ({ id, payload }: { id: number; payload: { username?: string; password?: string; hospitalId?: number; phone?: string; email?: string } }, { rejectWithValue }) => {
    try {
      const response = await client.put(`/admin/receptionists/${id}`, payload);
      const r = response.data.data;
      return {
        ...r,
        hospital: { ...r.hospital, cardPrice: Number(r.hospital.cardPrice) },
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update receptionist');
    }
  }
);

export const deleteReceptionist = createAsyncThunk(
  'hospitals/deleteReceptionist',
  async (id: number, { rejectWithValue }) => {
    try {
      await client.delete(`/admin/receptionists/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete receptionist');
    }
  }
);

export const setServiceFee = createAsyncThunk(
  'hospitals/setServiceFee',
  async ({ hospitalId, amount }: { hospitalId: number; amount: number | null }, { rejectWithValue }) => {
    try {
      const response = await client.put(`/admin/hospitals/${hospitalId}/service-fee`, { amount });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to set service fee');
    }
  }
);

export const createReceptionist = createAsyncThunk(
  'hospitals/createReceptionist',
  async (payload: {
    username: string;
    password: string;
    hospitalId: number;
    phone?: string;
    email?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await client.post('/admin/receptionists', payload);
      const r = response.data.data;
      return {
        ...r,
        hospital: { ...r.hospital, cardPrice: Number(r.hospital.cardPrice) },
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create receptionist');
    }
  }
);

const adminHospitalSlice = createSlice({
  name: 'adminHospitals',
  initialState,
  reducers: {
    clearHospitalSuccess: (state) => {
      state.success = false;
    },
    clearHospitalError: (state) => {
      state.error = null;
    },
    clearHospitalLoading: (state) => {
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    const pending = (state: HospitalState) => {
      state.loading = true;
      state.error = null;
    };
    const rejected = (state: HospitalState, action: any) => {
      state.loading = false;
      state.error = action.payload || 'Operation failed';
    };

    builder
      .addCase(fetchHospitals.pending, pending)
      .addCase(fetchHospitals.fulfilled, (state, action) => {
        state.loading = false;
        state.hospitals = action.payload.hospitals;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchHospitals.rejected, rejected)
      .addCase(createHospital.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(createHospital.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.hospitals.push(action.payload);
      })
      .addCase(createHospital.rejected, rejected)
      .addCase(updateHospital.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const idx = state.hospitals.findIndex((h) => h.id === action.payload.id);
        if (idx !== -1) state.hospitals[idx] = action.payload;
      })
      .addCase(deleteHospital.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteHospital.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.hospitals = state.hospitals.filter((h) => h.id !== action.payload);
      })
      .addCase(deleteHospital.rejected, rejected)
      .addCase(fetchReceptionists.pending, pending)
      .addCase(fetchReceptionists.fulfilled, (state, action) => {
        state.loading = false;
        state.receptionists = action.payload;
      })
      .addCase(fetchReceptionists.rejected, rejected)
      .addCase(createReceptionist.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createReceptionist.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.receptionists.unshift(action.payload);
      })
      .addCase(createReceptionist.rejected, rejected)
      .addCase(updateReceptionist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateReceptionist.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const idx = state.receptionists.findIndex((r) => r.id === action.payload.id);
        if (idx !== -1) state.receptionists[idx] = action.payload;
      })
      .addCase(updateReceptionist.rejected, rejected)
      .addCase(deleteReceptionist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteReceptionist.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.receptionists = state.receptionists.filter((r) => r.id !== action.payload);
      })
      .addCase(deleteReceptionist.rejected, rejected)
      .addCase(setServiceFee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(setServiceFee.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const idx = state.hospitals.findIndex((h) => h.id === action.payload.hospitalId);
        if (idx !== -1) {
          state.hospitals[idx].serviceFee = action.payload.amount;
        }
      })
      .addCase(setServiceFee.rejected, rejected);
  },
});

export const { clearHospitalSuccess, clearHospitalError, clearHospitalLoading } = adminHospitalSlice.actions;
export type { Pagination as AdminPagination };
export default adminHospitalSlice.reducer;