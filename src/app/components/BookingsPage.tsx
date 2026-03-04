import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Clock, MapPin, Phone, User, X } from 'lucide-react';
import { format } from 'date-fns';

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
  };
}

type FilterStatus = 'pending' | 'confirmed' | 'rejected';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('pending');
  const [showHistory, setShowHistory] = useState(false);
  const [historyBookings, setHistoryBookings] = useState<Booking[]>([]);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      console.log('📋 BRONLAR PAGE: Fetching bookings...');
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          pitches (
            name
          )
        `)
        .order('booking_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('❌ BRONLAR PAGE: Error fetching bookings:', error);
        throw error;
      }
      
      console.log('✅ BRONLAR PAGE: Bookings fetched successfully');
      console.log('📊 Total bookings:', data?.length || 0);
      console.log('📦 Bookings data:', data);
      
      // Log bookings by status
      const byStatus = {
        pending: data?.filter(b => b.status === 'pending').length || 0,
        confirmed: data?.filter(b => b.status === 'confirmed').length || 0,
        manual: data?.filter(b => b.status === 'manual').length || 0,
        rejected: data?.filter(b => b.status === 'rejected').length || 0,
        cancelled: data?.filter(b => b.status === 'cancelled').length || 0,
      };
      console.log('📈 Bookings by status:', byStatus);
      
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
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

  const filteredBookings = bookings.filter((booking) => {
    // Get current Uzbekistan date
    const now = new Date();
    const uzbekistanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tashkent' }));
    const todayDateUZ = format(uzbekistanTime, 'yyyy-MM-dd');
    
    console.log('🔍 FILTERING BOOKINGS:');
    console.log('Today\'s date (UZ):', todayDateUZ);
    console.log('Booking date:', booking.booking_date);
    console.log('Booking status:', booking.status);
    console.log('Date comparison:', booking.booking_date, '>=', todayDateUZ, '=', booking.booking_date >= todayDateUZ);
    
    // Filter out past bookings (only show today and future)
    if (booking.booking_date < todayDateUZ) return false;
    
    if (filter === 'pending') {
      return booking.status === 'pending';
    }
    
    if (filter === 'confirmed') {
      return booking.status === 'confirmed' || booking.status === 'manual';
    }
    
    if (filter === 'rejected') {
      return booking.status === 'cancelled';
    }
    
    return false;
  });

  // Get history bookings (past dates)
  const getHistoryBookings = () => {
    const now = new Date();
    const uzbekistanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tashkent' }));
    const todayDateUZ = format(uzbekistanTime, 'yyyy-MM-dd');
    
    return bookings.filter(booking => booking.booking_date < todayDateUZ);
  };

  console.log('🔍 BRONLAR PAGE: Filter applied');
  console.log('Current filter:', filter);
  console.log('Filtered bookings count:', filteredBookings.length);
  console.log('Filtered bookings data:', filteredBookings);

  const getStatusBadge = (status: string, bookingDate: string) => {
    // Check if booking is completed (past date)
    const now = new Date();
    const uzbekistanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tashkent' }));
    const todayDateUZ = format(uzbekistanTime, 'yyyy-MM-dd');
    const isCompleted = bookingDate < todayDateUZ && (status === 'confirmed' || status === 'manual');
    
    const styles = {
      pending: 'bg-yellow-950 text-yellow-400 border-yellow-800',
      confirmed: 'bg-green-950 text-green-400 border-green-800',
      manual: 'bg-blue-950 text-blue-400 border-blue-800',
      rejected: 'bg-red-950 text-red-400 border-red-800',
      cancelled: 'bg-red-950 text-red-400 border-red-800',
      completed: 'bg-purple-950 text-purple-400 border-purple-800',
    };

    const labels = {
      pending: 'Kutilmoqda',
      confirmed: 'Tasdiqlangan',
      manual: 'Qo\'lda',
      rejected: 'Rad etilgan',
      cancelled: 'Rad etilgan',
      completed: 'Tugallangan',
    };

    const displayStatus = isCompleted ? 'completed' : status;

    return (
      <span className={`text-xs px-2 py-1 rounded border ${styles[displayStatus as keyof typeof styles]}`}>
        {labels[displayStatus as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-24 bg-zinc-950 min-h-screen">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">Barcha bronlar</h1>
          <button
            onClick={() => {
              setHistoryBookings(getHistoryBookings());
              setShowHistory(true);
            }}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-zinc-800 transition-colors"
            title="Tarix"
          >
            <Clock className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-zinc-900 text-zinc-400'
            }`}
          >
            Kutilmoqda ({bookings.filter((b) => {
              const now = new Date();
              const uzbekistanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tashkent' }));
              const todayDateUZ = format(uzbekistanTime, 'yyyy-MM-dd');
              return b.status === 'pending' && b.booking_date >= todayDateUZ;
            }).length})
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === 'confirmed'
                ? 'bg-green-600 text-white'
                : 'bg-zinc-900 text-zinc-400'
            }`}
          >
            Tasdiqlangan ({bookings.filter((b) => {
              const now = new Date();
              const uzbekistanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tashkent' }));
              const todayDateUZ = format(uzbekistanTime, 'yyyy-MM-dd');
              return (b.status === 'confirmed' || b.status === 'manual') && b.booking_date >= todayDateUZ;
            }).length})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === 'rejected'
                ? 'bg-red-600 text-white'
                : 'bg-zinc-900 text-zinc-400'
            }`}
          >
            Rad etilgan ({bookings.filter((b) => {
              const now = new Date();
              const uzbekistanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tashkent' }));
              const todayDateUZ = format(uzbekistanTime, 'yyyy-MM-dd');
              return b.status === 'cancelled' && b.booking_date >= todayDateUZ;
            }).length})
          </button>
        </div>
      </div>

      {/* Bookings List */}
      <div className="px-4 space-y-3">
        {filteredBookings.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
            <Clock className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">Bronlar topilmadi</p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-zinc-900 rounded-xl p-4"
            >
              {/* Name with icon */}
              <div className="flex items-center gap-2 mb-3">
                <User className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                <p className="text-white font-medium truncate">{booking.full_name}</p>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{booking.phone}</span>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{booking.pitches?.name}</span>
              </div>

              {/* Date and Time */}
              <div className="flex items-center gap-2 text-sm text-zinc-400 mb-3">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">
                  {booking.booking_date ? format(new Date(booking.booking_date), 'dd MMM') : 'N/A'}, {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                  {' '}({calculateBookingDuration(booking.start_time, booking.end_time)} soat)
                </span>
              </div>

              {/* Status Badge at bottom */}
              <div className="flex justify-end">
                {getStatusBadge(booking.status, booking.booking_date)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-zinc-900 w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 bg-zinc-900 border-b border-zinc-800 px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-semibold text-white">Tarix</h2>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto p-4">
              {historyBookings.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-400">O'tgan bronlar yo'q</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-zinc-800 rounded-xl p-4"
                    >
                      {/* Name with icon */}
                      <div className="flex items-center gap-2 mb-3">
                        <User className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                        <p className="text-white font-medium truncate">{booking.full_name}</p>
                      </div>

                      {/* Phone */}
                      <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{booking.phone}</span>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{booking.pitches?.name}</span>
                      </div>

                      {/* Date and Time */}
                      <div className="flex items-center gap-2 text-sm text-zinc-400 mb-3">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">
                          {format(new Date(booking.booking_date), 'dd MMM yyyy')}, {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                          {' '}({calculateBookingDuration(booking.start_time, booking.end_time)} soat)
                        </span>
                      </div>

                      {/* Status Badge */}
                      <div className="flex justify-end">
                        {getStatusBadge(booking.status, booking.booking_date)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
