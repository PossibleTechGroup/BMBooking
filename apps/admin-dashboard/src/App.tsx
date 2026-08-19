import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import ReportsPage from './pages/ReportsPage';
import { HospitalsPage } from './pages/HospitalsPage';
import { HospitalRegistrationsPage } from './pages/HospitalRegistrationsPage';
import AppliedHospitalsPage from './pages/AppliedHospitalsPage';
import { ItemsPage } from './pages/ItemsPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { DoctorProfileView } from './pages/DoctorProfileView';
import AnalysisPage from './pages/AnalysisPage';

function App() {
  const { token } = useSelector((state: RootState) => state.auth);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route
          path="/login"
          element={!token ? <LoginPage /> : <Navigate to="/" />}
        />
        <Route element={token ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<DashboardPage />} />
          <Route path="patients" element={<PatientsPage />} />
          <Route path="analysis" element={<AnalysisPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="hospitals" element={<HospitalsPage />} />
          <Route path="hospital-registrations" element={<HospitalRegistrationsPage />} />
          <Route path="applied-hospitals" element={<AppliedHospitalsPage />} />
          <Route path="medical-tools" element={<ItemsPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="doctor-profile/:doctorId" element={<DoctorProfileView />} />
        </Route>
        <Route path="*" element={
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-secondary)' }}>
            <p>page not found</p>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
