import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Loader2, Calendar, Clock, User, Phone, MapPin, Check, X } from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';
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

  useEffect(() => {
    fetchBookings();
    subscribeToBookings();
  }, []);

  const subscribeToBookings = () => {
    const channel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          console.log('Booking changed, refreshing data...');
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchBookings = async () => {
    try {
      const today = new Date();
      const todayDate = format(today, 'yyyy-MM-dd'); // Format: '2026-03-03'

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          pitches (
            name,
            price_per_hour
          )
        `)
        .eq('booking_date', todayDate)
        .order('start_time', { ascending: true });

      if (error) throw error;

      setBookings(data || []);
      
      // Calculate statistics with flexible duration support
      const todayBookings = (data || []).filter(
        (b) => b.status === 'confirmed' || b.status === 'manual'
      );
      
      // Calculate total revenue from total_price or fallback to price_per_hour
      const revenue = todayBookings.reduce((sum, booking) => {
        if (booking.total_price) {
          return sum + booking.total_price;
        }
        // Fallback: calculate from duration
        const duration = (new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) / (1000 * 60 * 60);
        return sum + (duration * (booking.pitches?.price_per_hour || 0));
      }, 0);
      
      // Calculate total hours booked
      const hours = todayBookings.reduce((sum, booking) => {
        const duration = (new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) / (1000 * 60 * 60);
        return sum + duration;
      }, 0);
      
      setTodayRevenue(revenue);
      setHoursBookedToday(hours);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId);

      if (error) throw error;
      fetchBookings();
    } catch (error) {
      console.error('Error approving booking:', error);
    }
  };

  const handleReject = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'rejected' })
        .eq('id', bookingId);

      if (error) throw error;
      fetchBookings();
    } catch (error) {
      console.error('Error rejecting booking:', error);
    }
  };

  const calculateBookingDuration = (startTime: string, endTime: string) => {
    const duration = (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60 * 60);
    return duration;
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
                      {format(new Date(booking.start_time), 'HH:mm')} - {format(new Date(booking.end_time), 'HH:mm')}
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
                
                <div className="flex items-center gap-4 text-sm text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{booking.pitches?.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {format(new Date(booking.start_time), 'HH:mm')} - {format(new Date(booking.end_time), 'HH:mm')}
                      {' '}({calculateBookingDuration(booking.start_time, booking.end_time)} soat)
                    </span>
                  </div>
                </div>
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
