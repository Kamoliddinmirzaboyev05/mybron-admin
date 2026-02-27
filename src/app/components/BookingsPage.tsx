import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Filter, Clock, MapPin, Phone, User } from 'lucide-react';
import { format } from 'date-fns';

interface Booking {
  id: string;
  pitch_id: string;
  customer_name: string;
  customer_phone: string;
  start_time: string;
  end_time: string;
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

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
            }`}
          >
            Hammasi ({bookings.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
            }`}
          >
            Kutilmoqda ({bookings.filter((b) => b.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === 'confirmed'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
            }`}
          >
            Tasdiqlangan ({bookings.filter((b) => b.status === 'confirmed' || b.status === 'manual').length})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === 'rejected'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
            }`}
          >
            Rad etilgan ({bookings.filter((b) => b.status === 'rejected').length})
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
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-zinc-400" />
                    <p className="text-white font-medium">{booking.customer_name}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{booking.customer_phone}</span>
                  </div>
                </div>
                {getStatusBadge(booking.status)}
              </div>

              <div className="flex items-center gap-4 text-sm text-zinc-400 mb-2">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{booking.pitches?.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {format(new Date(booking.start_time), 'dd MMM, HH:mm')} -{' '}
                  {format(new Date(booking.end_time), 'HH:mm')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
