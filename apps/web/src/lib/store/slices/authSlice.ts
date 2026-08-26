import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api/client';

export type ProfileStatus = 'None' | 'PendingReview' | 'Approved' | 'Rejected' | 'Complete';

interface User {
  id: number;
  phone: string;
  fullName?: string;
  role: 'patient' | 'doctor' | 'hospital';
  isLocked: boolean;
  doctorProfile?: any;
  patientProfile?: any;
  hospitalProfile?: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  otpSent: boolean;
  doctorProfileStatus: ProfileStatus;
  patientProfileStatus: ProfileStatus;
  rejectionReason: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  otpSent: false,
  doctorProfileStatus: 'None',
  patientProfileStatus: 'None',
  rejectionReason: null,
};

const mapErrorToKey = (message: string): string => {
  if (!message) return 'errorGeneric';
  const msg = message.toLowerCase();
  if (msg.includes('already registered')) return 'errorAlreadyRegistered';
  if (msg.includes('role conflict') || msg.includes('wrong role')) return 'errorRoleConflict';
  if (msg.includes('invalid ethiopian number')) return 'errorInvalidPhone';
  if (msg.includes('invalid otp')) return 'errorOtpInvalid';
  if (msg.includes('otp expired')) return 'errorOtpExpired';
  if (msg.includes('already been used')) return 'errorOtpUsed';
  if (msg.includes('failed to send otp')) return 'errorOtpSend';
  if (msg.includes('account locked')) return 'errorAccountLocked';
  if (msg.includes('network') || msg.includes('timeout')) return 'errorNetwork';
  if (msg.includes('role is required')) return 'errorRoleRequired';
  if (msg.includes('pending') && msg.includes('hospital')) return 'errorHospitalPending';
  if (msg.includes('rejected') && msg.includes('hospital')) return 'errorHospitalRejected';
  if (msg.includes('registration form')) return 'errorHospitalFormRequired';
  if (msg.includes('no hospital')) return 'errorHospitalNoProfile';
  return 'errorGeneric';
};

export const fetchDoctorProfileStatus = createAsyncThunk(
  'auth/fetchDoctorProfileStatus',
  async (tokenOverride: string | undefined, { getState, rejectWithValue }) => {
    const state = getState() as { auth: AuthState };
    const token = tokenOverride || state.auth.token;
    if (!token) return rejectWithValue('No token');
    try {
      const response = await api.get('/doctors/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) return { status: 'None' };
      return rejectWithValue(error.message);
    }
  }
);

export const fetchPatientProfileStatus = createAsyncThunk(
  'auth/fetchPatientProfileStatus',
  async (tokenOverride: string | undefined, { getState, rejectWithValue }) => {
    const state = getState() as { auth: AuthState };
    const token = tokenOverride || state.auth.token;
    if (!token) return rejectWithValue('No token');
    try {
      const response = await api.get('/patients/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) return { status: 'None' };
      return rejectWithValue(error.message);
    }
  }
);

export const submitDoctorProfile = createAsyncThunk(
  'auth/submitDoctorProfile',
  async (data: any, { getState, rejectWithValue }) => {
    const state = getState() as { auth: AuthState };
    try {
      const response = await api.post('/doctors/profile', data, {
        headers: { Authorization: `Bearer ${state.auth.token}` },
      });
      return response.data.data;
    } catch (error: any) {
      const rawMessage = error.response?.data?.message || error.response?.data?.data?.message || error.message;
      return rejectWithValue(rawMessage);
    }
  }
);

export const submitPatientProfile = createAsyncThunk(
  'auth/submitPatientProfile',
  async (data: any, { getState, rejectWithValue }) => {
    const state = getState() as { auth: AuthState };
    try {
      const response = await api.post('/patients/profile', data, {
        headers: { Authorization: `Bearer ${state.auth.token}` },
      });
      return response.data.data;
    } catch (error: any) {
      const rawMessage = error.response?.data?.message || error.response?.data?.data?.message || error.message;
      return rejectWithValue(rawMessage);
    }
  }
);

export const loadStoredAuth = createAsyncThunk('auth/loadStoredAuth', async (_, { dispatch }) => {
  try {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    if (token && userData) {
      const user = JSON.parse(userData) as User;
      if (user.role === 'doctor') {
        await dispatch(fetchDoctorProfileStatus(token));
      } else if (user.role === 'patient') {
        await dispatch(fetchPatientProfileStatus(token));
      }
      return { token, user };
    }
    return null;
  } catch {
    return null;
  }
});

export const requestOtp = createAsyncThunk(
  'auth/requestOtp',
  async ({ phone, role, isRegistration }: { phone: string; role?: string; isRegistration: boolean }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/request-otp', { phone, role, isRegistration });
      return response.data;
    } catch (error: any) {
      const rawMessage = error.response?.data?.message || error.response?.data?.data?.message || error.message;
      return rejectWithValue(mapErrorToKey(rawMessage));
    }
  }
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ phone, code, role, isRegistration }: { phone: string; code: string; role?: string; isRegistration: boolean }, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.post('/auth/verify-otp', { phone, code, role, isRegistration });
      const { token, user } = response.data.data;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_data', JSON.stringify(user));

      if (user.role === 'doctor') {
        try { await dispatch(fetchDoctorProfileStatus(token)); } catch {}
      } else if (user.role === 'patient') {
        try { await dispatch(fetchPatientProfileStatus(token)); } catch {}
      }

      return { token, user };
    } catch (error: any) {
      const rawMessage = error.response?.data?.message || error.response?.data?.data?.message || error.message;
      return rejectWithValue(mapErrorToKey(rawMessage));
    }
  }
);

