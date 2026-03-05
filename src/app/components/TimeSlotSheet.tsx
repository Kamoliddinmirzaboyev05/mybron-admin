import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Loader2 } from 'lucide-react';
import { format, setHours, setMinutes, startOfDay, endOfDay } from 'date-fns';

interface Pitch {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
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
  const [selectedStartIndex, setSelectedStartIndex] = useState<number | null>(null);
  const [selectedEndIndex, setSelectedEndIndex] = useState<number | null>(null);

  useEffect(() => {
    generateTimeSlots();
  }, [pitch, date]);

  const generateTimeSlots = async () => {
    setLoading(true);
    try {
      // Parse working hours
      const [startHour, startMinute] = pitch.start_time.split(':').map(Number);
      const [endHour, endMinute] = pitch.end_time.split(':').map(Number);

      // Get selected date
      const selectedDate = format(date, 'yyyy-MM-dd'); // Format: '2026-03-05'

      // Get current Uzbekistan time
      const now = new Date();
      const uzbekistanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tashkent' }));
      const currentHourUZ = uzbekistanTime.getHours();
      const todayDateUZ = format(uzbekistanTime, 'yyyy-MM-dd');
      const isToday = selectedDate === todayDateUZ;

      console.log('⏰ TIME SLOT GENERATION (pitch_slots):');
      console.log('Selected date:', selectedDate);
      console.log('Today (Uzbekistan):', todayDateUZ);
      console.log('Current hour (Uzbekistan):', currentHourUZ);
      console.log('Is today:', isToday);

      // Fetch available slots from pitch_slots table
      const { data: pitchSlots, error: slotsError } = await supabase
        .from('pitch_slots')
        .select('start_time, end_time, is_available')
        .eq('pitch_id', pitch.id)
        .eq('slot_date', selectedDate)
        .order('start_time', { ascending: true });

      if (slotsError) {
        console.error('Error fetching pitch_slots:', slotsError);
        // Fallback to old method if pitch_slots doesn't exist yet
        await generateTimeSlotsLegacy();
        return;
      }

      console.log('📊 Fetched pitch_slots:', pitchSlots);

      // Generate 1-hour time slots
      const slots: TimeSlot[] = [];
      let currentHour = startHour;

      while (currentHour < endHour) {
        // Skip past time slots if booking for today
        if (isToday && currentHour <= currentHourUZ) {
          console.log(`⏭️ Skipping past slot: ${currentHour}:00 (current hour: ${currentHourUZ})`);
          currentHour++;
          continue;
        }

        const slotStart = setMinutes(setHours(date, currentHour), 0);
        const slotEnd = setMinutes(setHours(date, currentHour + 1), 0);

        // Format times for comparison (HH:mm only, ignore seconds)
        const slotStartTime = format(slotStart, 'HH:mm');
        const slotEndTime = format(slotEnd, 'HH:mm');

        // Check if slot exists in pitch_slots and is available
        const pitchSlot = pitchSlots?.find((ps) => {
          const psStart = ps.start_time.substring(0, 5);
          const psEnd = ps.end_time.substring(0, 5);
          return psStart === slotStartTime && psEnd === slotEndTime;
        });

        // If slot exists in pitch_slots, use its availability
        // If slot doesn't exist, check bookings (fallback)
        let isAvailable = true;
        
        if (pitchSlot) {
          isAvailable = pitchSlot.is_available;
          console.log(`✅ Slot ${slotStartTime}-${slotEndTime}: ${isAvailable ? 'Available' : 'Occupied'} (from pitch_slots)`);
        } else {
          // Fallback: check bookings table
          const { data: bookings } = await supabase
            .from('bookings')
            .select('start_time, end_time')
            .eq('pitch_id', pitch.id)
            .eq('booking_date', selectedDate)
            .in('status', ['confirmed', 'pending']);

          const isBooked = bookings?.some((booking) => {
            const bookingStart = booking.start_time.substring(0, 5);
            const bookingEnd = booking.end_time.substring(0, 5);
            return slotStartTime < bookingEnd && slotEndTime > bookingStart;
          });

          isAvailable = !isBooked;
          console.log(`⚠️ Slot ${slotStartTime}-${slotEndTime}: ${isAvailable ? 'Available' : 'Occupied'} (fallback to bookings)`);
        }

        slots.push({
          start: slotStart,
          end: slotEnd,
          available: isAvailable,
        });

        currentHour++;
      }

      console.log('✅ Generated slots:', slots.length);
      setTimeSlots(slots);
    } catch (error) {
      console.error('Error generating time slots:', error);
    } finally {
      setLoading(false);
    }
  };

