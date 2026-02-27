import { useState } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import DashboardPage from './components/DashboardPage';
import BookingsPage from './components/BookingsPage';
import PitchPage from './components/PitchPage';
import ProfilePage from './components/ProfilePage';
import BottomNav from './components/BottomNav';
import { Loader2 } from 'lucide-react';

function Router() {
  const [route, setRoute] = useState(window.location.pathname);

  // Listen to browser back/forward
  window.onpopstate = () => {
    setRoute(window.location.pathname);
  };

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setRoute(path);
  };

  if (route === '/register') {
    return <RegisterPage />;
  }

  if (route === '/login') {
    return <LoginPage />;
  }

  return <MainApp />;
}

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    window.location.href = '/login';
    return null;
  }

  return (
    <div className="bg-zinc-950 min-h-screen">
      {activeTab === 'dashboard' && <DashboardPage />}
      {activeTab === 'bookings' && <BookingsPage />}
      {activeTab === 'pitch' && <PitchPage />}
      {activeTab === 'profile' && <ProfilePage />}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}