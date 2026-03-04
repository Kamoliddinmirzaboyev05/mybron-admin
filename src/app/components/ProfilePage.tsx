import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  User, 
  Phone, 
  Moon, 
  Sun, 
  Bell, 
  CreditCard, 
  Lock, 
  ChevronRight, 
  LogOut,
  Loader2,
  DollarSign,
  Wallet
} from 'lucide-react';

interface ProfileData {
  total_revenue: number;
  balance: number;
}

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [notifications, setNotifications] = useState(true);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({ total_revenue: 0, balance: 0 });
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;
    
    try {
      setLoadingProfile(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('total_revenue, balance')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setProfileData({
          total_revenue: data.total_revenue || 0,
          balance: data.balance || 0,
        });
      }
      
      console.log('💰 PROFILE DATA:', data);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoadingProfile(false);
    }
  };
  
  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut();
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="pb-24 bg-zinc-950 min-h-screen text-white">
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <img 
            src="/bronlogo.png" 
            alt="Bron Logo" 
            className="h-10 w-auto"
          />
          <h1 className="text-2xl font-bold">Profil</h1>
        </div>
        <p className="text-zinc-400 text-sm">Hisob sozlamalari</p>
      </div>

      <div className="px-4 space-y-4">
        {/* Revenue and Balance Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-green-900/30 to-green-950/50 border border-green-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              <p className="text-xs text-green-300">Jami tushum</p>
            </div>
            {loadingProfile ? (
              <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
            ) : (
              <p className="text-2xl font-bold text-white">
                {profileData.total_revenue.toLocaleString()} <span className="text-sm text-green-300">so'm</span>
              </p>
            )}
          </div>

          <div className="bg-gradient-to-br from-blue-900/30 to-blue-950/50 border border-blue-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5 text-blue-400" />
              <p className="text-xs text-blue-300">Hozirgi balans</p>
            </div>
            {loadingProfile ? (
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            ) : (
              <p className="text-2xl font-bold text-white">
                {profileData.balance.toLocaleString()} <span className="text-sm text-blue-300">so'm</span>
              </p>
            )}
          </div>
        </div>

        {/* User Info Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
              <User className="w-5 h-5 text-zinc-300" />
            </div>
            <div>
              <p className="font-medium">{user?.email || 'Admin'}</p>
              <p className="text-sm text-zinc-400">Tizim maʼmuriyati</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Phone className="w-4 h-4" />
            <span>Telefon: —</span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800">
          <button
            className="w-full flex items-center justify-between px-4 py-3"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-zinc-300" />
              ) : (
                <Sun className="w-5 h-5 text-zinc-300" />
              )}
              <span>Mavzu: {theme === 'dark' ? 'Qorong‘i' : 'Yorug‘'}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </button>

          <button
            className="w-full flex items-center justify-between px-4 py-3"
            onClick={() => setNotifications(!notifications)}
          >
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-zinc-300" />
              <span>Bildirishnomalar: {notifications ? 'Yoqilgan' : 'O‘chirilgan'}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </button>

          <a className="w-full flex items-center justify-between px-4 py-3" href="/billing">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-zinc-300" />
              <span>To‘lovlar</span>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </a>

          <a className="w-full flex items-center justify-between px-4 py-3" href="/security">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-zinc-300" />
              <span>Xavfsizlik</span>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </a>
        </div>

        <button
          onClick={handleSignOut}
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
          Chiqish
        </button>
      </div>
    </div>
  );
}
