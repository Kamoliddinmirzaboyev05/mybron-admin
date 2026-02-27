import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, ChevronDown, Loader2 } from 'lucide-react';
import { format, addDays, startOfDay, endOfDay, setHours, setMinutes } from 'date-fns';
import TimeSlotSheet from './TimeSlotSheet';

interface Pitch {
  id: string;
  name: string;
  price: number;
  working_hours_start: string;
  working_hours_end: string;
}

interface ManualBookingModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ManualBookingModal({ onClose, onSuccess }: ManualBookingModalProps) {
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [selectedPitch, setSelectedPitch] = useState<Pitch | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPitchDropdown, setShowPitchDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showTimeSheet, setShowTimeSheet] = useState(false);

  const dateOptions = [
    { label: 'Bugun', date: new Date() },
    { label: 'Ertaga', date: addDays(new Date(), 1) },
    { label: format(addDays(new Date(), 2), 'dd MMMM'), date: addDays(new Date(), 2) },
  ];

  useEffect(() => {
    fetchPitches();
  }, []);

  const fetchPitches = async () => {
    try {
      const { data, error } = await supabase
        .from('pitches')
        .select('*')
        .order('name');

      if (error) throw error;
      setPitches(data || []);
    } catch (error) {
      console.error('Error fetching pitches:', error);
    }
  };

  const handleBook = async () => {
    if (!selectedPitch || !selectedDate || !selectedTimeSlot || !customerName || !customerPhone) {
      alert('Iltimos barcha maydonlarni to\'ldiring');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('bookings').insert({
        pitch_id: selectedPitch.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        start_time: selectedTimeSlot.start.toISOString(),
        end_time: selectedTimeSlot.end.toISOString(),
        status: 'confirmed',
      });

      if (error) throw error;

      onSuccess();
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-zinc-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-4 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Qo'lda band qilish</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Step 1: Select Pitch */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              1. Maydonni tanlash
            </label>
            <button
              onClick={() => setShowPitchDropdown(!showPitchDropdown)}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-left flex items-center justify-between text-white"
            >
              <span>{selectedPitch ? selectedPitch.name : 'Maydonni tanlang'}</span>
              <ChevronDown className="w-5 h-5" />
            </button>
            {showPitchDropdown && (
              <div className="mt-2 bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden">
                {pitches.map((pitch) => (
                  <button
                    key={pitch.id}
                    onClick={() => {
                      setSelectedPitch(pitch);
                      setShowPitchDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-left text-white hover:bg-zinc-700 transition-colors"
                  >
                    {pitch.name} - {pitch.price.toLocaleString()} so'm/soat
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Select Date */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              2. Sanani belgilash
            </label>
            <button
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-left flex items-center justify-between text-white"
            >
              <span>
                {selectedDate
                  ? dateOptions.find((d) => d.date.toDateString() === selectedDate.toDateString())?.label
                  : 'Sanani tanlang'}
              </span>
              <ChevronDown className="w-5 h-5" />
            </button>
            {showDateDropdown && (
              <div className="mt-2 bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden">
                {dateOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedDate(option.date);
                      setShowDateDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-left text-white hover:bg-zinc-700 transition-colors"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 3: Select Time */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              3. Vaqtni belgilash
            </label>
            <button
              onClick={() => {
                if (selectedPitch && selectedDate) {
                  setShowTimeSheet(true);
                } else {
                  alert('Avval maydon va sanani tanlang');
                }
              }}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-left flex items-center justify-between text-white"
            >
              <span>
                {selectedTimeSlot
                  ? `${format(selectedTimeSlot.start, 'HH:mm')} - ${format(selectedTimeSlot.end, 'HH:mm')}`
                  : 'Vaqtni tanlang'}
              </span>
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Customer Details */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Mijoz ismi
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Ism familiya"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Telefon raqami
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="+998 90 123 45 67"
              />
            </div>
          </div>

          {/* Book Button */}
          <button
            onClick={handleBook}
            disabled={loading || !selectedPitch || !selectedDate || !selectedTimeSlot || !customerName || !customerPhone}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-semibold py-4 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Band qilinmoqda...
              </>
            ) : (
              'Band qilish'
            )}
          </button>
        </div>
      </div>

      {/* Time Slot Bottom Sheet */}
      {showTimeSheet && selectedPitch && selectedDate && (
        <TimeSlotSheet
          pitch={selectedPitch}
          date={selectedDate}
          onSelectSlot={(slot) => {
            setSelectedTimeSlot(slot);
            setShowTimeSheet(false);
          }}
          onClose={() => setShowTimeSheet(false)}
        />
      )}
    </div>
  );
}
