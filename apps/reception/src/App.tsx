import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DoctorsPage from './pages/doctors';
import SchedulesPage from './pages/SchedulesPage';
import AppointmentsPage from './pages/AppointmentsPage';
import EquipmentPage from './pages/EquipmentPage';
import HospitalSettingsPage from './pages/HospitalSettingsPage';
import LegalPage from './pages/LegalPage';
import NotificationsPage from './pages/NotificationsPage';
import PatientsPage from './pages/PatientsPage';
import Layout from './components/Layout';

export default function App() {
  const token = useSelector((state: RootState) => state.auth.token);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!token ? <LoginPage /> : <Navigate to="/" replace />} />
        <Route element={token ? <Layout /> : <Navigate to="/login" replace />}>
          <Route index element={<DashboardPage />} />
          <Route path="doctors" element={<DoctorsPage />} />
          <Route path="schedules" element={<SchedulesPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="patients" element={<PatientsPage />} />
          <Route path="equipment" element={<EquipmentPage />} />
          <Route path="hospital" element={<HospitalSettingsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="legal" element={<LegalPage />} />
        </Route>
        <Route path="*" element={
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-secondary)' }}>
            <p>page not found</p>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}
