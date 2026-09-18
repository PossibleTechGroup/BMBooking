import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/lib/api/client';
import { logout } from './authSlice';

export interface HospitalProfile {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  image?: string | null;
  description?: string | null;
  cardPrice?: string;
  serviceFee?: { amount: string } | null;
  services?: { id: number; name: string; category: string | null }[];
  latitude?: number | null;
  longitude?: number | null;
}

export interface DoctorItem {
  id: number;
  fullName: string | null;
  specialization?: string | null;
  experienceYears?: number | null;
  profilePicture?: string | null;
  introVideo?: string | null;
  status: string;
  rejectionReason: string | null;
  user?: { id: number; phone: string | null };
  _count?: { appointments: number };
}

export interface ReceptionistItem {
  id: number;
  userId: number;
  fullName: string | null;
  permissions?: string[];
  user: {
    id: number;
    username: string | null;
    phone: string | null;
    email: string | null;
    createdAt?: string;
  };
  createdAt: string;
}

export interface HospitalListItem {
  id: number;
  name: string;
  address: string | null;
  image: string | null;
  phone: string | null;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  cardPrice?: string;
  serviceFee?: { amount: string } | null;
  doctorCount?: number;
  rating?: number | null;
}

export interface HospitalDetail {
  id: number;
  name: string;
  address: string | null;
  image: string | null;
  phone: string | null;
  email: string | null;
  latitude?: number | null;
  longitude?: number | null;
  cardPrice?: string;
  serviceFee?: { amount: string } | null;
  doctors: DoctorDetail[];
  services?: { name: string }[];
  description?: string | null;
}

export interface DoctorDetail {
  id: number;
  fullName: string | null;
  profilePicture: string | null;
  specialization: string | null;
  specializations: string[] | null;
  bio: string | null;
  experienceYears: number | null;
  rating: number | null;
  totalReviews: number;
  clinicName: string | null;
  clinicAddress: string | null;
  baseHourlyRate: string | null;
}

export interface HospitalAppointment {
  id: number;
  doctorId?: number | null;
  doctorName?: string | null;
  specialization?: string | null;
  patientId?: number | null;
  patientPhone?: string | null;
  patientName: string;
  patientGender?: string | null;
  patientBloodType?: string | null;
  patient?: {
    id: number;
    phone: string | null;
    patientProfile: { fullName: string | null; gender: string | null; bloodType: string | null } | null;
  } | null;
  doctor?: { id: number; fullName: string; specialization: string } | null;
  dateTime: string;
  status: string;
  fee?: string | number;
  isPaid?: boolean;
  paymentMethod?: string | null;
  reason?: string | null;
  issueCategory?: string | null;
  notes?: string | null;
  declineReason?: string | null;
  parentAppointmentId?: number | null;
  confirmationCode?: string | null;
  slotId?: number | null;
  slotStart?: string | null;
  slotEnd?: string | null;
  slotMaxPatients?: number | null;
  attachments?: string[];
  card?: HospitalCardInfo | null;
  createdAt: string;
}

export interface HospitalCardInfo {
  id: number;
  code: string;
  name: string | null;
  price: string | number;
  isPaid: boolean;
  issuedAt: string;
  activatedAt: string | null;
  expiresAt: string;
  isActive: boolean;
}

export interface HospitalOverview {
  todayAppointments: number;
  newBookings: number;
  newPatients: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  totalAppointments: number;
  doctors: number;
  revenue: number;
  availableSlots: number;
  fullSlots: number;
  totalSlots: number;
  activeCards: number;
  expiredCards: number;
}

export interface HospitalAnalytics {
  status: { pending: number; confirmed: number; completed: number; cancelled: number };
  payments: { paid: number; unpaid: number; revenue: number };
  byDay: { date: string; count: number }[];
  period: string;
  byDoctor: { doctorId: number; doctorName: string; bookings: number }[];
  byService: { service: string; count: number }[];
  cards: { total: number; issuedValue: number; active: number; expired: number };
}

export interface HospitalPatient {
  id: number;
  phone: string | null;
  fullName: string;
  gender: string | null;
  bloodType: string | null;
  dateOfBirth: string | null;
  emergencyContact: string | null;
  joinedAt: string;
  bookings: number;
  cards: number;
}

