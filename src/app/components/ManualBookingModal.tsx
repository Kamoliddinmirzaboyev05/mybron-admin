import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { X, ChevronDown, Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import TimeSlotSheet from './TimeSlotSheet';
import Toast from './Toast';
import { toast as hotToast } from 'react-hot-toast';

interface Pitch {
  id: string;
  name: string;
  price_per_hour: number;
  start_time: string;
  end_time: string;
}

interface ManualBookingModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ManualBookingModal({ onClose, onSuccess }: ManualBookingModalProps) {
  const { user } = useAuth();
  const [pitch, setPitch] = useState<Pitch | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showTimeSheet, setShowTimeSheet] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const dateOptions = [
    { label: 'Bugun', date: new Date() },
    { label: 'Ertaga', date: addDays(new Date(), 1) },
    { label: format(addDays(new Date(), 2), 'dd MMMM'), date: addDays(new Date(), 2) },
  ];

  useEffect(() => {
    fetchUserPitch();
  }, [user]);

  const fetchUserPitch = async () => {
    if (!user) return;

    try {
      // Get pitch by owner_id
      const { data, error } = await supabase
        .from('pitches')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (error) {
        // If no pitch found, try to get any pitch (for testing)
        const { data: anyPitch, error: anyError } = await supabase
          .from('pitches')
          .select('*')
          .limit(1)
          .single();

        if (anyError) {
          console.error('Error fetching pitch:', anyError);
          setToast({ 
            message: 'Maydon topilmadi. Iltimos avval maydon yarating', 
            type: 'error' 
          });
          return;
        }
        
        setPitch(anyPitch);
        return;
      }
      
      setPitch(data);
    } catch (error) {
      console.error('Error fetching pitch:', error);
    }
  };

  const calculateDuration = () => {
    if (!selectedTimeSlot) return 0;
    const diffMs = selectedTimeSlot.end.getTime() - selectedTimeSlot.start.getTime();
    return diffMs / (1000 * 60 * 60); // Convert to hours
  };

  const calculateTotalPrice = () => {
    if (!pitch || !selectedTimeSlot) return 0;
    const duration = calculateDuration();
    return duration * pitch.price_per_hour;
  };

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // If starts with 998, keep it; otherwise add it
    let formatted = '';
    
    if (digits.length === 0) {
      return '';
    }
    
    // Always start with +998
    formatted = '+998';
    
    // Get the remaining digits after 998
    let remaining = digits;
    if (digits.startsWith('998')) {
      remaining = digits.slice(3);
    } else if (digits.startsWith('998')) {
      remaining = digits.slice(3);
    } else {
      remaining = digits;
    }
    
    // Format: +998 XX XXX XX XX
    if (remaining.length > 0) {
      formatted += ' ' + remaining.slice(0, 2);
    }
    if (remaining.length > 2) {
      formatted += ' ' + remaining.slice(2, 5);
    }
    if (remaining.length > 5) {
      formatted += ' ' + remaining.slice(5, 7);
    }
    if (remaining.length > 7) {
      formatted += ' ' + remaining.slice(7, 9);
    }
    
    return formatted;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const formatted = formatPhoneNumber(input);
    setCustomerPhone(formatted);
  };

  const handleBook = async () => {
    // Validate all required fields
    if (!pitch || !selectedDate || !selectedTimeSlot || !customerName.trim() || !customerPhone.trim()) {
      setToast({ message: 'Iltimos barcha maydonlarni to\'ldiring', type: 'error' });
      return;
    }

    // Validate phone number format (basic validation)
    const phoneDigits = customerPhone.replace(/\D/g, '');
    if (phoneDigits.length !== 12 || !phoneDigits.startsWith('998')) {
      setToast({ message: 'Telefon raqami to\'liq emas (12 raqam kerak)', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      // Calculate duration and total price
      const duration = calculateDuration();
      const totalPrice = calculateTotalPrice();

      // Format time as HH:mm:ss for TIME columns
      const formatTimeOnly = (date: Date): string => {
        return format(date, 'HH:mm:ss');
      };

      // Prepare booking data with correct column names and types
      const bookingData = {
        pitch_id: pitch.id,
        full_name: customerName.trim(),
        phone: customerPhone.trim(),
        start_time: formatTimeOnly(selectedTimeSlot.start), // TIME format: '18:00:00'
        end_time: formatTimeOnly(selectedTimeSlot.end),     // TIME format: '20:00:00'
        booking_date: format(selectedDate, 'yyyy-MM-dd'),   // DATE format: '2026-03-03'
        total_price: totalPrice,
        status: 'manual', // Changed from 'confirmed' to 'manual' to distinguish manual bookings
      };

      console.log('📝 CREATING MANUAL BOOKING:');
      console.log('Selected date object:', selectedDate);
      console.log('Formatted booking_date:', bookingData.booking_date);
      console.log('Start time:', bookingData.start_time);
      console.log('End time:', bookingData.end_time);
      console.log('Total price:', bookingData.total_price);
      console.log('Full booking data:', bookingData);

      // Insert booking - database trigger will check for overlaps
      const { error } = await supabase.from('bookings').insert(bookingData);

      if (error) {
        // Check if it's an overlap error from the trigger
        if (error.message.includes('allaqachon bron mavjud') || 
            error.message.includes('overlap')) {
          setToast({ 
            message: 'Ushbu vaqt oralig\'ida allaqachon bron mavjud!', 
            type: 'error' 
          });
        } else {
          throw error;
        }
        setLoading(false);
        return;
      }

      // Success - show toast and close modal
      setToast({ message: 'Bron muvaffaqiyatli saqlandi!', type: 'success' });
      hotToast.success('Muvaffaqiyatli band qilindi!', {
        icon: '🎉',
      });
      
      // Wait a bit for toast to show, then close and refresh
      setTimeout(() => {
        onSuccess();
      }, 1000);

    } catch (error: any) {
      console.error('Error creating booking:', error);
      setToast({ 
        message: error.message || 'Xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-zinc-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 bg-zinc-900 border-b border-zinc-800 px-4 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Qo'lda band qilish</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Step 1: Select Date */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              1. Sanani belgilash
            </label>
            <button
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-left flex items-center justify-between text-white hover:bg-zinc-750 transition-colors"
            >
              <span className={selectedDate ? 'text-white' : 'text-zinc-500'}>
                {selectedDate
                  ? dateOptions.find((d) => d.date.toDateString() === selectedDate.toDateString())?.label || format(selectedDate, 'dd MMMM')
                  : 'Sanani tanlang'}
              </span>
              <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${showDateDropdown ? 'rotate-180' : ''}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-200 ease-in-out ${showDateDropdown ? 'max-h-48 mt-2' : 'max-h-0'}`}>
              <div className="bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden">
                {dateOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedDate(option.date);
                      setShowDateDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-left text-white hover:bg-zinc-700 transition-colors border-b border-zinc-700 last:border-b-0"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Step 2: Select Time */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              2. Vaqtni belgilash
            </label>
            <button
              onClick={() => {
                if (pitch && selectedDate) {
                  setShowTimeSheet(true);
                } else {
                  alert('Avval sanani tanlang');
                }
              }}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-left flex items-center justify-between text-white hover:bg-zinc-750 transition-colors"
            >
              <span className={selectedTimeSlot ? 'text-white' : 'text-zinc-500'}>
                {selectedTimeSlot
                  ? `${format(selectedTimeSlot.start, 'HH:mm')} - ${format(selectedTimeSlot.end, 'HH:mm')}`
                  : 'Vaqtni tanlang'}
              </span>
              <ChevronDown className="w-5 h-5" />
            </button>
            
            {/* Duration and Price Display */}
            {selectedTimeSlot && pitch && (
              <div className="mt-3 p-3 bg-blue-900/20 border border-blue-800/30 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-300">Davomiyligi:</span>
                  <span className="text-white font-semibold">{calculateDuration()} soat</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-zinc-300">Jami narx:</span>
                  <span className="text-blue-400 font-semibold">
                    {calculateTotalPrice().toLocaleString()} so'm
                  </span>
                </div>
              </div>
            )}
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
                onChange={handlePhoneChange}
                maxLength={17}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="+998 90 123 45 67"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Format: +998 XX XXX XX XX
              </p>
            </div>
          </div>
        </div>

        {/* Fixed Bottom Button */}
        <div className="flex-shrink-0 bg-zinc-900 border-t border-zinc-800 p-4 pb-safe">
          <button
            onClick={handleBook}
            disabled={loading || !pitch || !selectedDate || !selectedTimeSlot || !customerName || !customerPhone}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-semibold py-4 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saqlanmoqda...
              </>
            ) : (
              'Saqlash'
            )}
          </button>
        </div>
      </div>

      {/* Time Slot Bottom Sheet */}
      {showTimeSheet && pitch && selectedDate && (
        <TimeSlotSheet
          pitch={pitch}
          date={selectedDate}
          onSelectSlot={(slot) => {
            setSelectedTimeSlot(slot);
            setShowTimeSheet(false);
          }}
          onClose={() => setShowTimeSheet(false)}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
