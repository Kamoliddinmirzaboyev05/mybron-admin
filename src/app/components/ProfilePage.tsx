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
  Wallet,
  Calendar,
  Edit2,
  TrendingUp,
  TrendingDown,
  X
} from 'lucide-react';
import { StatCardSkeleton, ProfileCardSkeleton } from './Skeleton';

interface ProfileData {
  total_revenue: number;
  balance: number;
  subscription_days: number;
  subscription_end_date: string | null;
  name: string | null;
  phone: string | null;
}

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [notifications, setNotifications] = useState(true);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({ 
    total_revenue: 0, 
    balance: 0,
    subscription_days: 0,
    subscription_end_date: null,
    name: null,
    phone: null
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [weeklyComparison, setWeeklyComparison] = useState<{ percentage: number; isIncrease: boolean } | null>(null);

  useEffect(() => {
    fetchProfileData();
    calculateWeeklyComparison();
    
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('light', savedTheme === 'light');
    }
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;
    
    try {
      setLoadingProfile(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('total_revenue, balance, subscription_days, subscription_end_date, name, phone')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setProfileData({
          total_revenue: data.total_revenue || 0,
          balance: data.balance || 0,
          subscription_days: data.subscription_days || 0,
          subscription_end_date: data.subscription_end_date || null,
          name: data.name || null,
          phone: data.phone || null,
        });
        setEditName(data.name || '');
        setEditPhone(data.phone || '');
      }
    } catch (error) {
      // Error handled silently
    } finally {
      setLoadingProfile(false);
    }
  };

  const calculateWeeklyComparison = async () => {
    if (!user) return;

    try {
      const now = new Date();
      const uzbekistanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tashkent' }));
      
      // Get start of this week (Monday)
      const thisWeekStart = new Date(uzbekistanTime);
      thisWeekStart.setDate(uzbekistanTime.getDate() - uzbekistanTime.getDay() + 1);
      thisWeekStart.setHours(0, 0, 0, 0);
      
      // Get start of last week
      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(thisWeekStart.getDate() - 7);
      
      const lastWeekEnd = new Date(thisWeekStart);
      lastWeekEnd.setMilliseconds(-1);

      // Get pitch ID
      const { data: pitch } = await supabase
        .from('pitches')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!pitch) return;

      // This week's revenue
      const { data: thisWeekBookings } = await supabase
        .from('bookings')
        .select('total_price')
        .eq('pitch_id', pitch.id)
        .eq('status', 'confirmed')
        .gte('booking_date', thisWeekStart.toISOString().split('T')[0]);

      const thisWeekRevenue = thisWeekBookings?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;

      // Last week's revenue
      const { data: lastWeekBookings } = await supabase
        .from('bookings')
        .select('total_price')
        .eq('pitch_id', pitch.id)
        .eq('status', 'confirmed')
        .gte('booking_date', lastWeekStart.toISOString().split('T')[0])
        .lt('booking_date', thisWeekStart.toISOString().split('T')[0]);

      const lastWeekRevenue = lastWeekBookings?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;

      // Calculate percentage change
      if (lastWeekRevenue === 0) {
        if (thisWeekRevenue > 0) {
          setWeeklyComparison({ percentage: 100, isIncrease: true });
        }
      } else {
        const change = ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100;
        setWeeklyComparison({ 
          percentage: Math.abs(Math.round(change)), 
          isIncrease: change >= 0 
        });
      }
    } catch (error) {
      // Error handled silently
    }
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('light', newTheme === 'light');
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({ 
          name: editName.trim() || null, 
          phone: editPhone.trim() || null 
        })
        .eq('id', user.id);

      if (error) throw error;

      await fetchProfileData();
      setShowEditModal(false);
    } catch (error) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };
  
  const handleSignOut = async () => {
    try {
      setLoading(true);
      const { error } = await signOut();
      if (error) throw error;
      
      // Clear any local storage
      localStorage.clear();
      
      // Redirect to login
      window.location.href = '/login';
    } catch (error) {
      // Error handled silently
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
              <>
                <p className="text-2xl font-bold text-white">
                  {profileData.total_revenue.toLocaleString()} <span className="text-sm text-green-300">so'm</span>
                </p>
                {weeklyComparison && (
                  <div className={`flex items-center gap-1 mt-2 text-xs ${weeklyComparison.isIncrease ? 'text-green-400' : 'text-red-400'}`}>
                    {weeklyComparison.isIncrease ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span>{weeklyComparison.isIncrease ? '+' : '-'}{weeklyComparison.percentage}% bu hafta</span>
                  </div>
                )}
              </>
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

        {/* Subscription Card */}
        <div className={`border rounded-xl p-4 ${
          profileData.subscription_days > 0 
            ? 'bg-gradient-to-br from-purple-900/30 to-purple-950/50 border-purple-800/50' 
            : 'bg-gradient-to-br from-orange-900/30 to-orange-950/50 border-orange-800/50'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className={`w-5 h-5 ${profileData.subscription_days > 0 ? 'text-purple-400' : 'text-orange-400'}`} />
            <p className={`text-xs ${profileData.subscription_days > 0 ? 'text-purple-300' : 'text-orange-300'}`}>
              Obuna holati
            </p>
          </div>
          {loadingProfile ? (
            <Loader2 className={`w-5 h-5 animate-spin ${profileData.subscription_days > 0 ? 'text-purple-400' : 'text-orange-400'}`} />
          ) : (
            <>
              {profileData.subscription_days > 0 ? (
                <>
                  <p className="text-lg font-bold text-white mb-1">
                    Faol obuna
                  </p>
                  <p className="text-sm text-purple-300">
                    {profileData.subscription_days} kun qoldi
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-white mb-1">
                    Obuna tugagan
                  </p>
                  <p className="text-sm text-orange-300 mb-3">
                    Davom ettirish uchun to'lov qiling
                  </p>
                  <button className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors">
                    100,000 so'm to'lash
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* User Info Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                <User className="w-5 h-5 text-zinc-300" />
              </div>
              <div>
                <p className="font-medium">{profileData.name || user?.email || 'Admin'}</p>
                <p className="text-sm text-zinc-400">Tizim maʼmuriyati</p>
              </div>
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <User className="w-4 h-4" />
              <span>Email: {user?.email || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Phone className="w-4 h-4" />
              <span>Telefon: {profileData.phone || '—'}</span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800">
          <button
            className="w-full flex items-center justify-between px-4 py-3"
            onClick={handleThemeToggle}
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

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 w-full max-w-md rounded-2xl border border-zinc-800">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h3 className="text-lg font-semibold text-white">Profilni tahrirlash</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Ism
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Ismingizni kiriting"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Telefon raqami
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="+998 90 123 45 67"
                />
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-zinc-800">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleUpdateProfile}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