export interface CardTemplate {
  id: number;
  name: string;
  price?: string | number;
  validityDays?: number | null;
  isActive: boolean;
  createdAt: string;
}

interface HospitalState {
  profile: HospitalProfile | null;
  permissions: string[];
  hospitalRole: 'owner' | 'staff' | null;
  stats: {
    doctors: number;
    pendingDoctors: number;
    receptionists: number;
    appointments: number;
    pendingAppointments: number;
  } | null;
  doctors: DoctorItem[];
  receptionists: ReceptionistItem[];
  hospitals: HospitalListItem[];
  selectedHospital: HospitalDetail | null;
  appointments: HospitalAppointment[];
  upcomingAppointments: HospitalAppointment[];
  appointmentsTotal: number;
  patients: HospitalPatient[];
  overview: HospitalOverview | null;
  analytics: HospitalAnalytics | null;
  cardTemplates: CardTemplate[];
  services: { id: number; name: string; category: string | null }[];
  schedules: ScheduleItem[];
  equipment: EquipmentItem[];
  equipmentBookings: EquipmentBookingItem[];
  loading: boolean;
  error: string | null;
}

const initialState: HospitalState = {
  profile: null,
  permissions: [],
  hospitalRole: null,
  stats: null,
  doctors: [],
  receptionists: [],
  hospitals: [],
  selectedHospital: null,
  appointments: [],
  upcomingAppointments: [],
  appointmentsTotal: 0,
  patients: [],
  overview: null,
  analytics: null,
  cardTemplates: [],
  services: [],
  schedules: [],
  equipment: [],
  equipmentBookings: [],
  loading: false,
  error: null,
};

export const fetchHospitals = createAsyncThunk(
  'hospital/fetchHospitals',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`/hospitals?t=${Date.now()}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch hospitals');
    }
  }
);

export const fetchHospitalById = createAsyncThunk(
  'hospital/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/hospitals/${id}?t=${Date.now()}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch hospital');
    }
  }
);

export const fetchHospitalAppointments = createAsyncThunk(
  'hospital/fetchAppointments',
  async (
    filters: { status?: string; search?: string; doctorId?: number; from?: string; to?: string; date?: string; confirmationCode?: string; page?: number; limit?: number } = {},
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.search) params.set('search', filters.search);
      if (filters.doctorId) params.set('doctorId', String(filters.doctorId));
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);
      if (filters.date) params.set('date', filters.date);
      if (filters.confirmationCode) params.set('confirmationCode', filters.confirmationCode);
      if (filters.page) params.set('page', String(filters.page));
      if (filters.limit) params.set('limit', String(filters.limit));
      params.set('t', String(Date.now()));
      const qs = params.toString();
      const response = await api.get(`/hospital/appointments?${qs}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch appointments');
    }
  }
);

export const fetchHospitalUpcomingAppointments = createAsyncThunk(
  'hospital/fetchUpcomingAppointments',
  async (filters: { doctorId?: number; status?: string } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ t: String(Date.now()) });
      if (filters.doctorId) params.set('doctorId', String(filters.doctorId));
      if (filters.status) params.set('status', filters.status);
      const response = await api.get(`/hospital/appointments/upcoming?${params.toString()}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch upcoming appointments');
    }
  }
);

export const approveHospitalAppointment = createAsyncThunk(
  'hospital/approveAppointment',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/hospital/appointments/${id}/approve`, {});
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to approve');
    }
  }
);

export const denyHospitalAppointment = createAsyncThunk(
  'hospital/denyAppointment',
  async ({ id, reason }: { id: number; reason: string }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/hospital/appointments/${id}/deny`, { reason });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to deny');
    }
  }
);

export const cancelHospitalAppointment = createAsyncThunk(
  'hospital/cancelAppointment',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/hospital/appointments/${id}/cancel`, {});
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel');
    }
  }
);

