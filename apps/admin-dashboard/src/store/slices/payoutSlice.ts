import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

interface WithdrawalRequest {
  id: number;
  walletId: number;
  amount: number;
  status: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  createdAt: string;
  wallet: {
    doctor: {
      fullName: string;
    }
  }
}

interface PayoutState {
  requests: WithdrawalRequest[];
  loading: boolean;
  error: string | null;
}

const initialState: PayoutState = {
  requests: [],
  loading: false,
  error: null,
};

export const fetchWithdrawals = createAsyncThunk(
  'payouts/fetch',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as any;
    try {
      const response = await axios.get('/api/admin/withdrawals', {
        headers: { Authorization: `Bearer ${state.auth.token}` }
      });
      return response.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch payouts');
    }
  }
);

export const completePayout = createAsyncThunk(
  'payouts/complete',
  async ({ id, formData }: { id: number; formData: FormData }, { getState, rejectWithValue }) => {
    const state = getState() as any;
    try {
      const response = await axios.post(`/api/admin/withdrawals/${id}/complete`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${state.auth.token}` 
        }
      });
      return response.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to complete payout');
    }
  }
);

const payoutSlice = createSlice({
  name: 'payouts',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWithdrawals.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWithdrawals.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload;
      })
      .addCase(fetchWithdrawals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(completePayout.fulfilled, (state, action) => {
        const index = state.requests.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.requests[index] = action.payload;
        }
      });
  }
});

export default payoutSlice.reducer;
