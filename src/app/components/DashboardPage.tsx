import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Loader2, Calendar, Clock, Phone, MapPin, Check, X, Bell } from 'lucide-react';
import { format } from 'date-fns';
import ManualBookingModal from './ManualBookingModal';
import toast from 'react-hot-toast';
import { StatCardSkeleton, BookingCardSkeleton } from './Skeleton';

interface Booking {
  id: string;
  pitch_id: string;
  user_id: string | null;
  full_name: string;
  phone: string;
  start_time: string;
  end_time: string;
  booking_date: string; // DATE format: 'YYYY-MM-DD'
  status: 'pending' | 'confirmed' | 'manual' | 'rejected' | 'cancelled';
  created_at: string;
  total_price: number;
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
  const [updatedBookingId, setUpdatedBookingId] = useState<string | null>(null);
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
            
            // Prepend new booking to the list (Task 2: Handle New Inserts)
            console.log('✅ Prepending booking to list');
            setBookings(current => {
              console.log('📝 Previous bookings count:', current.length);
              const updated = [data, ...current];
              console.log('📝 Updated bookings count:', updated.length);
              return updated;
            });
            
            // Recalculate stats if it's a confirmed booking for today
            if ((data.status === 'confirmed' || data.status === 'manual') && data.booking_date === todayDate) {
              console.log('� Recalculating stats for new confirmed booking');
              setTimeout(() => recalculateStats(), 100);
            }
            