export const rescheduleHospitalAppointment = createAsyncThunk(
  'hospital/rescheduleAppointment',
  async ({ id, dateTime }: { id: number; dateTime: string }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/hospital/appointments/${id}/reschedule`, { dateTime });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reschedule');
    }
  }
);

export const updateHospitalAppointmentNotes = createAsyncThunk(
  'hospital/updateAppointmentNotes',
  async ({ id, notes }: { id: number; notes: string }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/hospital/appointments/${id}`, { notes });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update notes');
    }
  }
);

export const createHospitalAppointmentFollowUp = createAsyncThunk(
  'hospital/createAppointmentFollowUp',
  async ({ id, dateTime, slotId }: { id: number; dateTime: string; slotId?: number }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/hospital/appointments/${id}/follow-up`, { dateTime, slotId });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to schedule follow-up');
    }
  }
);

export const reorderHospitalAppointments = createAsyncThunk(
  'hospital/reorderAppointments',
  async ({ doctorId, date, orderedSlots }: { doctorId: number; date: string; orderedSlots: (number | null)[] }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/hospital/appointments/reorder`, { doctorId, date, orderedSlots });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to apply order');
    }
  }
);

export const fetchHospitalScheduleForDoctor = createAsyncThunk(
  'hospital/fetchScheduleForDoctor',
  async ({ doctorId, date }: { doctorId: number; date: string }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/hospital/schedules?doctorId=${doctorId}&date=${date}&t=${Date.now()}`);
      return response.data.data || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch slots');
    }
  }
);

export const fetchHospitalOverview = createAsyncThunk(
  'hospital/fetchOverview',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`/hospital/overview?t=${Date.now()}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch overview');
    }
  }
);

export const fetchHospitalAnalytics = createAsyncThunk(
  'hospital/fetchAnalytics',
  async (period: string = 'month', { rejectWithValue }) => {
    try {
      const response = await api.get(`/hospital/analytics?period=${period}&t=${Date.now()}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch analytics');
    }
  }
);

export const fetchHospitalPatients = createAsyncThunk(
  'hospital/fetchPatients',
  async (search: string = '', { rejectWithValue }) => {
    try {
      const response = await api.get(`/hospital/patients?search=${encodeURIComponent(search)}&t=${Date.now()}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch patients');
    }
  }
);

export const fetchHospitalCardTemplates = createAsyncThunk(
  'hospital/fetchCardTemplates',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`/hospital/card-templates?t=${Date.now()}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch card templates');
    }
  }
);

export const createCardTemplate = createAsyncThunk(
  'hospital/createCardTemplate',
  async (data: { name: string; price: number; validityDays?: number | null }, { rejectWithValue }) => {
    try {
      const response = await api.post('/hospital/card-templates', data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create card template');
    }
  }
);

export const updateCardTemplate = createAsyncThunk(
  'hospital/updateCardTemplate',
  async ({ id, data }: { id: number; data: { name?: string; price?: number; validityDays?: number | null; isActive?: boolean } }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/hospital/card-templates/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update card template');
    }
  }
);

export const deleteCardTemplate = createAsyncThunk(
  'hospital/deleteCardTemplate',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/hospital/card-templates/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete card template');
    }
  }
);

export const registerHospital = createAsyncThunk(
  'hospital/register',
  async (data: { name: string; address?: string; phone?: string; email?: string; adminPhone: string; password: string; image?: string; services?: string[] }, { rejectWithValue }) => {
    try {
      const response = await api.post('/hospital/register', data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to register hospital');
    }
  }
);

export const fetchHospitalProfile = createAsyncThunk(
  'hospital/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/hospital/profile');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const fetchHospitalMe = createAsyncThunk(
  'hospital/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/hospital/me');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch session');
    }
  }
);

export const updateHospitalProfile = createAsyncThunk(
  'hospital/updateProfile',
  async (data: { name?: string; address?: string; phone?: string; email?: string; image?: string; description?: string }, { rejectWithValue }) => {
    try {
      const response = await api.patch('/hospital/profile', data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const fetchHospitalStats = createAsyncThunk(
  'hospital/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/hospital/stats');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch stats');
    }
  }
);

export const fetchHospitalDoctors = createAsyncThunk(
  'hospital/fetchDoctors',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/hospital/doctors?includeAll=true');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch doctors');
    }
  }
);

export const updateDoctorStatus = createAsyncThunk(
  'hospital/updateDoctorStatus',
  async ({ id, status, rejectionReason }: { id: number; status: 'Approved' | 'Rejected'; rejectionReason?: string }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/hospital/doctors/${id}/status`, { status, rejectionReason });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update doctor status');
    }
  }
);

