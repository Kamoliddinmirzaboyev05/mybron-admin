import { useState } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';
import BookingsPage from './components/BookingsPage';
import SettingsPage from './components/SettingsPage';
import ProfilePage from './components/ProfilePage';
import BottomNav from './components/BottomNav';
import Navbar from './components/Navbar';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

function Router() {
  const { user, loading } = useAuth();
  const [route, setRoute] = useState(window.location.pathname);

  // Listen to browser back/forward
  window.onpopstate = () => {
    setRoute(window.location.pathname);
  };

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setRoute(path);
  };

  // Show loading while checking session
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // If user is logged in and trying to access login, redirect to dashboard
  if (user && route === '/login') {
    window.location.href = '/';
    return null;
  }

  // If user is not logged in and trying to access protected routes, show login
  if (!user && route !== '/login') {
    return <LoginPage />;
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
    <div className="bg-zinc-950 min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pb-20">
        {activeTab === 'dashboard' && <DashboardPage />}
        {activeTab === 'bookings' && <BookingsPage />}
        {activeTab === 'settings' && <SettingsPage />}
        {activeTab === 'profile' && <ProfilePage />}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#18181b',
            color: '#fff',
            border: '1px solid #27272a',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Router />
    </AuthProvider>
  );
}