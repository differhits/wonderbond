import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AppLayout from '../components/layout/AppLayout';

// Pages
import LandingPage from '../pages/landing/LandingPage';
import AuthPage from '../pages/auth/AuthPage';
import OnboardingPage from '../pages/onboarding/OnboardingPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import DiscoverPage from '../pages/discover/DiscoverPage';
import MatchesPage from '../pages/matches/MatchesPage';
import MessagesPage from '../pages/messages/MessagesPage';
import ProfilePage from '../pages/profile/ProfilePage';
import TripsPage from '../pages/trips/TripsPage';
import SavedPage from '../pages/saved/SavedPage';
import SettingsPage from '../pages/settings/SettingsPage';
import AdminPage from '../pages/admin/AdminPage';
import TravelMapPage from '../pages/map/TravelMapPage';

function AuthedLayout({ children }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
      <Route path="/dashboard" element={<AuthedLayout><DashboardPage /></AuthedLayout>} />
      <Route path="/discover" element={<AuthedLayout><DiscoverPage /></AuthedLayout>} />
      <Route path="/map" element={<AuthedLayout><TravelMapPage /></AuthedLayout>} />
      <Route path="/matches" element={<AuthedLayout><MatchesPage /></AuthedLayout>} />
      <Route path="/messages" element={<AuthedLayout><MessagesPage /></AuthedLayout>} />
      <Route path="/messages/:matchId" element={<AuthedLayout><MessagesPage /></AuthedLayout>} />
      <Route path="/trips" element={<AuthedLayout><TripsPage /></AuthedLayout>} />
      <Route path="/saved" element={<AuthedLayout><SavedPage /></AuthedLayout>} />
      <Route path="/profile" element={<AuthedLayout><ProfilePage /></AuthedLayout>} />
      <Route path="/profile/:userId" element={<AuthedLayout><ProfilePage /></AuthedLayout>} />
      <Route path="/settings" element={<AuthedLayout><SettingsPage /></AuthedLayout>} />
      <Route path="/admin" element={<AuthedLayout><AdminPage /></AuthedLayout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

