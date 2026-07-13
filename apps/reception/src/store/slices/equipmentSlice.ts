import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import client from '../../api/client';


export interface PatientProfile {
  fullName: string;
  gender: string;
  bloodType: string | null;
  dateOfBirth: string | null;
}

export interface PatientInfo {
  id: number;
  phone: string;
  patientProfile: PatientProfile | null;
}

export interface EquipmentInfo {
  id: number;
  name: string;
  category: string;
  isOperational: boolean;
}

export interface EquipmentBooking {
  id: number;
  patientId: number;
  equipmentId: number;
  dateTime: string;
  status: 'pending' | 'confirmed' | 'declined' | 'completed' | 'cancelled';
  fee: number | null;
  notes: string | null;
  declineReason: string | null;
  reviewedByReceptionistId: number | null;
  reviewedAt: string | null;
  createdAt: string;
  patient: PatientInfo;
  equipment: EquipmentInfo;
}

export interface DaySchedule {
  start: string;
  end: string;
  enabled: boolean;
  duration?: number;
}

export interface OperatingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface HospitalEquipment {
  id: number;
  name: string;
  category: string;
  isOperational: boolean;
  duration: number;
  price: number | null;
  operatingHours: OperatingHours | null;
}

export interface AvailableSlot {
  start: string;
  end: string;
  label: string;
  booked?: boolean;
}

interface EquipmentState {
  bookings: EquipmentBooking[];
  hospitalEquipment: HospitalEquipment[];
  loadingBookings: boolean;
  loadingEquipment: boolean;
  saving: boolean;
  error: string;
  patientSearchResults: PatientInfo[];
  patientSearchLoading: boolean;
  availableSlots: AvailableSlot[];
  loadingSlots: boolean;
  slotError: string;
  verifyingTelebirr: boolean;
}

const initialState: EquipmentState = {
  bookings: [],
  hospitalEquipment: [],
  loadingBookings: false,
  loadingEquipment: false,
  saving: false,
  error: '',
  patientSearchResults: [],
  patientSearchLoading: false,
  availableSlots: [],
  loadingSlots: false,
  slotError: '',
  verifyingTelebirr: false,
};

