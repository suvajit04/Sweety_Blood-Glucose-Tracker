import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { ReadingsPage } from './pages/ReadingsPage';
import { RegisterPage } from './pages/RegisterPage';
import { ReportsPage } from './pages/ReportsPage';
import { DoctorPatientsPage } from './pages/DoctorPatientsPage';
import { DoctorPatientReportPage } from './pages/DoctorPatientReportPage';

function ProtectedLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="app-loading"><span className="loading-mark">♥</span><p>Opening your Sweety space…</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  const doctorPath = location.pathname.startsWith('/doctor');
  if (user.role === 'DOCTOR' && !doctorPath) return <Navigate to="/doctor/patients" replace />;
  if (user.role === 'PATIENT' && doctorPath) return <Navigate to="/dashboard" replace />;
  return <AppLayout />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/readings" element={<ReadingsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/doctor/patients" element={<DoctorPatientsPage />} />
        <Route path="/doctor/patients/:patientId" element={<DoctorPatientReportPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
