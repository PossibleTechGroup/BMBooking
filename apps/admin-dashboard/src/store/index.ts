import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import doctorReducer from './slices/doctorSlice';
import payoutReducer from './slices/payoutSlice';
import equipmentReducer from './slices/equipmentSlice';
import announcementReducer from './slices/announcementSlice';
import hospitalReducer from './slices/hospitalSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    doctors: doctorReducer,
    payouts: payoutReducer,
    equipment: equipmentReducer,
    announcements: announcementReducer,
    hospitals: hospitalReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
