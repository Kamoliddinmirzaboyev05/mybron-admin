import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Loader2, Calendar, Clock, Phone, MapPin, Check, X, Bell, DollarSign, User } from 'lucide-react';
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
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [showNewRequestBanner, setShowNewRequestBanner] = useState(false);
  const [updatedBookingId, setUpdatedBookingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const notificationPermissionRef = useRef<NotificationPermission>('default');

  useEffect(() => {
    // Initialize notification sound - using Web Audio API for better sound
    // Create a simple beep sound
    const createBeepSound = () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800; // Frequency in Hz
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch (error) {
        console.error('Error creating beep sound:', error);
      }
    };
    
    // Store the beep function
    audioRef.current = {
      play: createBeepSound
    } as any;
    
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
    // Format time as HH:mm - HH:mm
    const startTime = booking.start_time.substring(0, 5);
    const endTime = booking.end_time.substring(0, 5);
    
    // Show browser notification if permission granted
    if (notificationPermissionRef.current === 'granted') {
      const notification = new Notification('Yangi bron so\'rovi!', {
        body: `${booking.full_name} - ${booking.pitches?.name}\n${startTime} - ${endTime}`,
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
        (b) => b.status === 'confirmed' && b.booking_date === todayDate
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
      
      // Get current month start and end dates
      const monthStart = format(new Date(uzbekistanTime.getFullYear(), uzbekistanTime.getMonth(), 1), 'yyyy-MM-dd');
      const monthEnd = format(new Date(uzbekistanTime.getFullYear(), uzbekistanTime.getMonth() + 1, 0), 'yyyy-MM-dd');
      
      console.log('📅 FETCHING BOOKINGS:');
      console.log('Current time (local):', now.toISOString());
      console.log('Uzbekistan time:', uzbekistanTime.toISOString());
      console.log('Today\'s date (UZ):', todayDate);
      console.log('Month start:', monthStart);
      console.log('Month end:', monthEnd);

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
        .eq('status', 'confirmed') // Only confirmed bookings (includes manual bookings)
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
      
      // Calculate statistics for today only - confirmed bookings
      const todayBookings = uniqueBookings.filter(
        (b) => b.status === 'confirmed' && b.booking_date === todayDate
      );
      
      console.log('💰 FILTERING TODAY\'S BOOKINGS:');
      console.log('Today\'s bookings:', todayBookings);
      
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
      console.log('Today\'s revenue:', revenue);
      console.log('Today\'s hours:', hours);
      
      // Calculate monthly revenue
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('bookings')
        .select('total_price')
        .gte('booking_date', monthStart)
        .lte('booking_date', monthEnd)
        .eq('status', 'confirmed'); // Only confirmed bookings

      if (monthlyError) throw monthlyError;

      const monthlyRev = (monthlyData || []).reduce((sum, booking) => {
        return sum + (booking.total_price || 0);
      }, 0);
      
      setMonthlyRevenue(monthlyRev);
      
      console.log('📊 MONTHLY REVENUE:');
      console.log('Month start:', monthStart);
      console.log('Month end:', monthEnd);
      console.log('Monthly bookings count:', monthlyData?.length || 0);
      console.log('Monthly revenue:', monthlyRev);
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
        toast.error('Noto\'g\'ri bron ID');
        return;
      }

      // Check auth session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('SESSION_ERROR:', sessionError);
        toast.error('Sessiya tugagan. Iltimos qaytadan kiring.');
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
        toast.error('Bazada xatolik: ' + error.message);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.error('NO_DATA_RETURNED:', { bookingId: id, data });
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
      toast.error('Xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring');
      // Revert optimistic update on error
      fetchBookings();
    }
  };

  const handleApprove = async (bookingId: string) => {
    await handleStatusUpdate(bookingId, 'confirmed');
  };

  const handleReject = async (bookingId: string) => {
    await handleStatusUpdate(bookingId, 'cancelled');
  };

  const handleCancel = async (bookingId: string) => {
    // Confirm before canceling with toast
    const confirmed = window.confirm('Bronni bekor qilmoqchimisiz?');
    if (!confirmed) {
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

  const fetchProfileData = async () => {
    // Monthly revenue is now calculated in fetchBookings
    return;
  };

  const isBookingCompleted = (booking: Booking) => {
    const now = new Date();
    const uzbekistanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tashkent' }));
    const currentTime = format(uzbekistanTime, 'HH:mm:ss');
    const todayDate = format(uzbekistanTime, 'yyyy-MM-dd');
    
    // If booking is for today and end time has passed
    if (booking.booking_date === todayDate) {
      return booking.end_time < currentTime;
    }
    
    return false;
  };

  // Filter bookings for today's schedule
  const now = new Date();
  const uzbekistanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tashkent' }));
  const todayDate = format(uzbekistanTime, 'yyyy-MM-dd');
  
  const todaySchedule = bookings
    .filter((b) => {
      return b.status === 'confirmed' && b.booking_date === todayDate;
    })
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Filter upcoming bookings: show all confirmed bookings for today and future dates
  const upcomingBookings = bookings
    .filter((b) => {
      // Only confirmed bookings
      if (b.status !== 'confirmed') return false;
      
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
      <div className="px-4 pt-6 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <img 
            src="/bronlogo.png" 
            alt="Bron Logo" 
            className="h-10 w-auto"
          />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-1">Admin Dashboard</h1>
            <p className="text-zinc-400 text-sm">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
          </div>
        </div>
      </div>

      {/* Financial Stats - 2 Cards Side by Side */}
      <div className="px-4 pt-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-3">
          <DollarSign className="w-5 h-5 text-green-400" />
          Moliyaviy Ma'lumotlar
        </h2>
        
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Today's Revenue */}
          <div className="bg-gradient-to-br from-green-900/30 to-green-950/50 border border-green-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-green-400" />
              <p className="text-xs text-green-300">Bugungi daromad</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {todayRevenue.toLocaleString()} <span className="text-sm text-green-300">so'm</span>
            </p>
            <p className="text-xs text-green-400 mt-1">{hoursBookedToday} soat</p>
          </div>

          {/* Monthly Revenue */}
          <div className="bg-gradient-to-br from-blue-900/30 to-blue-950/50 border border-blue-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-blue-400" />
              <p className="text-xs text-blue-300">Oylik daromad</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {monthlyRevenue.toLocaleString()} <span className="text-sm text-blue-300">so'm</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Content - Single Column */}
      <div className="px-4">
        
        {/* Pending Requests + Today's Schedule */}
        <div className="space-y-6 max-w-2xl mx-auto">
          {/* Pending Requests */}
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-yellow-400" />
              Kutilayotgan So'rovlar
              {pendingBookings.length > 0 && (
                <span className="bg-yellow-600 text-white text-xs px-2 py-1 rounded-full">
                  {pendingBookings.length}
                </span>
              )}
            </h2>
            
            {pendingBookings.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
                <Check className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400">Yangi so'rovlar yo'q</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className={`bg-zinc-900 border border-yellow-800/50 rounded-xl p-4 transition-all ${
                      updatedBookingId === booking.id ? 'ring-2 ring-yellow-500 shadow-lg shadow-yellow-500/50' : ''
                    }`}
                  >
                    {/* Booking info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-zinc-400" />
                        <p className="text-white font-medium">{booking.full_name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-zinc-400" />
                        <p className="text-zinc-400 text-sm">{booking.phone}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-zinc-400" />
                        <p className="text-zinc-400 text-sm">
                          {format(new Date(booking.booking_date + 'T00:00:00'), 'dd MMM yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-zinc-400" />
                        <p className="text-zinc-400 text-sm">
                          {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                          {' '}({calculateBookingDuration(booking.start_time, booking.end_time)} soat)
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-zinc-400" />
                        <p className="text-zinc-400 text-sm">{booking.pitches?.name}</p>
                      </div>
                    </div>

                    {/* Large action buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleApprove(booking.id)}
                        className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-105"
                      >
                        <Check className="w-5 h-5" />
                        Tasdiqlash
                      </button>
                      <button
                        onClick={() => handleReject(booking.id)}
                        className="bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-105"
                      >
                        <X className="w-5 h-5" />
                        Rad etish
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Schedule - Last 3 Bookings */}
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-blue-400" />
              Bugungi Jadval
            </h2>
            
            {todaySchedule.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
                <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400">Bugun uchun bronlar yo'q</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaySchedule.slice(-3).map((booking) => {
                  const isCompleted = isBookingCompleted(booking);
                  return (
                    <div
                      key={booking.id}
                      className={`relative bg-zinc-900 border rounded-xl p-4 transition-all ${
                        isCompleted 
                          ? 'border-zinc-800 opacity-60' 
                          : 'border-blue-800/50 shadow-lg shadow-blue-900/20'
                      }`}
                    >
                      {/* Time badge */}
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-3 ${
                        isCompleted 
                          ? 'bg-zinc-800 text-zinc-400' 
                          : 'bg-blue-600 text-white'
                      }`}>
                        <Clock className="w-4 h-4" />
                        {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                      </div>

                      {/* Booking details */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-zinc-400" />
                          <p className="text-white font-medium">{booking.full_name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-zinc-400" />
                          <p className="text-zinc-400 text-sm">{booking.phone}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-zinc-400" />
                          <p className="text-zinc-400 text-sm">{booking.pitches?.name}</p>
                        </div>
                      </div>

                      {/* Status badge */}
                      <div className="mt-3 flex justify-between items-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          isCompleted 
                            ? 'bg-purple-950 text-purple-400 border border-purple-800' 
                            : 'bg-green-950 text-green-400 border border-green-800'
                        }`}>
                          {isCompleted ? 'Tugallangan' : 'Faol'}
                        </span>
                        <span className="text-sm font-semibold text-white">
                          {booking.total_price.toLocaleString()} so'm
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
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
