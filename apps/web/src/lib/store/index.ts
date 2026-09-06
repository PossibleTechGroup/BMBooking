import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import patientReducer from './slices/patientSlice';
import appointmentReducer from './slices/appointmentSlice';
import doctorReducer from './slices/doctorSlice';
import equipmentReducer from './slices/equipmentSlice';
import hospitalReducer from './slices/hospitalSlice';
import adminDoctorReducer from './slices/adminDoctorSlice';
import adminHospitalReducer from './slices/adminHospitalSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    patient: patientReducer,
    appointment: appointmentReducer,
    doctors: doctorReducer,
    equipment: equipmentReducer,
    hospital: hospitalReducer,
    adminDoctors: adminDoctorReducer,
    adminHospitals: adminHospitalReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