export const hospitalLogin = createAsyncThunk(
  'auth/hospitalLogin',
  async ({ phone, password }: { phone: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/hospital-login', { phone, password });
      const { token, user } = response.data.data;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_data', JSON.stringify(user));
      return { token, user };
    } catch (error: any) {
      const rawMessage = error.response?.data?.message || error.response?.data?.data?.message || error.message;
      return rejectWithValue(mapErrorToKey(rawMessage));
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.otpSent = false;
      state.doctorProfileStatus = 'None';
      state.patientProfileStatus = 'None';
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    },
    clearError: (state) => { state.error = null; },
    setOtpSent: (state, action: PayloadAction<boolean>) => { state.otpSent = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.token = action.payload.token;
          state.user = action.payload.user;
        }
      })
      .addCase(requestOtp.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(requestOtp.fulfilled, (state) => { state.loading = false; state.otpSent = true; })
      .addCase(requestOtp.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(verifyOtp.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.loading = false;
      })
      .addCase(verifyOtp.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchDoctorProfileStatus.fulfilled, (state, action) => {
        const profile = action.payload;
        if (profile?.status) {
          state.doctorProfileStatus = profile.status;
          state.rejectionReason = profile.rejectionReason || null;
          state.user = state.user ? { ...state.user, doctorProfile: profile } : state.user;
        } else {
          state.doctorProfileStatus = 'None';
        }
      })
      .addCase(fetchPatientProfileStatus.fulfilled, (state, action) => {
        const profile = action.payload;
        if (profile?.fullName) {
          state.patientProfileStatus = 'Complete';
          state.user = state.user ? { ...state.user, patientProfile: profile } : state.user;
        } else {
          state.patientProfileStatus = 'None';
        }
      })
      .addCase(fetchDoctorProfileStatus.rejected, (state) => {
        state.doctorProfileStatus = 'None';
      })
      .addCase(fetchPatientProfileStatus.rejected, (state) => {
        state.patientProfileStatus = 'None';
      })
      .addCase(submitDoctorProfile.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(submitDoctorProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = state.user ? { ...state.user, doctorProfile: action.payload } : state.user;
        state.doctorProfileStatus = 'PendingReview';
      })
      .addCase(submitDoctorProfile.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(submitPatientProfile.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(submitPatientProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = state.user ? { ...state.user, patientProfile: action.payload } : state.user;
        state.patientProfileStatus = 'Complete';
      })
      .addCase(submitPatientProfile.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(hospitalLogin.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(hospitalLogin.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.loading = false;
      })
      .addCase(hospitalLogin.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