            // Play notification sound and show alert if it's a pending booking
            if (data.status === 'pending') {
              console.log('🔔 Playing notification sound and showing alert');
              playNotificationSound();
              showNotification(data);
              toast.success('Yangi bron so\'rovi keldi!', {
                icon: '🔔',
                duration: 4000,
              });
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
            console.log('� New status:', data.status);
            
            // Task 1: Unified State Sync - Update booking in state
            setBookings(current => {
              const index = current.findIndex(b => b.id === data.id);
              console.log('📍 Found booking at index:', index);
              
              if (index !== -1) {
                // Update existing booking
                const updated = current.map(b => 
                  b.id === data.id ? data : b
                );
                console.log('✅ Booking updated in list');
                return updated;
              } else {
                // Booking not in list, add it
                console.log('➕ Booking not found, adding to list');
                return [data, ...current];
              }
            });
            
            // Task 4: Visual Feedback - Highlight the updated booking
            setUpdatedBookingId(data.id);
            setTimeout(() => setUpdatedBookingId(null), 2000);
            
            // Task 3: Automatic Stats Re-calculation
            if (data.status === 'confirmed' || data.status === 'manual') {
              console.log('📊 Recalculating stats after status change to confirmed');
              setTimeout(() => recalculateStats(), 100);
            }
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
      // Get Uzbekistan timezone date
      const now = new Date();
      const uzbekistanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tashkent' }));
      const todayDate = format(uzbekistanTime, 'yyyy-MM-dd');
      
      console.log('📅 FETCHING BOOKINGS:');
      console.log('Current time (local):', now.toISOString());
      console.log('Uzbekistan time:', uzbekistanTime.toISOString());
      console.log('Today\'s date (UZ):', todayDate);
      console.log('Expected date for stats: 2026-03-04');

      // Fetch ALL pending requests (regardless of date)
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

      // Fetch confirmed/manual bookings for today AND future dates
      const { data: upcomingData, error: upcomingError } = await supabase
        .from('bookings')
        .select(`
          *,
          pitches (
            name,
            price_per_hour
          )
        `)
        .gte('booking_date', todayDate)
        .in('status', ['confirmed', 'manual'])
        .order('booking_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (upcomingError) throw upcomingError;

      // Combine and deduplicate bookings
      const allBookings = [...(pendingData || []), ...(upcomingData || [])];
      const uniqueBookings = Array.from(
        new Map(allBookings.map(b => [b.id, b])).values()
      );

      setBookings(uniqueBookings);
      
      console.log('📦 FETCHED BOOKINGS:');
      console.log('Pending count:', pendingData?.length || 0);
      console.log('Upcoming count:', upcomingData?.length || 0);
      console.log('Total unique bookings:', uniqueBookings.length);
      console.log('Pending data:', pendingData);
      console.log('Upcoming data:', upcomingData);
      console.log('All unique bookings:', uniqueBookings);
      
      // Log user_id distribution
      const manualBookings = uniqueBookings.filter(b => b.user_id === null);
      const userBookings = uniqueBookings.filter(b => b.user_id !== null);
      console.log('📊 BOOKING DISTRIBUTION:');
      console.log('Manual bookings (user_id = null):', manualBookings.length);
      console.log('User bookings (user_id present):', userBookings.length);
      console.log('Manual bookings data:', manualBookings);
      console.log('User bookings data:', userBookings);
      
      // Calculate statistics for today only - confirmed AND manual bookings
      const todayBookings = uniqueBookings.filter(
        (b) => (b.status === 'confirmed' || b.status === 'manual') && b.booking_date === todayDate
      );
      
      console.log('💰 FILTERING TODAY\'S BOOKINGS:');
      console.log('Today\'s date for comparison:', todayDate);
      console.log('All unique bookings:', uniqueBookings);
      console.log('Bookings with today\'s date:', uniqueBookings.filter(b => b.booking_date === todayDate));
      console.log('Confirmed/Manual bookings:', uniqueBookings.filter(b => b.status === 'confirmed' || b.status === 'manual'));
      console.log('Final today\'s bookings:', todayBookings);
      
      // Calculate total revenue from total_price
      const revenue = todayBookings.reduce((sum, booking) => {
        console.log(`Adding booking ${booking.id}: ${booking.total_price}`);
        return sum + (booking.total_price || 0);
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
      
      console.log('💰 STATS CALCULATED:');
      console.log('Today\'s date:', todayDate);
      console.log('Today\'s bookings count:', todayBookings.length);
      console.log('Today\'s revenue:', revenue);
      console.log('Today\'s hours:', hours);
      console.log('Today\'s bookings:', todayBookings);
      
      // Log today's bookings by user_id
      const todayManual = todayBookings.filter(b => b.user_id === null);
      const todayUser = todayBookings.filter(b => b.user_id !== null);
      console.log('📊 TODAY\'S BOOKING DISTRIBUTION:');
      console.log('Manual bookings (user_id = null):', todayManual.length);
      console.log('User bookings (user_id present):', todayUser.length);
      console.log('Manual bookings:', todayManual);
      console.log('User bookings:', todayUser);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: 'confirmed' | 'rejected' | 'cancelled') => {
    try {
      // Validate booking ID
      console.log('UPDATE_ATTEMPT:', { bookingId: id, newStatus, idType: typeof id });
      
      if (!id || typeof id !== 'string') {
        console.error('INVALID_BOOKING_ID:', id);
        alert('Noto\'g\'ri bron ID');
        return;
      }

      // Check auth session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('SESSION_ERROR:', sessionError);
        alert('Sessiya tugagan. Iltimos qaytadan kiring.');
        return;
      }
      console.log('SESSION_VALID:', { userId: session.user.id });

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

      // Update in database with .select() to return updated data
      const { data, error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', id)
        .select();

      if (error) {
        console.error('SUPABASE_UPDATE_ERROR:', error);
        alert('Bazada xatolik: ' + error.message);
        toast.error('Bazada xatolik: ' + error.message);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.error('NO_DATA_RETURNED:', { bookingId: id, data });
        alert('Bron topilmadi yoki yangilanmadi');
        toast.error('Bron topilmadi yoki yangilanmadi');
        throw new Error('No data returned from update');
      }

      console.log('UPDATE_SUCCESSFUL:', data);
      
      // Show success toast based on status
      if (newStatus === 'confirmed') {
        toast.success('Bron muvaffaqiyatli tasdiqlandi!', {
          icon: '✅',
        });
      } else if (newStatus === 'rejected') {
        toast.error('Bron rad etildi', {
          icon: '❌',
        });
      } else if (newStatus === 'cancelled') {
        toast('Bron bekor qilindi', {
          icon: '🚫',
        });
      }
      
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

  // Filter upcoming bookings: show all confirmed bookings for today and future dates
  const now = new Date();
  const uzbekistanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tashkent' }));
  const todayDate = format(uzbekistanTime, 'yyyy-MM-dd');
  
  const upcomingBookings = bookings
    .filter((b) => {
      // Only confirmed or manual bookings
      if (b.status !== 'confirmed' && b.status !== 'manual') return false;
      
      // Show all bookings for today (regardless of time - persist until end of day)
      if (b.booking_date === todayDate) return true;
      
      // Show all future bookings
      if (b.booking_date && b.booking_date > todayDate) return true;
      
      // Hide past bookings
      return false;
    })
    .sort((a, b) => {
      // Sort by date first
      const dateCompare = (a.booking_date || '').localeCompare(b.booking_date || '');
      if (dateCompare !== 0) return dateCompare;
      
      // Then by start time (earliest first)
      return (a.start_time || '').localeCompare(b.start_time || '');
    });
  
  const pendingBookings = bookings.filter((b) => b.status === 'pending');

  // Debug: Log bookings data
  console.log('📊 BOOKINGS DEBUG:');
  console.log('Current date (Uzbekistan):', todayDate);
  console.log('Total bookings:', bookings.length);
  console.log('Pending bookings:', pendingBookings.length);
  console.log('Upcoming bookings (today + future):', upcomingBookings.length);
  console.log('All bookings data:', bookings);
  console.log('Pending bookings data:', pendingBookings);
  console.log('Upcoming bookings data:', upcomingBookings);
  
  // Log upcoming bookings by user_id
  const upcomingManual = upcomingBookings.filter(b => b.user_id === null);
  const upcomingUser = upcomingBookings.filter(b => b.user_id !== null);
  console.log('📊 UPCOMING BOOKING DISTRIBUTION:');
  console.log('Manual bookings (user_id = null):', upcomingManual.length);
  console.log('User bookings (user_id present):', upcomingUser.length);
  console.log('Manual bookings:', upcomingManual);
  console.log('User bookings:', upcomingUser);

  if (loading) {
    return (
      <div className="pb-24 bg-zinc-950 min-h-screen">
        {/* Header Skeleton */}
        <div className="px-4 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-zinc-800 rounded animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-7 w-32 bg-zinc-800 rounded animate-pulse" />
              <div className="h-4 w-40 bg-zinc-800 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="px-4 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        </div>

        {/* Pending Requests Skeleton */}
        <div className="mb-6">
          <div className="h-6 w-48 bg-zinc-800 rounded animate-pulse px-4 mb-3" />
          <div className="space-y-2 px-4">
            <BookingCardSkeleton />
            <BookingCardSkeleton />
          </div>
        </div>

        {/* Upcoming Bookings Skeleton */}
        <div>
          <div className="h-6 w-56 bg-zinc-800 rounded animate-pulse px-4 mb-3" />
          <div className="space-y-2 px-4">
            <BookingCardSkeleton />
            <BookingCardSkeleton />
            <BookingCardSkeleton />
          </div>
        </div>
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
                className={`bg-zinc-900 border border-zinc-800 rounded-xl p-4 transition-all duration-300 ${
                  updatedBookingId === booking.id ? 'animate-pulse ring-2 ring-blue-500 shadow-lg shadow-blue-500/50' : ''
                }`}
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
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{booking.booking_date ? format(new Date(booking.booking_date + 'T00:00:00'), 'dd MMM yyyy') : 'Sana ko\'rsatilmagan'}</span>
                  </div>
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
              <p className="text-zinc-400">Tasdiqlangan bronlar yo'q</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 px-4">
            {upcomingBookings.map((booking) => (
              <div
                key={booking.id}
                className={`bg-zinc-900 border border-zinc-800 rounded-xl p-4 transition-all duration-300 ${
                  updatedBookingId === booking.id ? 'animate-pulse ring-2 ring-green-500 shadow-lg shadow-green-500/50' : ''
                }`}
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
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{booking.booking_date ? format(new Date(booking.booking_date + 'T00:00:00'), 'dd MMM yyyy') : 'Bugun'}</span>
                  </div>
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
