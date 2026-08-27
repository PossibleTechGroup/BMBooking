import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import hospitalReducer from './slices/hospitalSlice';
import appointmentReducer from './slices/appointmentSlice';
import scheduleReducer from './slices/scheduleSlice';
import equipmentReducer from './slices/equipmentSlice';
import doctorsReducer from './slices/doctorsSlice';
import notificationReducer from './slices/notificationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    hospital: hospitalReducer,
    appointments: appointmentReducer,
    schedules: scheduleReducer,
    equipment: equipmentReducer,
    doctors: doctorsReducer,
    notifications: notificationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

