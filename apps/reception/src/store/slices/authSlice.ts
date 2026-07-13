import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios, { isAxiosError } from 'axios';
import { API_URL } from '../../config/env';

interface AuthUser {
  id: number;
  username: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

function storedUser() {
  try {
    const raw = localStorage.getItem('receptionist_user');
    if (raw === 'undefined' || raw === null) {
      localStorage.removeItem('receptionist_user');
      return null;
    }
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem('receptionist_user');
    return null;
  }
}

function storedToken() {
  const t = localStorage.getItem('receptionist_token');
  if (t === 'undefined') {
    localStorage.removeItem('receptionist_token');
    return null;
  }
  return t;
}

const initialState: AuthState = {
  token: storedToken(),
  user: storedUser(),
  loading: false,
  error: null,
};

export const loginReceptionist = createAsyncThunk(
  'auth/login',
  async ({ username, password }: { username: string; password: string }, { rejectWithValue }) => {
    try {
      const { data: res } = await axios.post(`${API_URL}/auth/receptionist-login`, { username, password });
      const { token, user } = res.data;
      localStorage.setItem('receptionist_token', token);
      localStorage.setItem('receptionist_user', JSON.stringify(user));
      return { token, user };
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.message : 'Login failed';
      return rejectWithValue(message || 'Login failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.error = null;
      localStorage.removeItem('receptionist_token');
      localStorage.removeItem('receptionist_user');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginReceptionist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginReceptionist.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(loginReceptionist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
