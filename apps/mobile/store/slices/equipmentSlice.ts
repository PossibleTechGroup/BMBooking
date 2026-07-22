import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { BASE_URL } from '../../constants/api';
import { RootState } from '../index';
import { logout } from './authSlice';

export interface MedicalEquipment {
  id: number;
  name: string;
  category: string;
  hospitalName: string;
  hospitalPhone: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  cardPrice?: number | null;
  price?: number | null;
  duration: number;
  isOperational: boolean;
  description: string;
  photo: string | null;
}

interface EquipmentAnnouncement {
  id: number;
  title: string;
  message: string;
  category: string;
  hospitalName: string | null;
  createdAt: string;
}

export interface AvailableSlot {
  start: string;
  end: string;
  booked?: boolean;
}

export interface EquipmentAvailability {
  date: string;
  operatingHours: { open: string; close: string } | null;
  slots: AvailableSlot[];
}

export interface EquipmentBooking {
  id: number;
  equipmentId: number;
  patientId: number;
  dateTime: string;
  status: string;
  fee: number | null;
  notes: string | null;
  createdAt: string;
  equipment?: MedicalEquipment;
  hospitalName?: string;
}

interface EquipmentState {
  searchResults: MedicalEquipment[];
  hospitals: any[];
  announcements: EquipmentAnnouncement[];
  categories: { category: string; _count: { id: number } }[];
  selectedItem: MedicalEquipment | null;
  myBookings: EquipmentBooking[];
  availability: EquipmentAvailability | null;
  availabilityLoading: boolean;
  loading: boolean;
  bookingLoading: boolean;
  error: string | null;
}

const initialState: EquipmentState = {
  searchResults: [],
  hospitals: [],
  announcements: [],
  categories: [],
  selectedItem: null,
  myBookings: [],
  availability: null,
  availabilityLoading: false,
  loading: false,
  bookingLoading: false,
  error: null,
};

const getAuthHeader = (state: RootState) => {
  const token = state.auth.token;
  return { headers: { Authorization: `Bearer ${token}` } };
};

const parseCity = (address: string): string => {
  if (!address) return '';
  return address.split(',')[0].trim();
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
  city: parseCity(item.hospital?.address || ''),
  latitude: item.hospital?.latitude || 0,
  longitude: item.hospital?.longitude || 0,
  cardPrice: item.hospital?.cardPrice != null ? Number(item.hospital.cardPrice) : null,
  price: item.price != null ? Number(item.price) : null,
  duration: item.duration || 30,
});

export const searchEquipment = createAsyncThunk(
  'equipment/search',
  async (params: { category?: string; city?: string; query?: string; isOperational?: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const query = new URLSearchParams(params as any).toString();
      const response = await axios.get(`${BASE_URL}/api/equipment/search?${query}`, getAuthHeader(state));
      return response.data.data.map(flattenEquipment);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search equipment');
    }
  }
);

export const fetchItemDetail = createAsyncThunk(
  'equipment/fetchDetail',
  async (id: number, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const response = await axios.get(`${BASE_URL}/api/equipment/detail/${id}`, getAuthHeader(state));
      return flattenEquipment(response.data.data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch detail');
    }
  }
);

export const fetchEquipmentCategories = createAsyncThunk(
  'equipment/fetchCategories',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const response = await axios.get(`${BASE_URL}/api/equipment/categories`, getAuthHeader(state));
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

export const fetchEquipmentAnnouncements = createAsyncThunk(
  'equipment/fetchAnnouncements',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const response = await axios.get(`${BASE_URL}/api/equipment/announcements`, getAuthHeader(state));
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch announcements');
    }
  }
);

const flattenBookingEquipment = (item: any): MedicalEquipment => ({
  id: item.id,
  name: item.name,
  category: item.category,
  isOperational: item.isOperational ?? true,
  description: item.description || '',
  photo: item.photo || null,
  hospitalName: item.hospital?.name || '',
  hospitalPhone: item.hospital?.phone || '',
  address: item.hospital?.address || '',
  city: parseCity(item.hospital?.address || ''),
  latitude: item.hospital?.latitude || 0,
  longitude: item.hospital?.longitude || 0,
  cardPrice: item.hospital?.cardPrice != null ? Number(item.hospital.cardPrice) : null,
  price: item.price != null ? Number(item.price) : null,
  duration: item.duration || 30,
});

const flattenBooking = (b: any): EquipmentBooking => ({
  id: b.id,
  equipmentId: b.equipmentId,
  patientId: b.patientId,
  dateTime: b.dateTime,
  status: b.status,
  fee: b.fee != null ? Number(b.fee) : null,
  notes: b.notes,
  createdAt: b.createdAt,
  equipment: b.equipment ? flattenBookingEquipment(b.equipment) : undefined,
  hospitalName: b.hospital?.name || '',
});