export const registerHospitalDoctor = createAsyncThunk(
  'hospital/registerDoctor',
  async (data: FormData, { rejectWithValue }) => {
    try {
      const response = await api.post('/hospital/doctors/register', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to register doctor');
    }
  }
);

export const fetchHospitalReceptionists = createAsyncThunk(
  'hospital/fetchReceptionists',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/hospital/receptionists');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch receptionists');
    }
  }
);

export const createReceptionist = createAsyncThunk(
  'hospital/createReceptionist',
  async (data: { fullName?: string; username: string; phone?: string; email?: string; password: string; permissions?: string[] }, { rejectWithValue }) => {
    try {
      const response = await api.post('/hospital/staff', data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create receptionist');
    }
  }
);

export const updateReceptionist = createAsyncThunk(
  'hospital/updateReceptionist',
  async ({ id, data }: { id: number; data: { fullName?: string; username?: string; phone?: string; email?: string; password?: string; permissions?: string[] } }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/hospital/staff/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update receptionist');
    }
  }
);

export const deleteReceptionist = createAsyncThunk(
  'hospital/deleteReceptionist',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/hospital/staff/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete receptionist');
    }
  }
);

export const fetchHospitalServices = createAsyncThunk(
  'hospital/fetchServices',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/hospital/services');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch services');
    }
  }
);

export const addHospitalService = createAsyncThunk(
  'hospital/addService',
  async (data: { name: string; category?: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/hospital/services', data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add service');
    }
  }
);

export const setHospitalServices = createAsyncThunk(
  'hospital/setServices',
  async (services: string[], { rejectWithValue }) => {
    try {
      const response = await api.put('/hospital/services', { services });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update services');
    }
  }
);

export const removeHospitalService = createAsyncThunk(
  'hospital/removeService',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/hospital/services/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove service');
    }
  }
);

export const setHospitalLogo = createAsyncThunk(
  'hospital/setLogo',
  async (image: string, { rejectWithValue }) => {
    try {
      const response = await api.patch('/hospital/profile', { image });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update logo');
    }
  }
);

// ─── Schedules ─────────────────────────────────────────────────────
export interface ScheduleItem {
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
  doctor: { id: number; fullName: string; specialization: string | null };
  slots: { id: number; startTime: string; endTime: string; maxPatients: number; _count: { bookings: number } }[];
}

export const fetchHospitalSchedules = createAsyncThunk(
  'hospital/fetchSchedules',
  async (params: Record<string, string> = {}, { rejectWithValue }) => {
    try {
      const qs = new URLSearchParams({ ...params, t: String(Date.now()) }).toString();
      const response = await api.get(`/hospital/schedules?${qs}`);
      return response.data.data || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch schedules');
    }
  }
);

