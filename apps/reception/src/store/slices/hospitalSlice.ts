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

export interface CardTemplate {
  id: number;
  name: string;
  price: number;
  validityDays: number | null;
  isActive: boolean;
  createdAt: string;
}

interface HospitalState {
  hospital: Hospital | null;
  cardTemplates: CardTemplate[];
  loading: boolean;
  saving: boolean;
  templateSaving: boolean;
  success: string;
  error: string;
}

const initialState: HospitalState = {
  hospital: null,
  cardTemplates: [],
  loading: false,
  saving: false,
  templateSaving: false,
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

export const fetchCardTemplates = createAsyncThunk(
  'receptionHospital/fetchCardTemplates',
  async (_, { rejectWithValue }) => {
    try {
      const res = await client.get(`/receptionist/card-templates?t=${Date.now()}`);
      const list: any[] = res.data.data ?? [];
      return list.map((t) => ({ ...t, price: Number(t.price) }));
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load card packages');
    }
  }
);

export const createCardTemplate = createAsyncThunk(
  'receptionHospital/createCardTemplate',
  async (data: { name: string; price: number; validityDays: number | null }, { rejectWithValue }) => {
    try {
      const res = await client.post('/receptionist/card-templates', data);
      const t = res.data.data;
      return { ...t, price: Number(t.price) };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create card package');
    }
  }
);

export const updateCardTemplate = createAsyncThunk(
  'receptionHospital/updateCardTemplate',
  async ({ id, data }: { id: number; data: { name?: string; price?: number; validityDays?: number | null } }, { rejectWithValue }) => {
    try {
      const res = await client.patch(`/receptionist/card-templates/${id}`, data);
      const t = res.data.data;
      return { ...t, price: Number(t.price) };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update card package');
    }
  }
);

export const deleteCardTemplate = createAsyncThunk(
  'receptionHospital/deleteCardTemplate',
  async (id: number, { rejectWithValue }) => {
    try {
      await client.delete(`/receptionist/card-templates/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete card package');
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
      })
      .addCase(fetchCardTemplates.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(fetchCardTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.cardTemplates = action.payload;
      })
      .addCase(fetchCardTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to load card packages';
      })
      .addCase(createCardTemplate.pending, (state) => {
        state.templateSaving = true;
        state.success = '';
        state.error = '';
      })
      .addCase(createCardTemplate.fulfilled, (state, action) => {
        state.templateSaving = false;
        state.cardTemplates = [action.payload, ...state.cardTemplates];
        state.success = 'Card package created.';
      })
      .addCase(createCardTemplate.rejected, (state, action) => {
        state.templateSaving = false;
        state.error = (action.payload as string) || 'Failed to create card package';
      })
      .addCase(updateCardTemplate.fulfilled, (state, action) => {
        const updated = action.payload;
        state.cardTemplates = state.cardTemplates.map((t) => (t.id === updated.id ? updated : t));
        state.success = 'Card package updated.';
      })
      .addCase(updateCardTemplate.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Failed to update card package';
      })
      .addCase(deleteCardTemplate.fulfilled, (state, action) => {
        state.cardTemplates = state.cardTemplates.filter((t) => t.id !== action.payload);
        state.success = 'Card package deleted.';
      })
      .addCase(deleteCardTemplate.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Failed to delete card package';
      });
  },
});

export const { clearHospitalSuccess, clearHospitalError } = hospitalSlice.actions;
export default hospitalSlice.reducer;
