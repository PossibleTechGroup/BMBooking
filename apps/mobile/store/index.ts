import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import patientReducer from './slices/patientSlice';
import appointmentReducer from './slices/appointmentSlice';
import doctorReducer from './slices/doctorSlice';
import equipmentReducer from './slices/equipmentSlice';
import announcementReducer from './slices/announcementSlice';
import hospitalReducer from './slices/hospitalSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    patient: patientReducer,
    appointment: appointmentReducer,
    doctors: doctorReducer,
    equipment: equipmentReducer,
    announcements: announcementReducer,
    hospitals: hospitalReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
