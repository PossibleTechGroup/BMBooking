import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

import { API_URL } from '../../config/env';

interface EquipmentState {
  items: any[];
  announcements: any[];
  bookings: any[];
  bookingsLoading: boolean;
  loading: boolean;
  success: boolean;
  error: string | null;
}

const initialState: EquipmentState = {
  items: [],
  announcements: [],
  bookings: [],
  bookingsLoading: false,
  loading: false,
  success: false,
  error: null,
};

const getAuthHeader = () => {
  const token = localStorage.getItem('admin_token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const fetchAdminHospitals = createAsyncThunk(
  'adminEquipment/fetchItems',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/equipment/search`, getAuthHeader());
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch items');
    }
  }
);

export const addItem = createAsyncThunk(
  'adminEquipment/addItem',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/admin/equipment`, formData, {
        headers: {
          ...getAuthHeader().headers,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to post item');
    }
  }
);

export const updateItem = createAsyncThunk(
  'adminEquipment/updateItem',
  async ({ id, formData }: { id: number; formData: FormData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/admin/equipment/${id}`, formData, {
        headers: {
          ...getAuthHeader().headers,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update item');
    }
  }
);

export const deleteItem = createAsyncThunk(
  'adminEquipment/deleteItem',
  async (id: number, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/admin/equipment/${id}`, getAuthHeader());
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete item');
    }
  }
);

export const fetchEquipmentBookings = createAsyncThunk(
  'adminEquipment/fetchBookings',
  async (params: { status?: string; hospitalId?: number; date?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/admin/equipment-bookings`, {
        ...getAuthHeader(),
        params,
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bookings');
    }
  }
);

export const postAnnouncement = createAsyncThunk(
  'adminEquipment/postAnnouncement',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/admin/equipment/announce`, data, getAuthHeader());
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to post announcement');
    }
  }
);

const adminEquipmentSlice = createSlice({
  name: 'adminEquipment',
  initialState,
  reducers: {
    clearSuccess: (state) => {
      state.success = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminHospitals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminHospitals.fulfilled, (state, action) => {
        state.loading = false;
        state.items = (action.payload || []).map((item: any) => ({
          ...item,
          hospitalId: item.hospital?.id,
          hospitalName: item.hospital?.name || '',
          hospitalPhone: item.hospital?.phone || '',
          address: item.hospital?.address || '',
          city: (item.hospital?.address || '').split(',')[0]?.trim() || '',
          latitude: item.hospital?.latitude ?? 0,
          longitude: item.hospital?.longitude ?? 0,
          cardPrice: item.hospital?.cardPrice != null ? Number(item.hospital.cardPrice) : null,
        }));
      })
      .addCase(addItem.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(addItem.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const item = action.payload;
        state.items.unshift({
          ...item,
          hospitalId: item.hospital?.id,
          hospitalName: item.hospital?.name || '',
          hospitalPhone: item.hospital?.phone || '',
          address: item.hospital?.address || '',
          city: (item.hospital?.address || '').split(',')[0]?.trim() || '',
          latitude: item.hospital?.latitude ?? 0,
          longitude: item.hospital?.longitude ?? 0,
          cardPrice: item.hospital?.cardPrice != null ? Number(item.hospital.cardPrice) : null,
        });
      })
      .addCase(updateItem.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(updateItem.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(postAnnouncement.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(postAnnouncement.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.announcements.unshift(action.payload);
      })
      .addCase(deleteItem.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload);
      })
      .addCase(fetchEquipmentBookings.pending, (state) => {
        state.bookingsLoading = true;
        state.error = null;
      })
      .addCase(fetchEquipmentBookings.fulfilled, (state, action) => {
        state.bookingsLoading = false;
        state.bookings = action.payload;
      })
      .addCase(fetchEquipmentBookings.rejected, (state, action) => {
        state.bookingsLoading = false;
        state.error = (action.payload as string) || 'Failed to fetch bookings';
      })
      .addMatcher(
        (action) => action.type.endsWith('/rejected'),
        (state, action: any) => {
          state.loading = false;
          state.success = false;
          state.error = action.payload || 'Operation failed';
        }
      );
  },
});

export const { clearSuccess } = adminEquipmentSlice.actions;
export default adminEquipmentSlice.reducer;
