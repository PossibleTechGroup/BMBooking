import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { storage } from '../../utils/storage';
import { BASE_URL } from '../../constants/api';

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
  isCheckingAuth: boolean;
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
  isCheckingAuth: true,
  doctorProfileStatus: 'None',
  patientProfileStatus: 'None',
  rejectionReason: null,
};

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, 
});

const mapErrorToKey = (message: string): string => {
  if (!message) return 'errorGeneric';
  const msg = message.toLowerCase();
  
  if (msg.includes('experienceyears') && msg.includes('less than or equal to 60')) {
    return 'errorExperienceLimit';
  }
  if (msg.includes('experienceyears') && msg.includes('must be a number')) {
    return 'valExpNumber';
  }

  if (msg.includes('already registered')) return 'errorAlreadyRegistered';
  if (msg.includes('file is too large') || msg.includes('file too large') || msg.includes('maximum allowed size')) return 'errorFileTooLarge';
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

export const fetchDoctorProfileStatus = createAsyncThunk(
  'auth/fetchDoctorProfileStatus',
  async (tokenOverride: string | undefined, { getState, rejectWithValue }) => {
    const state = getState() as { auth: AuthState };
    const token = tokenOverride || state.auth.token;
    
    if (!token) return rejectWithValue('No token');

    try {
      const response = await api.get('/api/doctors/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { status: 'None' };
      }
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
      const response = await api.get('/api/patients/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { status: 'None' };
      }
      return rejectWithValue(error.message);
    }
  }
);

let pollIntervalId: any = null;
export const startProfilePolling = createAsyncThunk(
  'auth/startProfilePolling',
  async (_, { dispatch }) => {
    if (pollIntervalId) clearInterval(pollIntervalId);
    pollIntervalId = setInterval(() => {
      dispatch(fetchDoctorProfileStatus());
    }, 15000);
  }
);

export const stopProfilePolling = createAsyncThunk(
  'auth/stopProfilePolling',
  async () => {
    if (pollIntervalId) {
      clearInterval(pollIntervalId);
      pollIntervalId = null;
    }
  }
);

export const loadStoredAuth = createAsyncThunk(
  'auth/loadStoredAuth',
  async (_, { dispatch }) => {
    try {
      const token = await storage.getItem('auth_token');
      const userData = await storage.getItem('user_data');
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
  }
);

export const requestOtp = createAsyncThunk(
  'auth/requestOtp',
  async (
    { phone, role, isRegistration }: { phone: string; role?: string; isRegistration: boolean },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post('/api/auth/request-otp', { phone, role, isRegistration });
      return response.data;
    } catch (error: any) {
      const rawMessage = error.response?.data?.message || error.response?.data?.data?.message || error.message;
      return rejectWithValue(mapErrorToKey(rawMessage));
    }
  }
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async (
    { phone, code, role, isRegistration }: { phone: string; code: string; role?: string; isRegistration: boolean },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const response = await api.post('/api/auth/verify-otp', { phone, code, role, isRegistration });
      const { token, user } = response.data.data;

      await storage.setItem('auth_token', token);
      await storage.setItem('user_data', JSON.stringify(user));

      if (user.role === 'doctor') {
        await dispatch(fetchDoctorProfileStatus(token));
      } else if (user.role === 'patient') {
        await dispatch(fetchPatientProfileStatus(token));
      }

      return { token, user };
    } catch (error: any) {
      const rawMessage = error.response?.data?.message || error.response?.data?.data?.message || error.message;
      return rejectWithValue(mapErrorToKey(rawMessage));
    }
  }
);

export const submitDoctorProfile = createAsyncThunk(
  'auth/submitDoctorProfile',
  async (formData: FormData, { getState, rejectWithValue }) => {
    const state = getState() as { auth: AuthState };
    try {
      const response = await api.post('/api/doctors/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${state.auth.token}`,
        },
      });
      return response.data.data;
    } catch (error: any) {
      const rawMessage = error.response?.data?.message || error.response?.data?.data?.message || error.message;
      return rejectWithValue(mapErrorToKey(rawMessage));
    }
  }
);

export const resetOtpStatus = () => (dispatch: any) => {
  dispatch(authSlice.actions.setOtpSent(false));
};

