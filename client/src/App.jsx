import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Topbar from './Topbar';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import IntakePage from './pages/IntakePage';
import BookingPage from './pages/BookingPage';
import AppointmentPage from './pages/AppointmentPage';
import DashboardPage from './pages/DashboardPage';
import PlanPage from './pages/PlanPage';
import ProviderQueuePage from './pages/ProviderQueuePage';
import ProviderVisitPage from './pages/ProviderVisitPage';

function Protected({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'provider' ? '/provider' : '/dashboard'} replace />;
  return children;
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/signup" replace />;
  return <Navigate to={user.role === 'provider' ? '/provider' : '/dashboard'} replace />;
}

function Shell() {
  return (
    <div className="app-shell">
      <Topbar />
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/intake" element={<Protected role="patient"><IntakePage /></Protected>} />
        <Route path="/book" element={<Protected role="patient"><BookingPage /></Protected>} />
        <Route path="/appointments/:id" element={<Protected><AppointmentPage /></Protected>} />
        <Route path="/dashboard" element={<Protected role="patient"><DashboardPage /></Protected>} />
        <Route path="/plan" element={<Protected role="patient"><PlanPage /></Protected>} />

        <Route path="/provider" element={<Protected role="provider"><ProviderQueuePage /></Protected>} />
        <Route path="/provider/appointments/:id" element={<Protected role="provider"><ProviderVisitPage /></Protected>} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </BrowserRouter>
  );
}
