import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/lib/api/client';
import { logout } from './authSlice';

export interface MedicalEquipment {
  id: number;
  name: string;
  category: string;
  hospitalName: string;
  hospitalPhone: string;
  address: string;
  latitude: number;
  longitude: number;
  duration: number;
  isOperational: boolean;
  description: string;
  photo: string | null;
}

interface EquipmentState {
  searchResults: MedicalEquipment[];
  categories: { category: string; _count: { id: number } }[];
  myBookings: any[];
  loading: boolean;
  error: string | null;
}

const initialState: EquipmentState = {
  searchResults: [],
  categories: [],
  myBookings: [],
  loading: false,
  error: null,
};

const flattenEquipment = (item: any): MedicalEquipment => ({
  id: item.id,
  name: item.name,
  category: item.category,
  isOperational: item.isOperational,
  description: item.description || '',
  photo: item.photo || null,
  hospitalName: item.hospital?.name || '',
  hospitalPhone: item.hospital?.phone || '',
  address: item.hospital?.address || '',
  latitude: item.hospital?.latitude || 0,
  longitude: item.hospital?.longitude || 0,
  duration: item.duration || 30,
});

export const searchEquipment = createAsyncThunk(
  'equipment/search',
  async (params: { category?: string; query?: string }, { getState, rejectWithValue }) => {
    const state = getState() as { auth: { token: string | null } };
    try {
      const query = new URLSearchParams(params as any).toString();
      const response = await api.get(`/equipment/search?${query}`, {
        headers: { Authorization: `Bearer ${state.auth.token}` },
      });
      return response.data.data.map(flattenEquipment);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search equipment');
    }
  }
);

export const fetchEquipmentCategories = createAsyncThunk(
  'equipment/fetchCategories',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { auth: { token: string | null } };
    try {
      const response = await api.get('/equipment/categories', {
        headers: { Authorization: `Bearer ${state.auth.token}` },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

export const fetchMyEquipmentBookings = createAsyncThunk(
  'equipment/fetchMyBookings',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { auth: { token: string | null } };
    try {
      const response = await api.get('/equipment/bookings', {
        headers: { Authorization: `Bearer ${state.auth.token}` },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bookings');
    }
  }
);

const equipmentSlice = createSlice({
  name: 'equipment',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(searchEquipment.pending, (state) => { state.loading = true; })
      .addCase(searchEquipment.fulfilled, (state, action) => { state.loading = false; state.searchResults = action.payload; })
      .addCase(searchEquipment.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchEquipmentCategories.fulfilled, (state, action) => { state.categories = action.payload; })
      .addCase(fetchMyEquipmentBookings.fulfilled, (state, action) => { state.myBookings = action.payload; })
      .addCase(logout, () => initialState);
  },
});

export default equipmentSlice.reducer;
