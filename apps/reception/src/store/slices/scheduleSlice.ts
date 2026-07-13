import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import client from '../../api/client';

export interface ScheduleSlot {
  id: number;
  startTime: string;
  endTime: string;
  maxPatients: number;
  _count: { bookings: number };
}

export interface Schedule {
  id: number;
  doctorId: number;
  date: string;
  startTime: string;
  endTime: string;
  slotDuration: number;
  maxPatientsPerSlot: number;
  isActive: boolean;
  clinicRoom: string | null;
  notes: string | null;
  doctor: {
    id: number;
    fullName: string;
    specialization: string;
  };
  slots: ScheduleSlot[];
}

export interface DoctorOption {
  id: number;
  fullName: string;
  specialization: string;
  clinicName?: string | null;
  hospital?: { name: string } | null;
}

interface ScheduleState {
  doctors: DoctorOption[];
  doctorsSearchResults: DoctorOption[];
  schedules: Schedule[];
  loadingDoctors: boolean;
  loadingSchedules: boolean;
  saving: boolean;
  error: string;
}

const initialState: ScheduleState = {
  doctors: [],
  doctorsSearchResults: [],
  schedules: [],
  loadingDoctors: false,
  loadingSchedules: false,
  saving: false,
  error: '',
};

export const searchAllDoctors = createAsyncThunk(
  'schedules/searchDoctors',
  async (query: string, { rejectWithValue }) => {
    try {
      const res = await client.get('/receptionist/doctors/search', { params: { q: query, limit: 20 } });
      return res.data.data || [];
    } catch (err: unknown) {
      return rejectWithValue((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to search doctors');
    }
  }
);

export const registerDoctor = createAsyncThunk(
  'schedules/registerDoctor',
  async (data: { phone: string; fullName: string; specialization?: string; email?: string }, { rejectWithValue }) => {
    try {
      const res = await client.post('/receptionist/doctors/register', data);
      return res.data.data;
    } catch (err: unknown) {
      return rejectWithValue((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to register doctor');
    }
  }
);

export const fetchScheduleDoctors = createAsyncThunk(
  'schedules/fetchDoctors',
  async (_, { rejectWithValue }) => {
    try {
      const res = await client.get('/receptionist/doctors', { params: { limit: 100 } });
      return res.data.data || [];
    } catch (err: unknown) {
      return rejectWithValue((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load doctors');
    }
  }
);

export const fetchSchedules = createAsyncThunk(
  'schedules/fetchAll',
  async (params: Record<string, string>, { rejectWithValue }) => {
    try {
      const res = await client.get('/receptionist/schedules', { params });
      return res.data.data || [];
    } catch (err: unknown) {
      return rejectWithValue((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load schedules');
    }
  }
);

export const createSchedule = createAsyncThunk(
  'schedules/create',
  async (data: {
    doctorId: number | '';
    date: string;
    startTime: string;
    endTime: string;
    slotDuration: number;
    clinicRoom?: string;
    notes?: string;
    isActive: boolean;
    repeatWeeks?: number;
    daysOfWeek?: number[];
    repeatEndDate?: string;
  }, { rejectWithValue }) => {
    try {
      const payload: Record<string, unknown> = {
        doctorId: data.doctorId,
        date: data.date,
        startTime: new Date(`${data.date}T${data.startTime}`).toISOString(),
        endTime: new Date(`${data.date}T${data.endTime}`).toISOString(),
        slotDuration: data.slotDuration,
        clinicRoom: data.clinicRoom || undefined,
        notes: data.notes || undefined,
        isActive: data.isActive,
      };
      if (data.repeatWeeks && data.repeatWeeks > 1) {
        payload.repeatWeeks = data.repeatWeeks;
      }
      if (data.daysOfWeek && data.daysOfWeek.length > 0) {
        payload.daysOfWeek = data.daysOfWeek;
        payload.repeatEndDate = data.repeatEndDate;
      }
      const res = await client.post('/receptionist/schedules', payload);
      return res.data;
    } catch (err: unknown) {
      return rejectWithValue((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create schedule');
    }
  }
);

export const updateSchedule = createAsyncThunk(
  'schedules/update',
  async (data: { id: number; payload: Record<string, unknown> }, { rejectWithValue }) => {
    try {
      const res = await client.put(`/receptionist/schedules/${data.id}`, data.payload);
      return res.data;
    } catch (err: unknown) {
      return rejectWithValue((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update schedule');
    }
  }
);

export const deleteSchedule = createAsyncThunk(
  'schedules/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await client.delete(`/receptionist/schedules/${id}`);
      return id;
    } catch (err: unknown) {
      return rejectWithValue((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete schedule');
    }
  }
);

const scheduleSlice = createSlice({
  name: 'schedules',
  initialState,
  reducers: {
    clearScheduleError: (state) => { state.error = ''; },
    clearSearchResults: (state) => { state.doctorsSearchResults = []; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchScheduleDoctors.pending, (state) => {
        state.loadingDoctors = true;
      })
      .addCase(fetchScheduleDoctors.fulfilled, (state, action) => {
        state.loadingDoctors = false;
        state.doctors = action.payload;
      })
      .addCase(fetchScheduleDoctors.rejected, (state, action) => {
        state.loadingDoctors = false;
        state.error = (action.payload as string) || 'Failed to load doctors';
      })
      .addCase(searchAllDoctors.fulfilled, (state, action) => {
        state.doctorsSearchResults = action.payload;
      })
      .addCase(fetchSchedules.pending, (state) => {
        state.loadingSchedules = true;
        state.error = '';
      })
      .addCase(fetchSchedules.fulfilled, (state, action) => {
        state.loadingSchedules = false;
        state.schedules = action.payload;
      })
      .addCase(fetchSchedules.rejected, (state, action) => {
        state.loadingSchedules = false;
        state.error = (action.payload as string) || 'Failed to load schedules';
      })
      .addCase(createSchedule.pending, (state) => {
        state.saving = true;
        state.error = '';
      })
      .addCase(createSchedule.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(createSchedule.rejected, (state, action) => {
        state.saving = false;
        state.error = (action.payload as string) || 'Failed to create schedule';
      })
      .addCase(updateSchedule.pending, (state) => {
        state.saving = true;
        state.error = '';
      })
      .addCase(updateSchedule.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(updateSchedule.rejected, (state, action) => {
        state.saving = false;
        state.error = (action.payload as string) || 'Failed to update schedule';
      })
      .addCase(deleteSchedule.pending, (state) => {
        state.saving = true;
        state.error = '';
      })
      .addCase(deleteSchedule.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(deleteSchedule.rejected, (state, action) => {
        state.saving = false;
        state.error = (action.payload as string) || 'Failed to delete schedule';
      });
  },
});

export const { clearScheduleError } = scheduleSlice.actions;
export default scheduleSlice.reducer;
