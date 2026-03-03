import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Loader2, Calendar, Clock, Phone, MapPin, Check, X, Bell } from 'lucide-react';
import { format } from 'date-fns';
import ManualBookingModal from './ManualBookingModal';

interface Booking {
  id: string;
  pitch_id: string;
  full_name: string;
  phone: string;
  start_time: string;
  end_time: string;
  booking_date?: string;
  status: string;
  created_at: string;
  total_price?: number;
  pitches: {
    name: string;
    price_per_hour: number;
  };
}

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [hoursBookedToday, setHoursBookedToday] = useState(0);
  const [showNewRequestBanner, setShowNewRequestBanner] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const notificationPermissionRef = useRef<NotificationPermission>('default');

  useEffect(() => {
    // Initialize notification sound
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUBELTKXh8bllHAU2jdXvzn0pBSh+zPDajzsKElyx6OyrWBUIQ5zd8sFuJAUuhM/z24k2CBhku+zooVARC0yl4fG5ZRwFNo3V7859KQUofsz');
    
    // Request notification permission
    requestNotificationPermission();
    
    fetchBookings();
    const unsubscribe = subscribeToBookings();
    
    return () => {
      unsubscribe();
    };
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      notificationPermissionRef.current = permission;
      console.log('🔔 Notification permission:', permission);
    }
  };

  const showNotification = (booking: Booking) => {
    // Show browser notification if permission granted
    if (notificationPermissionRef.current === 'granted') {
      const notification = new Notification('Yangi bron so\'rovi!', {
        body: `${booking.full_name} - ${booking.pitches?.name}\n${booking.start_time.substring(0, 5)} - ${booking.end_time.substring(0, 5)}`,
        icon: '/bronlogo.png',
        badge: '/bronlogo.png',
        tag: booking.id,
        requireInteraction: true
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }

    // Show in-app banner
    setShowNewRequestBanner(true);
    setTimeout(() => setShowNewRequestBanner(false), 5000);
  };

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.log('Audio play failed:', err));
    }
  };

  const subscribeToBookings = () => {
    // Get local timezone date (Uzbekistan Time)
    const todayDate = format(new Date(), 'yyyy-MM-dd');
    
    console.log('🔌 Setting up real-time subscription for bookings...');
    console.log('📅 Today\'s date (local timezone):', todayDate);
    console.log('🌍 Timezone offset:', new Date().getTimezoneOffset() / -60, 'hours from UTC');
    
    const channel = supabase
      .channel('bookings-realtime', {
        config: {
          broadcast: { self: true }
        }
      })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings' },
        async (payload) => {
          console.log('🆕 New booking received:', payload);
          console.log('📦 Payload data:', JSON.stringify(payload.new, null, 2));
          
          // Fetch the complete booking with pitch details
          const { data, error } = await supabase
            .from('bookings')
            .select(`
              *,
              pitches (
                name,
                price_per_hour
              )
            `)
            .eq('id', payload.new.id)
            .single();

          console.log('📊 Fetched booking data:', data);
          console.log('❌ Fetch error:', error);

          if (error) {
            console.error('Error fetching booking details:', error);
            return;
          }

          if (data) {
            console.log('📅 Booking date:', data.booking_date);
            console.log('🔖 Booking status:', data.status);
            
            // Add new booking to the list (no date filtering for pending requests)
            console.log('✅ Adding booking to list');
            setBookings(prev => {
              console.log('📝 Previous bookings count:', prev.length);
              const updated = [data, ...prev];
              console.log('📝 Updated bookings count:', updated.length);
              return updated;
            });
            
            // Play notification sound and show alert if it's a pending booking
            if (data.status === 'pending') {
              console.log('🔔 Playing notification sound and showing alert');
              playNotificationSound();
              showNotification(data);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings' },
        async (payload) => {
          console.log('🔄 Booking updated:', payload);
          console.log('📦 Update payload:', JSON.stringify(payload.new, null, 2));
          
          // Fetch the complete booking with pitch details
          const { data, error } = await supabase
            .from('bookings')
            .select(`
              *,
              pitches (
                name,
                price_per_hour
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (error) {
            console.error('Error fetching updated booking:', error);
            return;
          }

          if (data) {
            console.log('✏️ Updating booking in list:', data.id);
            setBookings(prev => {
              const index = prev.findIndex(b => b.id === data.id);
              console.log('📍 Found booking at index:', index);
              if (index !== -1) {
                // Update existing booking
                const updated = [...prev];
                updated[index] = data;
                console.log('✅ Booking updated in list');
                return updated;
              }
              console.log('⚠️ Booking not found in current list');
              return prev;
            });
            
            // Recalculate statistics
            recalculateStats();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'bookings' },
        (payload) => {
          console.log('🗑️ Booking deleted:', payload);
          console.log('📦 Delete payload:', JSON.stringify(payload.old, null, 2));
          setBookings(prev => prev.filter(b => b.id !== payload.old.id));
          recalculateStats();
        }
      )
      .subscribe((status, err) => {
        console.log('📡 Subscription status:', status);
        if (err) {
          console.error('❌ Subscription error:', err);
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to bookings real-time updates');
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel error - real-time updates may not work');
        }
        if (status === 'TIMED_OUT') {
          console.error('⏱️ Subscription timed out');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const recalculateStats = () => {
    setBookings(prev => {
      // Get local timezone date for today's stats
      const todayDate = format(new Date(), 'yyyy-MM-dd');
      
      const todayBookings = prev.filter(
        (b) => (b.status === 'confirmed' || b.status === 'manual') && b.booking_date === todayDate
      );
      
      // Calculate total revenue
      const revenue = todayBookings.reduce((sum, booking) => {
        if (booking.total_price) {
          return sum + booking.total_price;
        }
        const [startHour, startMin] = booking.start_time.split(':').map(Number);
        const [endHour, endMin] = booking.end_time.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        const duration = (endMinutes - startMinutes) / 60;
        return sum + (duration * (booking.pitches?.price_per_hour || 0));
      }, 0);
      
      // Calculate total hours
      const hours = todayBookings.reduce((sum, booking) => {
        const [startHour, startMin] = booking.start_time.split(':').map(Number);
        const [endHour, endMin] = booking.end_time.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        const durationHours = (endMinutes - startMinutes) / 60;
        return sum + durationHours;
      }, 0);
      
      setTodayRevenue(revenue);
      setHoursBookedToday(hours);
      
      return prev;
    });
  };

  const fetchBookings = async () => {
    try {
      // Get local timezone date (Uzbekistan Time)
      const today = new Date();
      const todayDate = format(today, 'yyyy-MM-dd');
      
      console.log('📅 Fetching bookings for local date:', todayDate);
      console.log('🌍 Local timezone offset:', today.getTimezoneOffset() / -60, 'hours from UTC');

      // Fetch ALL pending requests (regardless of date) and today's confirmed bookings
      const { data: pendingData, error: pendingError } = await supabase
        .from('bookings')
        .select(`
          *,
          pitches (
            name,
            price_per_hour
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (pendingError) throw pendingError;

      // Fetch today's confirmed/manual bookings
      const { data: todayData, error: todayError } = await supabase
        .from('bookings')
        .select(`
          *,
          pitches (
            name,
            price_per_hour
          )
        `)
        .eq('booking_date', todayDate)
        .in('status', ['confirmed', 'manual'])
        .order('start_time', { ascending: true });

      if (todayError) throw todayError;

      // Combine and deduplicate bookings
      const allBookings = [...(pendingData || []), ...(todayData || [])];
      const uniqueBookings = Array.from(
        new Map(allBookings.map(b => [b.id, b])).values()
      );

      setBookings(uniqueBookings);
      
      // Calculate statistics for today only
      const todayBookings = uniqueBookings.filter(
        (b) => (b.status === 'confirmed' || b.status === 'manual') && b.booking_date === todayDate
      );
      
      // Calculate total revenue from total_price or fallback to price_per_hour
      const revenue = todayBookings.reduce((sum, booking) => {
        if (booking.total_price) {
          return sum + booking.total_price;
        }
        // Fallback: calculate from duration using TIME strings
        const [startHour, startMin] = booking.start_time.split(':').map(Number);
        const [endHour, endMin] = booking.end_time.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        const duration = (endMinutes - startMinutes) / 60;
        return sum + (duration * (booking.pitches?.price_per_hour || 0));
      }, 0);
      
      // Calculate total hours booked
      const hours = todayBookings.reduce((sum, booking) => {
        // Parse TIME strings (HH:mm:ss) to calculate duration
        const [startHour, startMin] = booking.start_time.split(':').map(Number);
        const [endHour, endMin] = booking.end_time.split(':').map(Number);
        
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        const durationHours = (endMinutes - startMinutes) / 60;
        
        return sum + durationHours;
      }, 0);
      
      setTodayRevenue(revenue);
      setHoursBookedToday(hours);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      // Optimistic update
      setBookings(prev => {
        const index = prev.findIndex(b => b.id === id);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = { ...updated[index], status: newStatus };
          return updated;
        }
        return prev;
      });

      // Update in database
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      // Recalculate stats immediately if confirmed
      if (newStatus === 'confirmed') {
        recalculateStats();
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring');
      // Revert optimistic update on error
      fetchBookings();
    }
  };

  const handleApprove = async (bookingId: string) => {
    await handleStatusUpdate(bookingId, 'confirmed');
  };

  const handleReject = async (bookingId: string) => {
    await handleStatusUpdate(bookingId, 'rejected');
  };

  const handleCancel = async (bookingId: string) => {
    // Confirm before canceling
    if (!confirm('Bronni bekor qilmoqchimisiz?')) {
      return;
    }

    await handleStatusUpdate(bookingId, 'cancelled');
  };

  const calculateBookingDuration = (startTime: string, endTime: string) => {
    // Parse TIME strings (HH:mm:ss) to calculate duration
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const durationHours = (endMinutes - startMinutes) / 60;
    
    return durationHours;
  };

  const upcomingBookings = bookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'manual'
  );
  const pendingBookings = bookings.filter((b) => b.status === 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-24 bg-zinc-950 min-h-screen">
      {/* New Request Banner */}
      {showNewRequestBanner && (
        <div className="fixed top-4 left-4 right-4 z-50 animate-bounce">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 shadow-2xl border-2 border-white/20">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-white animate-pulse" />
              <div>
                <p className="text-white font-bold text-lg">Yangi bron so'rovi!</p>
                <p className="text-white/90 text-sm">Kutilayotgan so'rovlar bo'limini tekshiring</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-center gap-3">
        <img 
          src="/bronlogo.png" 
          alt="Bron Logo" 
          className="h-10 w-auto"
        />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-zinc-400 text-sm">{format(new Date(), 'EEEE, dd MMMM')}</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-zinc-400 text-xs mb-1">Bugungi daromad</p>
            <p className="text-2xl font-bold text-white">{todayRevenue.toLocaleString()} so'm</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-zinc-400 text-xs mb-1">Band qilingan soatlar</p>
            <p className="text-2xl font-bold text-white">{hoursBookedToday} soat</p>
          </div>
        </div>
      </div>

      {/* Pending Requests */}
      {pendingBookings.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white px-4 mb-3">Kutilayotgan so'rovlar</h2>
          <div className="space-y-2 px-4">
            {pendingBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-medium mb-1">{booking.full_name}</p>
                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{booking.phone}</span>
                    </div>
                  </div>
                  <span className="bg-yellow-950 text-yellow-400 text-xs px-2 py-1 rounded">
                    Pending
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-zinc-400 mb-3">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{booking.pitches?.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                      {' '}({calculateBookingDuration(booking.start_time, booking.end_time)} soat)
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(booking.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Tasdiqlash
                  </button>
                  <button
                    onClick={() => handleReject(booking.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Rad etish
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Bookings */}
      <div>
        <h2 className="text-lg font-semibold text-white px-4 mb-3">Yaqinlashib kelayotgan bronlar</h2>
        {upcomingBookings.length === 0 ? (
          <div className="px-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
              <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400">Bugungi kunlik bron yo'q</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 px-4">
            {upcomingBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-white font-medium mb-1">{booking.full_name}</p>
                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{booking.phone}</span>
                    </div>
                  </div>
                  <span className="bg-green-950 text-green-400 text-xs px-2 py-1 rounded">
                    Tasdiqlangan
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-zinc-400 mb-3">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{booking.pitches?.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                      {' '}({calculateBookingDuration(booking.start_time, booking.end_time)} soat)
                    </span>
                  </div>
                </div>

                {/* Cancel Button */}
                <button
                  onClick={() => handleCancel(booking.id)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Bekor qilish
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowManualBooking(true)}
        className="fixed bottom-20 right-4 bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors z-10"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Manual Booking Modal */}
      {showManualBooking && (
        <ManualBookingModal
          onClose={() => setShowManualBooking(false)}
          onSuccess={() => {
            setShowManualBooking(false);
            fetchBookings();
          }}
        />
      )}
    </div>
  );
}