export const updateDoctorAvailability = createAsyncThunk(
  'auth/updateAvailability',
  async (availability: any[], { getState, rejectWithValue }) => {
    const state = getState() as { auth: AuthState };
    try {
      const response = await api.put('/api/doctors/availability',
        { availability },
        {
          headers: { Authorization: `Bearer ${state.auth.token}` },
        }
      );
      return response.data.data;
    } catch (error: any) {
      const rawMessage = error.response?.data?.message || error.message;
      return rejectWithValue(rawMessage);
    }
  }
);

export const updatePushToken = createAsyncThunk(
  'auth/updatePushToken',
  async (token: string, { getState, rejectWithValue }) => {
    const state = getState() as { auth: AuthState };
    if (!state.auth.token) return rejectWithValue('No auth token');
    
    try {
      const response = await api.post('/api/auth/push-token', { token }, {
        headers: { Authorization: `Bearer ${state.auth.token}` },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update push token');
    }
  }
);

export const deleteAccount = createAsyncThunk(
  'auth/deleteAccount',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { auth: AuthState };
    if (!state.auth.token) return rejectWithValue('No auth token');

    try {
      await api.delete('/api/auth/account', {
        headers: { Authorization: `Bearer ${state.auth.token}` },
      });
      return true;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete account');
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
      state.rejectionReason = null;
      if (pollIntervalId) {
        clearInterval(pollIntervalId);
        pollIntervalId = null;
      }
      storage.removeItem('auth_token');
      storage.removeItem('user_data');
      storage.removeItem('user-language');
    },
    clearError: (state) => {
      state.error = null;
    },
    setOtpSent: (state, action: PayloadAction<boolean>) => {
      state.otpSent = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadStoredAuth.pending, (state) => {
        state.isCheckingAuth = true;
      })
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        state.isCheckingAuth = false;
        if (action.payload) {
          state.token = action.payload.token;
          state.user = action.payload.user;
          
          // Sync profile status from user object if available
          if (state.user?.doctorProfile) {
            state.doctorProfileStatus = state.user.doctorProfile.status || 'PendingReview';
          }
          if (state.user?.patientProfile) {
            state.patientProfileStatus = 'Complete';
          }
        }
      })
      .addCase(loadStoredAuth.rejected, (state) => {
        state.isCheckingAuth = false;
      })
      .addCase(fetchDoctorProfileStatus.fulfilled, (state, action) => {
        state.doctorProfileStatus = action.payload.status;
        state.rejectionReason = action.payload.rejectionReason || null;
        if (state.user && action.payload) {
          state.user.doctorProfile = action.payload;
        }
      })
      .addCase(fetchPatientProfileStatus.fulfilled, (state, action) => {
        state.patientProfileStatus = action.payload.status || 'Complete';
        if (state.user && action.payload) {
          state.user.patientProfile = action.payload;
        }
      })
      .addCase(requestOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestOtp.fulfilled, (state) => {
        state.loading = false;
        state.otpSent = true;
      })
      .addCase(requestOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.loading = false;
        
        // Sync profile status from user object if available
        if (state.user?.doctorProfile) {
          state.doctorProfileStatus = state.user.doctorProfile.status || 'PendingReview';
        }
        if (state.user?.patientProfile) {
          state.patientProfileStatus = 'Complete';
        }
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(submitDoctorProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(submitDoctorProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.doctorProfileStatus = action.payload.status;
        if (state.user) {
          state.user.doctorProfile = action.payload;
        }
      })
      .addCase(submitDoctorProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateDoctorAvailability.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateDoctorAvailability.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        if (state.user && state.user.doctorProfile) {
          state.user.doctorProfile.availability = action.payload.availability;
        }
      })
      .addCase(updateDoctorAvailability.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updatePushToken.fulfilled, (state) => {
        console.log('Push token synced with backend');
      })
      .addCase(updatePushToken.rejected, (state, action) => {
        console.error('Failed to sync push token:', action.payload);
      })
      .addCase(deleteAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.otpSent = false;
        state.loading = false;
        state.doctorProfileStatus = 'None';
        state.patientProfileStatus = 'None';
        state.rejectionReason = null;
        if (pollIntervalId) {
          clearInterval(pollIntervalId);
          pollIntervalId = null;
        }
        storage.removeItem('auth_token');
        storage.removeItem('user_data');
        storage.removeItem('user-language');
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
