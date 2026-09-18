import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { BASE_URL } from '../../constants/api';
import { RootState } from '../index';
import { logout } from './authSlice';

export interface WalletTransaction {
  id: number;
  amount: number;
  type: string;
  description: string | null;
  createdAt: string;
}

export interface PayoutMethod {
  id: number;
  type: string;
  provider: string;
  accountNumber: string;
  accountName: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface WalletData {
  id: number;
  doctorId: number;
  balance: number;
  transactions: WalletTransaction[];
  withdrawals?: any[];
}

interface WalletState {
  wallet: WalletData | null;
  methods: PayoutMethod[];
  loading: boolean;
  methodsLoading: boolean;
  withdrawLoading: boolean;
  error: string | null;
}

const initialState: WalletState = {
  wallet: null,
  methods: [],
  loading: false,
  methodsLoading: false,
  withdrawLoading: false,
  error: null,
};

const getAuthHeader = (state: RootState) => {
  const token = state.auth.token;
  return { headers: { Authorization: `Bearer ${token}` } };
};

const num = (v: any): number => (v == null || isNaN(Number(v)) ? 0 : Number(v));

export const fetchWallet = createAsyncThunk(
  'wallet/fetch',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const response = await axios.get(`${BASE_URL}/api/wallet`, getAuthHeader(state));
      const w = response.data.data;
      return {
        ...w,
        balance: num(w?.balance),
        transactions: (w?.transactions || []).map((t: any) => ({
          ...t,
          amount: num(t.amount),
        })),
      } as WalletData;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load wallet');
    }
  }
);

export const fetchPayoutMethods = createAsyncThunk(
  'wallet/fetchMethods',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const response = await axios.get(`${BASE_URL}/api/payment-methods`, getAuthHeader(state));
      return response.data.data as PayoutMethod[];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load payout methods');
    }
  }
);

export const addPayoutMethod = createAsyncThunk(
  'wallet/addMethod',
  async (data: { type: string; provider: string; accountNumber: string; accountName: string; isPrimary?: boolean }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const response = await axios.post(`${BASE_URL}/api/payment-methods`, data, getAuthHeader(state));
      return response.data.data as PayoutMethod;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add payout method');
    }
  }
);

export const setPrimaryMethod = createAsyncThunk(
  'wallet/setPrimary',
  async (id: number, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const response = await axios.patch(`${BASE_URL}/api/payment-methods/${id}/primary`, {}, getAuthHeader(state));
      return response.data.data as PayoutMethod;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to set primary method');
    }
  }
);

export const deletePayoutMethod = createAsyncThunk(
  'wallet/deleteMethod',
  async (id: number, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      await axios.delete(`${BASE_URL}/api/payment-methods/${id}`, getAuthHeader(state));
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete payout method');
    }
  }
);

export const requestWithdrawal = createAsyncThunk(
  'wallet/withdraw',
  async (data: { amount: number }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const response = await axios.post(`${BASE_URL}/api/wallet/withdraw`, data, getAuthHeader(state));
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Withdrawal failed');
    }
  }
);

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWallet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWallet.fulfilled, (state, action) => {
        state.loading = false;
        state.wallet = action.payload;
      })
      .addCase(fetchWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchPayoutMethods.pending, (state) => {
        state.methodsLoading = true;
      })
      .addCase(fetchPayoutMethods.fulfilled, (state, action) => {
        state.methodsLoading = false;
        state.methods = action.payload;
      })
      .addCase(fetchPayoutMethods.rejected, (state, action) => {
        state.methodsLoading = false;
        state.error = action.payload as string;
      })
      .addCase(addPayoutMethod.fulfilled, (state, action) => {
        state.methods = [action.payload, ...state.methods.filter(m => m.id !== action.payload.id)];
      })
      .addCase(setPrimaryMethod.fulfilled, (state, action) => {
        state.methods = state.methods.map(m => ({ ...m, isPrimary: m.id === action.payload.id }));
      })
      .addCase(deletePayoutMethod.fulfilled, (state, action) => {
        state.methods = state.methods.filter(m => m.id !== action.payload);
      })
      .addCase(requestWithdrawal.pending, (state) => {
        state.withdrawLoading = true;
        state.error = null;
      })
      .addCase(requestWithdrawal.fulfilled, (state) => {
        state.withdrawLoading = false;
      })
      .addCase(requestWithdrawal.rejected, (state, action) => {
        state.withdrawLoading = false;
        state.error = action.payload as string;
      })
      .addCase(logout, () => initialState);
  },
});

export default walletSlice.reducer;