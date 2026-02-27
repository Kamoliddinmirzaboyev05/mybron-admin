import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Loader2 } from 'lucide-react';
import { format, setHours, setMinutes, startOfDay, endOfDay } from 'date-fns';

interface Pitch {
  id: string;
  name: string;
  working_hours_start: string;
  working_hours_end: string;
}

interface TimeSlotSheetProps {
  pitch: Pitch;
  date: Date;
  onSelectSlot: (slot: { start: Date; end: Date }) => void;
  onClose: () => void;
}

interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

export default function TimeSlotSheet({ pitch, date, onSelectSlot, onClose }: TimeSlotSheetProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateTimeSlots();
  }, [pitch, date]);

  const generateTimeSlots = async () => {
    setLoading(true);
    try {
      // Parse working hours
      const [startHour, startMinute] = pitch.working_hours_start.split(':').map(Number);
      const [endHour, endMinute] = pitch.working_hours_end.split(':').map(Number);

      // Get existing bookings for this pitch and date
      const startOfSelectedDay = startOfDay(date).toISOString();
      const endOfSelectedDay = endOfDay(date).toISOString();

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('start_time, end_time')
        .eq('pitch_id', pitch.id)
        .eq('status', 'confirmed')
        .gte('start_time', startOfSelectedDay)
        .lte('start_time', endOfSelectedDay);

      if (error) throw error;

      // Generate 1-hour time slots
      const slots: TimeSlot[] = [];
      let currentHour = startHour;

      while (currentHour < endHour) {
        const slotStart = setMinutes(setHours(date, currentHour), 0);
        const slotEnd = setMinutes(setHours(date, currentHour + 1), 0);

        // Check if slot overlaps with any existing booking
        const isBooked = bookings?.some((booking) => {
          const bookingStart = new Date(booking.start_time);
          const bookingEnd = new Date(booking.end_time);
          return (
            (slotStart >= bookingStart && slotStart < bookingEnd) ||
            (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
            (slotStart <= bookingStart && slotEnd >= bookingEnd)
          );
        });

        slots.push({
          start: slotStart,
          end: slotEnd,
          available: !isBooked,
        });

        currentHour++;
      }

      setTimeSlots(slots);
    } catch (error) {
      console.error('Error generating time slots:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
      <div className="bg-zinc-900 w-full max-h-[70vh] rounded-t-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-4 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Vaqtni tanlang</h3>
            <p className="text-sm text-zinc-400">{format(date, 'dd MMMM, EEEE')}</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Time Slots */}
        <div className="overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {timeSlots.map((slot, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (slot.available) {
                      onSelectSlot(slot);
                    }
                  }}
                  disabled={!slot.available}
                  className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                    slot.available
                      ? 'bg-zinc-800 text-white hover:bg-blue-600 border border-zinc-700'
                      : 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                  }`}
                >
                  {format(slot.start, 'HH:mm')} - {format(slot.end, 'HH:mm')}
                </button>
              ))}
            </div>
          )}

          {!loading && timeSlots.length === 0 && (
            <div className="text-center py-12">
              <p className="text-zinc-400">Bu kun uchun vaqt yo'q</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
