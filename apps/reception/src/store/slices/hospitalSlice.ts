import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import client from '../../api/client';

export interface Hospital {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  image: string | null;
  cardPrice: number;
  serviceFee: { amount: number } | null;
}

interface HospitalState {
  hospital: Hospital | null;
  loading: boolean;
  saving: boolean;
  success: string;
  error: string;
}

const initialState: HospitalState = {
  hospital: null,
  loading: false,
  saving: false,
  success: '',
  error: '',
};

export const fetchHospital = createAsyncThunk(
  'receptionHospital/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await client.get('/receptionist/hospital');
      const h = res.data.data;
      return { ...h, cardPrice: Number(h.cardPrice) };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load hospital');
    }
  }
);

export const updateCardPrice = createAsyncThunk(
  'receptionHospital/updateCardPrice',
  async (cardPrice: number, { rejectWithValue }) => {
    try {
      const res = await client.patch('/receptionist/hospital/card-price', { cardPrice });
      const h = res.data.data;
      return { ...h, cardPrice: Number(h.cardPrice) };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Update failed');
    }
  }
);

const hospitalSlice = createSlice({
  name: 'receptionHospital',
  initialState,
  reducers: {
    clearHospitalSuccess: (state) => { state.success = ''; },
    clearHospitalError: (state) => { state.error = ''; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHospital.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(fetchHospital.fulfilled, (state, action) => {
        state.loading = false;
        state.hospital = action.payload;
      })
      .addCase(fetchHospital.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to load hospital';
      })
      .addCase(updateCardPrice.pending, (state) => {
        state.saving = true;
        state.success = '';
        state.error = '';
      })
      .addCase(updateCardPrice.fulfilled, (state, action) => {
        state.saving = false;
        state.hospital = action.payload;
        state.success = 'Card price updated.';
      })
      .addCase(updateCardPrice.rejected, (state, action) => {
        state.saving = false;
        state.error = (action.payload as string) || 'Update failed';
      });
  },
});

export const { clearHospitalSuccess, clearHospitalError } = hospitalSlice.actions;
export default hospitalSlice.reducer;