export const bookEquipment = createAsyncThunk(
  'equipment/book',
  async (data: { equipmentId: number; dateTime: string; notes?: string; fee?: number }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const response = await axios.post(`${BASE_URL}/api/equipment/book`, data, getAuthHeader(state));
      return flattenBooking(response.data.data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to book equipment');
    }
  }
);

export const fetchMyEquipmentBookings = createAsyncThunk(
  'equipment/fetchMyBookings',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const response = await axios.get(`${BASE_URL}/api/equipment/bookings`, getAuthHeader(state));
      return response.data.data.map(flattenBooking);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bookings');
    }
  }
);

export const cancelEquipmentBooking = createAsyncThunk(
  'equipment/cancelBooking',
  async (bookingId: number, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const response = await axios.patch(
        `${BASE_URL}/api/equipment/bookings/${bookingId}/cancel`,
        {},
        getAuthHeader(state),
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel booking');
    }
  }
);

export const rescheduleEquipmentBooking = createAsyncThunk(
  'equipment/rescheduleBooking',
  async ({ bookingId, dateTime }: { bookingId: number; dateTime: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const response = await axios.patch(
        `${BASE_URL}/api/equipment/bookings/${bookingId}/reschedule`,
        { dateTime },
        getAuthHeader(state),
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reschedule booking');
    }
  }
);

export const fetchEquipmentAvailability = createAsyncThunk(
  'equipment/fetchAvailability',
  async ({ equipmentId, date }: { equipmentId: number; date: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const response = await axios.get(`${BASE_URL}/api/equipment/${equipmentId}/availability?date=${date}`, getAuthHeader(state));
      return response.data.data as EquipmentAvailability;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch availability');
    }
  }
);

export const fetchHospitalDetail = createAsyncThunk(
  'equipment/fetchHospitalDetail',
  async (id: number, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const response = await axios.get(`${BASE_URL}/api/equipment/hospital/${id}`, getAuthHeader(state));
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch hospital detail');
    }
  }
);

const equipmentSlice = createSlice({
  name: 'equipment',
  initialState,
  reducers: {
    clearSelectedItem: (state) => {
      state.selectedItem = null;
    },
    clearAvailability: (state) => {
      state.availability = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchEquipment.pending, (state) => {
        state.loading = true;
      })
      .addCase(searchEquipment.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchEquipment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchItemDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchItemDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedItem = action.payload;
      })
      .addCase(fetchItemDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchEquipmentCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })
      .addCase(fetchEquipmentAnnouncements.fulfilled, (state, action) => {
        state.announcements = action.payload;
      })
      .addCase(bookEquipment.pending, (state) => {
        state.bookingLoading = true;
        state.error = null;
      })
      .addCase(bookEquipment.fulfilled, (state, action) => {
        state.bookingLoading = false;
        state.myBookings.unshift(action.payload);
      })
      .addCase(bookEquipment.rejected, (state, action) => {
        state.bookingLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchEquipmentAvailability.pending, (state) => {
        state.availabilityLoading = true;
        state.availability = null;
      })
      .addCase(fetchEquipmentAvailability.fulfilled, (state, action) => {
        state.availabilityLoading = false;
        state.availability = action.payload;
      })
      .addCase(fetchEquipmentAvailability.rejected, (state) => {
        state.availabilityLoading = false;
      })
      .addCase(fetchMyEquipmentBookings.fulfilled, (state, action) => {
        state.myBookings = action.payload;
      })
      .addCase(cancelEquipmentBooking.fulfilled, (state, action) => {
        const index = state.myBookings.findIndex(b => b.id === action.payload.id);
        if (index !== -1) state.myBookings[index].status = 'cancelled';
      })
      .addCase(rescheduleEquipmentBooking.fulfilled, (state, action) => {
        const index = state.myBookings.findIndex(b => b.id === action.payload.id);
        if (index !== -1) state.myBookings[index] = action.payload;
      })
      .addCase(fetchHospitalDetail.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchHospitalDetail.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.hospitals.findIndex(h => h.id === action.payload.id);
        if (index !== -1) {
          state.hospitals[index] = action.payload;
        } else {
          state.hospitals.push(action.payload);
        }
      })
      .addCase(fetchHospitalDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(logout, () => initialState);
  },
});

export const { clearSelectedItem, clearAvailability } = equipmentSlice.actions;
export default equipmentSlice.reducer;