  // Legacy method (fallback if pitch_slots doesn't exist)
  const generateTimeSlotsLegacy = async () => {
    try {
      const [startHour] = pitch.start_time.split(':').map(Number);
      const [endHour] = pitch.end_time.split(':').map(Number);
      const selectedDate = format(date, 'yyyy-MM-dd');

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('start_time, end_time')
        .eq('pitch_id', pitch.id)
        .eq('booking_date', selectedDate)
        .in('status', ['confirmed', 'pending']);

      if (error) throw error;

      const now = new Date();
      const uzbekistanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tashkent' }));
      const currentHourUZ = uzbekistanTime.getHours();
      const todayDateUZ = format(uzbekistanTime, 'yyyy-MM-dd');
      const isToday = selectedDate === todayDateUZ;

      const slots: TimeSlot[] = [];
      let currentHour = startHour;

      while (currentHour < endHour) {
        if (isToday && currentHour <= currentHourUZ) {
          currentHour++;
          continue;
        }

        const slotStart = setMinutes(setHours(date, currentHour), 0);
        const slotEnd = setMinutes(setHours(date, currentHour + 1), 0);
        const slotStartTime = format(slotStart, 'HH:mm');
        const slotEndTime = format(slotEnd, 'HH:mm');

        const isBooked = bookings?.some((booking) => {
          const bookingStart = booking.start_time.substring(0, 5);
          const bookingEnd = booking.end_time.substring(0, 5);
          return slotStartTime < bookingEnd && slotEndTime > bookingStart;
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
      console.error('Error in legacy method:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotClick = (index: number) => {
    if (!timeSlots[index].available) return;

    if (selectedStartIndex === null) {
      // First click - select start
      setSelectedStartIndex(index);
      setSelectedEndIndex(index);
    } else if (selectedStartIndex === index) {
      // Click on same slot - deselect
      setSelectedStartIndex(null);
      setSelectedEndIndex(null);
    } else if (index > selectedStartIndex) {
      // Extend selection forward
      // Check if all slots in range are available
      const allAvailable = timeSlots
        .slice(selectedStartIndex, index + 1)
        .every(slot => slot.available);
      
      if (allAvailable) {
        setSelectedEndIndex(index);
      }
    } else {
      // Click before start - reset and start new selection
      setSelectedStartIndex(index);
      setSelectedEndIndex(index);
    }
  };

  const handleConfirm = () => {
    if (selectedStartIndex !== null && selectedEndIndex !== null) {
      const start = timeSlots[selectedStartIndex].start;
      const end = timeSlots[selectedEndIndex].end;
      onSelectSlot({ start, end });
    }
  };

  const isSlotSelected = (index: number) => {
    if (selectedStartIndex === null || selectedEndIndex === null) return false;
    return index >= selectedStartIndex && index <= selectedEndIndex;
  };

  const getSelectedDuration = () => {
    if (selectedStartIndex === null || selectedEndIndex === null) return 0;
    return selectedEndIndex - selectedStartIndex + 1;
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[70] flex items-end justify-center">
      <div className="bg-zinc-900 w-full max-h-[75vh] rounded-t-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-4 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Vaqtni tanlang</h3>
            <p className="text-sm text-zinc-400">
              {format(date, 'dd MMMM, EEEE')}
              {getSelectedDuration() > 0 && (
                <span className="ml-2 text-blue-400">
                  • {getSelectedDuration()} soat tanlandi
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Time Slots */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <>
              <div className="mb-3 text-sm text-zinc-400 text-center">
                Bir yoki bir nechta vaqtni tanlang
              </div>
              <div className="grid grid-cols-2 gap-2">
                {timeSlots.map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => handleSlotClick(index)}
                    disabled={!slot.available}
                    className={`py-3 px-4 rounded-lg font-medium transition-all ${
                      isSlotSelected(index)
                        ? 'bg-blue-600 text-white border-2 border-blue-400 scale-95'
                        : slot.available
                        ? 'bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700'
                        : 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                    }`}
                  >
                    {format(slot.start, 'HH:mm')} - {format(slot.end, 'HH:mm')}
                  </button>
                ))}
              </div>
            </>
          )}

          {!loading && timeSlots.length === 0 && (
            <div className="text-center py-12">
              <p className="text-zinc-400">Bu kun uchun vaqt yo'q</p>
            </div>
          )}
        </div>

        {/* Confirm Button */}
        {selectedStartIndex !== null && selectedEndIndex !== null && (
          <div className="flex-shrink-0 bg-zinc-900 border-t border-zinc-800 p-4">
            <button
              onClick={handleConfirm}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-4 rounded-lg transition-colors"
            >
              Tasdiqlash • {format(timeSlots[selectedStartIndex].start, 'HH:mm')} - {format(timeSlots[selectedEndIndex].end, 'HH:mm')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