export const fetchEquipmentBookings = createAsyncThunk(
  'equipment/fetchBookings',
  async (date: string, { rejectWithValue }) => {
    try {
      const res = await client.get('/receptionist/equipment-bookings', { params: { date } });
      return res.data.data || [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load bookings');
    }
  }
);

export const fetchHospitalEquipment = createAsyncThunk(
  'equipment/fetchHospitalEquipment',
  async (_, { rejectWithValue }) => {
    try {
      const res = await client.get('/receptionist/equipment');
      return res.data.data || [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load equipment');
    }
  }
);

export const confirmBooking = createAsyncThunk(
  'equipment/confirmBooking',
  async (id: number, { rejectWithValue }) => {
    try {
      await client.patch(`/receptionist/equipment-bookings/${id}/confirm`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to confirm booking');
    }
  }
);

export const declineBooking = createAsyncThunk(
  'equipment/declineBooking',
  async ({ id, reason }: { id: number; reason: string }, { rejectWithValue }) => {
    try {
      await client.patch(`/receptionist/equipment-bookings/${id}/decline`, { reason });
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to decline booking');
    }
  }
);

export const completeBooking = createAsyncThunk(
  'equipment/completeBooking',
  async (id: number, { rejectWithValue }) => {
    try {
      await client.patch(`/receptionist/equipment-bookings/${id}/complete`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to complete booking');
    }
  }
);

export const cancelBooking = createAsyncThunk(
  'equipment/cancelBooking',
  async (id: number, { rejectWithValue }) => {
    try {
      await client.patch(`/receptionist/equipment-bookings/${id}/cancel`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to cancel booking');
    }
  }
);

export const rescheduleBooking = createAsyncThunk(
  'equipment/rescheduleBooking',
  async ({ id, dateTime }: { id: number; dateTime: string }, { rejectWithValue }) => {
    try {
      await client.patch(`/receptionist/equipment-bookings/${id}/reschedule`, { dateTime });
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to reschedule booking');
    }
  }
);

export const updateBookingNotes = createAsyncThunk(
  'equipment/updateBookingNotes',
  async ({ id, notes }: { id: number; notes: string }, { rejectWithValue }) => {
    try {
      await client.patch(`/receptionist/equipment-bookings/${id}/notes`, { notes });
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update notes');
    }
  }
);

export const toggleEquipmentStatus = createAsyncThunk(
  'equipment/toggleStatus',
  async ({ id, isOperational }: { id: number; isOperational: boolean }, { rejectWithValue }) => {
    try {
      await client.patch(`/receptionist/equipment/${id}/status`, { isOperational });
      return { id, isOperational };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to toggle status');
    }
  }
);

export const addEquipment = createAsyncThunk(
  'equipment/add',
  async (fd: FormData, { rejectWithValue }) => {
    try {
      await client.post('/receptionist/equipment', fd);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add equipment');
    }
  }
);

export const deleteEquipment = createAsyncThunk(
  'equipment/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await client.delete(`/receptionist/equipment/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete equipment');
    }
  }
);

export const updateEquipment = createAsyncThunk(
  'equipment/update',
  async ({ id, price, duration, operatingHours }: {
    id: number;
    price?: number | null;
    duration?: number;
    operatingHours?: OperatingHours;
  }, { rejectWithValue }) => {
    try {
      const body: any = {};
      if (price !== undefined) body.price = price;
      if (duration !== undefined) body.duration = duration;
      if (operatingHours) body.operatingHours = operatingHours;
      const res = await client.patch(`/receptionist/equipment/${id}`, body);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update equipment');
    }
  }
);

export const updateOperatingHours = createAsyncThunk(
  'equipment/updateHours',
  async ({ id, operatingHours, duration }: { id: number; operatingHours?: any; duration?: number }, { rejectWithValue }) => {
    try {
      const body: any = {};
      if (operatingHours) body.operatingHours = operatingHours;
      if (duration !== undefined) body.duration = duration;
      const res = await client.patch(`/receptionist/equipment/${id}/operating-hours`, body);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update operating hours');
    }
  }
);

export const createPatient = createAsyncThunk(
  'equipment/createPatient',
  async (payload: { phone: string; fullName: string; gender?: string; dateOfBirth?: string }, { rejectWithValue }) => {
    try {
      const res = await client.post('/receptionist/patients', payload);
      return res.data.data as PatientInfo;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create patient');
    }
  }
);

export const searchPatients = createAsyncThunk(
  'equipment/searchPatients',
  async (query: string, { rejectWithValue }) => {
    try {
      const res = await client.get('/receptionist/patients', { params: { search: query } });
      return res.data.data || [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to search patients');
    }
  }
);

export const createEquipmentBooking = createAsyncThunk(
  'equipment/createBooking',
  async (payload: { patientId: number; equipmentId: number; dateTime: string; fee?: number; notes?: string }, { rejectWithValue }) => {
    try {
      const res = await client.post('/receptionist/equipment-bookings', payload);
      const date = payload.dateTime.slice(0, 10);
      const listRes = await client.get('/receptionist/equipment-bookings', { params: { date } });
      return listRes.data.data || [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create equipment booking');
    }
  }
);

export const fetchEquipmentAvailability = createAsyncThunk(
  'equipment/fetchAvailability',
  async ({ equipmentId, date }: { equipmentId: number; date: string }, { rejectWithValue }) => {
    try {
      const res = await client.get(`/equipment/${equipmentId}/availability`, { params: { date } });
      return res.data.data?.slots || [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load availability');
    }
  }
);

export const verifyTelebirrPayment = createAsyncThunk(
  'equipment/verifyTelebirr',
  async (amount: number, { rejectWithValue }) => {
    try {
      const res = await client.post('/payments/verify-telebirr', { amount });
      const json = res.data;
      if (json.status !== 'success' || !json.data?.paid) {
        return rejectWithValue('Telebirr payment not yet received. Please complete payment first.');
      }
      return true;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to verify Telebirr payment. Try again.');
    }
  }
);

const equipmentSlice = createSlice({
  name: 'equipment',
  initialState,
  reducers: {
    clearEquipmentError: (state) => { state.error = ''; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEquipmentBookings.pending, (state) => {
        state.loadingBookings = true;
        state.error = '';
      })
      .addCase(fetchEquipmentBookings.fulfilled, (state, action) => {
        state.loadingBookings = false;
        state.bookings = action.payload;
      })
      .addCase(fetchEquipmentBookings.rejected, (state, action) => {
        state.loadingBookings = false;
        state.error = (action.payload as string) || 'Failed to load bookings';
      })
      .addCase(fetchHospitalEquipment.pending, (state) => {
        state.loadingEquipment = true;
      })
      .addCase(fetchHospitalEquipment.fulfilled, (state, action) => {
        state.loadingEquipment = false;
        state.hospitalEquipment = action.payload;
      })
      .addCase(fetchHospitalEquipment.rejected, (state) => {
        state.loadingEquipment = false;
      })
      .addCase(toggleEquipmentStatus.fulfilled, (state, action) => {
        const eq = state.hospitalEquipment.find(e => e.id === action.payload.id);
        if (eq) eq.isOperational = action.payload.isOperational;
      })
      .addCase(searchPatients.pending, (state) => {
        state.patientSearchLoading = true;
      })
      .addCase(searchPatients.fulfilled, (state, action) => {
        state.patientSearchLoading = false;
        state.patientSearchResults = action.payload;
      })
      .addCase(searchPatients.rejected, (state) => {
        state.patientSearchLoading = false;
        state.patientSearchResults = [];
      })
      .addCase(createPatient.fulfilled, (state, action) => {
        const exists = state.patientSearchResults.find(p => p.id === action.payload.id);
        if (!exists) state.patientSearchResults.unshift(action.payload);
      })
      .addCase(createEquipmentBooking.fulfilled, (state, action) => {
        if (action.payload) {
          state.bookings = action.payload;
        }
      })
      .addCase(fetchEquipmentAvailability.pending, (state) => {
        state.loadingSlots = true;
        state.slotError = '';
      })
      .addCase(fetchEquipmentAvailability.fulfilled, (state, action) => {
        state.loadingSlots = false;
        state.availableSlots = action.payload;
      })
      .addCase(fetchEquipmentAvailability.rejected, (state, action) => {
        state.loadingSlots = false;
        state.slotError = (action.payload as string) || 'Failed to load slots';
      })
      .addCase(verifyTelebirrPayment.pending, (state) => {
        state.verifyingTelebirr = true;
      })
      .addCase(verifyTelebirrPayment.fulfilled, (state) => {
        state.verifyingTelebirr = false;
      })
      .addCase(verifyTelebirrPayment.rejected, (state) => {
        state.verifyingTelebirr = false;
      })
      .addCase(updateEquipment.fulfilled, (state, action) => {
        const idx = state.hospitalEquipment.findIndex(e => e.id === action.payload.id);
        if (idx !== -1) state.hospitalEquipment[idx] = action.payload;
      })
      .addCase(updateOperatingHours.fulfilled, (state, action) => {
        const eq = state.hospitalEquipment.find(e => e.id === action.payload.id);
        if (eq) {
          if (action.payload.operatingHours) eq.operatingHours = action.payload.operatingHours;
          if (action.payload.duration !== undefined) eq.duration = action.payload.duration;
        }
      })
      .addMatcher(
        (action) => action.type.endsWith('/pending') && action.type.startsWith('equipment/') && !action.type.includes('fetch'),
        (state) => { state.saving = true; state.error = ''; }
      )
      .addMatcher(
        (action) => action.type.endsWith('/fulfilled') && action.type.startsWith('equipment/') && !action.type.includes('fetch'),
        (state) => { state.saving = false; }
      )
      .addMatcher(
        (action) => action.type.endsWith('/rejected') && action.type.startsWith('equipment/') && !action.type.includes('fetch'),
        (state, action: any) => { 
          state.saving = false;
          state.error = action.payload || 'Operation failed';
        }
      );
  },
});

export const { clearEquipmentError } = equipmentSlice.actions;
export default equipmentSlice.reducer;