export const createHospitalSchedule = createAsyncThunk(
  'hospital/createSchedule',
  async (data: Record<string, unknown>, { rejectWithValue }) => {
    try {
      const response = await api.post('/hospital/schedules', data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create schedule');
    }
  }
);

export const updateHospitalSchedule = createAsyncThunk(
  'hospital/updateSchedule',
  async ({ id, payload }: { id: number; payload: Record<string, unknown> }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/hospital/schedules/${id}`, payload);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update schedule');
    }
  }
);

export const deleteHospitalSchedule = createAsyncThunk(
  'hospital/deleteSchedule',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/hospital/schedules/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete schedule');
    }
  }
);

// ─── Equipment ─────────────────────────────────────────────────────
export interface EquipmentItem {
  id: number;
  name: string;
  category: string | null;
  isOperational: boolean;
  duration: number;
  price: number | null;
  photo?: string | null;
  description?: string | null;
  operatingHours: any | null;
}

export interface EquipmentBookingItem {
  id: number;
  patientId: number;
  equipmentId: number;
  dateTime: string;
  status: string;
  fee: number | null;
  notes: string | null;
  createdAt: string;
  patient: { id: number; phone: string; patientProfile: { fullName: string | null; gender: string | null } | null };
  equipment: { id: number; name: string; category: string | null; isOperational: boolean };
}

export const fetchHospitalEquipment = createAsyncThunk(
  'hospital/fetchEquipment',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`/hospital/equipment?t=${Date.now()}`);
      return response.data.data || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch equipment');
    }
  }
);

export const addHospitalEquipment = createAsyncThunk(
  'hospital/addEquipment',
  async (fd: FormData, { rejectWithValue }) => {
    try {
      const response = await api.post('/hospital/equipment', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add equipment');
    }
  }
);

export const addHospitalEquipmentBulk = createAsyncThunk(
  'hospital/addEquipmentBulk',
  async (items: { name: string; category: string; price?: number; duration?: number; description?: string }[], { rejectWithValue }) => {
    try {
      const response = await api.post('/hospital/equipment/bulk', { items });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add equipment');
    }
  }
);

export const deleteHospitalEquipment = createAsyncThunk(
  'hospital/deleteEquipment',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/hospital/equipment/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete equipment');
    }
  }
);

export const toggleHospitalEquipmentStatus = createAsyncThunk(
  'hospital/toggleEquipmentStatus',
  async ({ id, isOperational }: { id: number; isOperational: boolean }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/hospital/equipment/${id}/status`, { isOperational });
      return { id, isOperational, data: response.data.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update equipment status');
    }
  }
);

export const updateHospitalEquipment = createAsyncThunk(
  'hospital/updateEquipment',
  async ({ id, price, duration, operatingHours, description, name, category }: {
    id: number;
    price?: number | null;
    duration?: number | null;
    operatingHours?: any;
    description?: string | null;
    name?: string;
    category?: string | null;
  }, { rejectWithValue }) => {
    try {
      const body: any = {};
      if (price !== undefined) body.price = price;
      if (duration !== undefined) body.duration = duration;
      if (operatingHours) body.operatingHours = operatingHours;
      if (description !== undefined) body.description = description;
      if (name !== undefined) body.name = name;
      if (category !== undefined) body.category = category;
      const response = await api.patch(`/hospital/equipment/${id}`, body);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update equipment');
    }
  }
);

export const fetchEquipmentBookings = createAsyncThunk(
  'hospital/fetchEquipmentBookings',
  async (params: Record<string, string> = {}, { rejectWithValue }) => {
    try {
      const qs = new URLSearchParams({ ...params, t: String(Date.now()) }).toString();
      const response = await api.get(`/hospital/equipment-bookings?${qs}`);
      return response.data.data || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch equipment bookings');
    }
  }
);

export const confirmEquipmentBooking = createAsyncThunk(
  'hospital/confirmEquipmentBooking',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.patch(`/hospital/equipment-bookings/${id}/confirm`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to confirm booking');
    }
  }
);

export const declineEquipmentBooking = createAsyncThunk(
  'hospital/declineEquipmentBooking',
  async ({ id, reason }: { id: number; reason: string }, { rejectWithValue }) => {
    try {
      await api.patch(`/hospital/equipment-bookings/${id}/decline`, { reason });
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to decline booking');
    }
  }
);

export const completeEquipmentBooking = createAsyncThunk(
  'hospital/completeEquipmentBooking',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.patch(`/hospital/equipment-bookings/${id}/complete`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to complete booking');
    }
  }
);

export const cancelEquipmentBooking = createAsyncThunk(
  'hospital/cancelEquipmentBooking',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.patch(`/hospital/equipment-bookings/${id}/cancel`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel booking');
    }
  }
);

