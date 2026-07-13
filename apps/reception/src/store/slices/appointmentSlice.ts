import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import client from '../../api/client';

export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  dateTime: string;
  status: string;
  fee: number;
  isPaid: boolean;
  paymentMethod?: string;
  reason: string | null;
  issueCategory: string | null;
  notes: string | null;
  declineReason: string | null;
  reviewedByReceptionistId: number | null;
  duration: number;
  parentAppointmentId?: number;
  confirmationCode?: string;
  attachments?: string[];
  patient: {
    id: number;
    phone: string;
    patientProfile: { fullName: string; gender: string; bloodType: string | null; dateOfBirth: string | null } | null;
  };
  doctor: { id: number; fullName: string; specialization: string };
  slot?: { id: number; startTime: string } | null;
}

interface AppointmentState {
  appointments: Appointment[];
  upcomingAppointments: Appointment[];
  loading: boolean;
  upcomingLoading: boolean;
  actionLoadingId: number | null;
  error: string;
}

const initialState: AppointmentState = {
  appointments: [],
  upcomingAppointments: [],
  loading: false,
  upcomingLoading: false,
  actionLoadingId: null,
  error: '',
};

export const fetchAppointments = createAsyncThunk(
  'appointments/fetchAll',
  async (params: { date?: string; from?: string; to?: string; confirmationCode?: string } = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      if (params.date) query.set('date', params.date);
      if (params.from) query.set('from', params.from);
      if (params.to) query.set('to', params.to);
      if (params.confirmationCode) query.set('confirmationCode', params.confirmationCode);
      const res = await client.get(`/receptionist/appointments?${query.toString()}`);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load appointments');
    }
  }
);

export const fetchUpcomingAppointments = createAsyncThunk(
  'appointments/fetchUpcoming',
  async (params: { from?: string; to?: string; doctorId?: number; status?: string } = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      if (params.from) query.set('from', params.from);
      if (params.to) query.set('to', params.to);
      if (params.doctorId) query.set('doctorId', String(params.doctorId));
      if (params.status) query.set('status', params.status);
      const res = await client.get(`/receptionist/appointments/upcoming?${query.toString()}`);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load upcoming appointments');
    }
  }
);

export const approveAppointment = createAsyncThunk(
  'appointments/approve',
  async (id: number, { rejectWithValue }) => {
    try {
      await client.patch(`/receptionist/appointments/${id}/approve`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to approve appointment');
    }
  }
);

export const denyAppointment = createAsyncThunk(
  'appointments/deny',
  async ({ id, reason }: { id: number; reason: string }, { rejectWithValue }) => {
    try {
      await client.patch(`/receptionist/appointments/${id}/deny`, { reason });
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to deny appointment');
    }
  }
);

export const cancelAppointment = createAsyncThunk(
  'appointments/cancel',
  async (id: number, { rejectWithValue }) => {
    try {
      await client.patch(`/receptionist/appointments/${id}/cancel`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to cancel appointment');
    }
  }
);

export const rescheduleAppointment = createAsyncThunk(
  'appointments/reschedule',
  async ({ id, dateTime }: { id: number; dateTime: string }, { rejectWithValue }) => {
    try {
      await client.patch(`/receptionist/appointments/${id}/reschedule`, { dateTime });
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to reschedule appointment');
    }
  }
);

export const updateAppointmentNotes = createAsyncThunk(
  'appointments/updateNotes',
  async ({ id, data }: { id: number; data: Partial<{ notes: string; reason: string; issueCategory: string }> }, { rejectWithValue }) => {
    try {
      await client.patch(`/receptionist/appointments/${id}`, data);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update appointment');
    }
  }
);

export const createAppointment = createAsyncThunk(
  'appointments/create',
  async (payload: any, { rejectWithValue }) => {
    try {
      const res = await client.post('/appointments/receptionist', payload);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create appointment');
    }
  }
);

export const createFollowUpAppointment = createAsyncThunk(
  'appointments/createFollowUp',
  async ({ id, dateTime }: { id: number; dateTime: string }, { rejectWithValue }) => {
    try {
      const res = await client.post(`/receptionist/appointments/${id}/follow-up`, { dateTime });
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to schedule follow-up');
    }
  }
);

export const reorderAppointments = createAsyncThunk(
  'appointments/reorder',
  async ({ doctorId, date, orderedSlots }: { doctorId: number; date: string; orderedSlots: (number | null)[] }, { rejectWithValue }) => {
    try {
      await client.patch('/receptionist/appointments/reorder', { doctorId, date, orderedSlots });
      return true;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to reorder appointments');
    }
  }
);

export const searchPatients = createAsyncThunk(
  'appointments/searchPatients',
  async (query: string, { rejectWithValue }) => {
    try {
      const res = await client.get('/receptionist/patients', { params: { search: query } });
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to search patients');
    }
  }
);

export const verifyTelebirrPayment = createAsyncThunk(
  'appointments/verifyTelebirr',
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

export const registerPatient = createAsyncThunk(
  'appointments/registerPatient',
  async (payload: any, { rejectWithValue }) => {
    try {
      const res = await client.post('/receptionist/patients', payload);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to register patient');
    }
  }
);

const appointmentSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {
    clearAppointmentError: (state) => { state.error = ''; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppointments.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload;
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to load appointments';
      })
      .addCase(fetchUpcomingAppointments.pending, (state) => {
        state.upcomingLoading = true;
        state.error = '';
      })
      .addCase(fetchUpcomingAppointments.fulfilled, (state, action) => {
        state.upcomingLoading = false;
        state.upcomingAppointments = action.payload;
      })
      .addCase(fetchUpcomingAppointments.rejected, (state, action) => {
        state.upcomingLoading = false;
        state.error = (action.payload as string) || 'Failed to load upcoming appointments';
      })
      .addCase(approveAppointment.pending, (state) => {
        state.error = '';
      })
      .addCase(approveAppointment.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Failed to approve';
      })
      .addCase(denyAppointment.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Failed to deny';
      })
      .addCase(cancelAppointment.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Failed to cancel';
      })
      .addCase(rescheduleAppointment.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Failed to reschedule';
      })
      .addCase(updateAppointmentNotes.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Failed to update';
      })
      .addCase(createFollowUpAppointment.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Failed to schedule follow-up';
      })
      .addCase(reorderAppointments.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Failed to reorder appointments';
      });
  },
});

export const { clearAppointmentError } = appointmentSlice.actions;
export default appointmentSlice.reducer;
