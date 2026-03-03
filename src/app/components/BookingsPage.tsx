import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Filter, Clock, MapPin, Phone, User } from 'lucide-react';
import { format } from 'date-fns';

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
  pitches: {
    name: string;
  };
}

type FilterStatus = 'all' | 'pending' | 'confirmed' | 'rejected';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          pitches (
            name
          )
        `)
        .order('start_time', { ascending: false });

      if (error) throw error;
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
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-950 text-yellow-400 border-yellow-800',
      confirmed: 'bg-green-950 text-green-400 border-green-800',
      manual: 'bg-blue-950 text-blue-400 border-blue-800',
      rejected: 'bg-red-950 text-red-400 border-red-800',
    };

    const labels = {
      pending: 'Kutilmoqda',
      confirmed: 'Tasdiqlangan',
      manual: 'Qo\'lda',
      rejected: 'Rad etilgan',
    };

    return (
      <span className={`text-xs px-2 py-1 rounded border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
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
        <h1 className="text-2xl font-bold text-white mb-4">Barcha bronlar</h1>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-900 text-zinc-400'
            }`}
          >
            Hammasi ({bookings.length})
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === 'confirmed'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-900 text-zinc-400'
            }`}
          >
            Kutilmoqda ({bookings.filter((b) => b.status === 'confirmed' || b.status === 'manual').length})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === 'rejected'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-900 text-zinc-400'
            }`}
          >
            Tasdiqlangan ({bookings.filter((b) => b.status === 'rejected').length})
          </button>
        </div>
      </div>

      {/* Bookings List */}
      <div className="px-4 space-y-3">
        {filteredBookings.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
            <Filter className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
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
                {getStatusBadge(booking.status)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