const hospitalSlice = createSlice({
  name: 'hospital',
  initialState,
  reducers: {
    clearHospitalError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHospitals.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchHospitals.fulfilled, (state, action) => { state.loading = false; state.hospitals = action.payload; })
      .addCase(fetchHospitals.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchHospitalById.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchHospitalById.fulfilled, (state, action) => { state.loading = false; state.selectedHospital = action.payload; })
      .addCase(fetchHospitalById.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchHospitalAppointments.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchHospitalAppointments.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload as any;
        state.appointments = Array.isArray(payload) ? payload : (payload?.items ?? []);
        state.appointmentsTotal = (payload && !Array.isArray(payload)) ? (payload.total ?? state.appointments.length) : state.appointments.length;
      })
      .addCase(fetchHospitalAppointments.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchHospitalUpcomingAppointments.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchHospitalUpcomingAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.upcomingAppointments = Array.isArray(action.payload) ? action.payload : (action.payload as any)?.items ?? [];
      })
      .addCase(fetchHospitalUpcomingAppointments.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(approveHospitalAppointment.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(denyHospitalAppointment.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(cancelHospitalAppointment.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(rescheduleHospitalAppointment.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(updateHospitalAppointmentNotes.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(createHospitalAppointmentFollowUp.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(reorderHospitalAppointments.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(fetchHospitalScheduleForDoctor.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(fetchHospitalOverview.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchHospitalOverview.fulfilled, (state, action) => { state.loading = false; state.overview = action.payload; })
      .addCase(fetchHospitalOverview.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchHospitalAnalytics.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchHospitalAnalytics.fulfilled, (state, action) => { state.loading = false; state.analytics = action.payload; })
      .addCase(fetchHospitalAnalytics.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchHospitalPatients.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchHospitalPatients.fulfilled, (state, action) => { state.loading = false; state.patients = action.payload; })
      .addCase(fetchHospitalPatients.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchHospitalCardTemplates.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchHospitalCardTemplates.fulfilled, (state, action) => { state.loading = false; state.cardTemplates = action.payload; })
      .addCase(fetchHospitalCardTemplates.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(createCardTemplate.fulfilled, (state, action) => {
        state.cardTemplates = [action.payload as CardTemplate, ...state.cardTemplates];
      })
      .addCase(createCardTemplate.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(updateCardTemplate.fulfilled, (state, action) => {
        const updated = action.payload as CardTemplate;
        state.cardTemplates = state.cardTemplates.map((t) => (t.id === updated.id ? { ...t, ...updated } : t));
      })
      .addCase(updateCardTemplate.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(deleteCardTemplate.fulfilled, (state, action) => {
        state.cardTemplates = state.cardTemplates.filter((t) => t.id !== action.payload);
      })
      .addCase(deleteCardTemplate.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(registerHospital.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerHospital.fulfilled, (state) => { state.loading = false; })
      .addCase(registerHospital.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchHospitalProfile.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchHospitalProfile.fulfilled, (state, action) => { state.loading = false; state.profile = action.payload; })
      .addCase(fetchHospitalProfile.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchHospitalMe.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchHospitalMe.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload as any;
        state.hospitalRole = payload?.user?.hospitalRole || null;
        state.permissions = payload?.user?.permissions || [];
        state.profile = payload?.hospital || state.profile;
      })
      .addCase(fetchHospitalMe.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(updateHospitalProfile.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateHospitalProfile.fulfilled, (state, action) => { state.loading = false; state.profile = action.payload; })
      .addCase(updateHospitalProfile.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchHospitalStats.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchHospitalStats.fulfilled, (state, action) => { state.loading = false; state.stats = action.payload; })
      .addCase(fetchHospitalStats.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchHospitalDoctors.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchHospitalDoctors.fulfilled, (state, action) => { state.loading = false; state.doctors = action.payload; })
      .addCase(fetchHospitalDoctors.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(updateDoctorStatus.fulfilled, (state, action) => {
        const updated = action.payload as DoctorItem;
        state.doctors = state.doctors.map((d) => (d.id === updated.id ? { ...d, status: updated.status, rejectionReason: updated.rejectionReason } : d));
      })
      .addCase(updateDoctorStatus.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(fetchHospitalReceptionists.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchHospitalReceptionists.fulfilled, (state, action) => { state.loading = false; state.receptionists = action.payload; })
      .addCase(fetchHospitalReceptionists.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(createReceptionist.fulfilled, (state, action) => {
        state.receptionists = [action.payload as ReceptionistItem, ...state.receptionists];
      })
      .addCase(createReceptionist.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(updateReceptionist.fulfilled, (state, action) => {
        const updated = action.payload as ReceptionistItem;
        state.receptionists = state.receptionists.map((r) => (r.id === updated.id ? updated : r));
      })
      .addCase(updateReceptionist.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(deleteReceptionist.fulfilled, (state, action) => {
        state.receptionists = state.receptionists.filter((r) => r.id !== action.payload);
      })
      .addCase(deleteReceptionist.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(fetchHospitalServices.fulfilled, (state, action) => { state.services = action.payload; })
      .addCase(fetchHospitalServices.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(addHospitalService.fulfilled, (state, action) => { state.services = [...state.services, action.payload]; })
      .addCase(addHospitalService.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(setHospitalServices.fulfilled, (state, action) => { state.services = action.payload; })
      .addCase(setHospitalServices.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(removeHospitalService.fulfilled, (state, action) => {
        state.services = state.services.filter((s) => s.id !== action.payload);
      })
      .addCase(removeHospitalService.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(setHospitalLogo.fulfilled, (state, action) => { state.profile = action.payload; })
      .addCase(setHospitalLogo.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(fetchHospitalSchedules.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchHospitalSchedules.fulfilled, (state, action) => { state.loading = false; state.schedules = action.payload; })
      .addCase(fetchHospitalSchedules.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(createHospitalSchedule.fulfilled, (state) => { state.error = null; })
      .addCase(createHospitalSchedule.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(updateHospitalSchedule.fulfilled, (state) => { state.error = null; })
      .addCase(updateHospitalSchedule.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(deleteHospitalSchedule.fulfilled, (state, action) => {
        state.schedules = state.schedules.filter((s) => s.id !== action.payload);
      })
      .addCase(deleteHospitalSchedule.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(fetchHospitalEquipment.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchHospitalEquipment.fulfilled, (state, action) => { state.loading = false; state.equipment = action.payload; })
      .addCase(fetchHospitalEquipment.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(addHospitalEquipment.fulfilled, (state, action) => {
        const eq = action.payload as EquipmentItem;
        if (eq?.id) state.equipment = [eq, ...state.equipment];
        state.error = null;
      })
      .addCase(addHospitalEquipment.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(deleteHospitalEquipment.fulfilled, (state, action) => {
        state.equipment = state.equipment.filter((e) => e.id !== action.payload);
      })
      .addCase(deleteHospitalEquipment.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(toggleHospitalEquipmentStatus.fulfilled, (state, action) => {
        const eq = state.equipment.find((e) => e.id === action.payload.id);
        if (eq) eq.isOperational = action.payload.isOperational;
      })
      .addCase(toggleHospitalEquipmentStatus.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(updateHospitalEquipment.fulfilled, (state, action) => {
        const updated = action.payload as EquipmentItem;
        state.equipment = state.equipment.map((e) => (e.id === updated.id ? { ...e, ...updated } : e));
      })
      .addCase(updateHospitalEquipment.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(fetchEquipmentBookings.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchEquipmentBookings.fulfilled, (state, action) => { state.loading = false; state.equipmentBookings = action.payload; })
      .addCase(fetchEquipmentBookings.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(confirmEquipmentBooking.fulfilled, (state, action) => {
        const b = state.equipmentBookings.find((x) => x.id === action.payload);
        if (b) b.status = 'confirmed';
      })
      .addCase(declineEquipmentBooking.fulfilled, (state, action) => {
        const b = state.equipmentBookings.find((x) => x.id === action.payload);
        if (b) b.status = 'declined';
      })
      .addCase(completeEquipmentBooking.fulfilled, (state, action) => {
        const b = state.equipmentBookings.find((x) => x.id === action.payload);
        if (b) b.status = 'completed';
      })
      .addCase(cancelEquipmentBooking.fulfilled, (state, action) => {
        const b = state.equipmentBookings.find((x) => x.id === action.payload);
        if (b) b.status = 'cancelled';
      })
      .addCase(confirmEquipmentBooking.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(declineEquipmentBooking.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(completeEquipmentBooking.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(cancelEquipmentBooking.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(logout, () => initialState);
  },
});

export const { clearHospitalError } = hospitalSlice.actions;
export default hospitalSlice.reducer;
