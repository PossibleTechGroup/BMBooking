import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api/client';

export type ProfileStatus = 'None' | 'PendingReview' | 'Approved' | 'Rejected' | 'Complete';

interface User {
  id: number;
  phone: string;
  fullName?: string;
  role: 'patient' | 'doctor';
  isLocked: boolean;
  doctorProfile?: any;
  patientProfile?: any;
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
  return 'errorGeneric';
};

export const loadStoredAuth = createAsyncThunk('auth/loadStoredAuth', async () => {
  try {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    if (token && userData) {
      return { token, user: JSON.parse(userData) as User };
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
      .addCase(verifyOtp.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
