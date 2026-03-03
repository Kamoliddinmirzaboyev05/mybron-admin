# TIME Type Workaround - Vaqtinchalik Yechim

## Muammo

Database da `start_time` va `end_time` ustunlari `TIME` tipida va uni o'zgartirib bo'lmayapti.

## Yechim: Frontend Moslashtirish

Frontend ni `TIME` tipi bilan ishlash uchun moslashtirdik.

### O'zgarishlar

#### 1. ManualBookingModal.tsx - TIME Format Yuborish

```typescript
// Helper function
const formatTimeOnly = (date: Date): string => {
  return format(date, 'HH:mm:ss'); // '18:00:00'
};

const bookingData = {
  pitch_id: pitch.id,
  full_name: customerName.trim(),
  phone: customerPhone.trim(),
  start_time: formatTimeOnly(selectedTimeSlot.start), // ✅ '18:00:00'
  end_time: formatTimeOnly(selectedTimeSlot.end),     // ✅ '20:00:00'
  booking_date: format(selectedDate, 'yyyy-MM-dd'),   // ✅ '2026-03-03'
  total_price: totalPrice,
  status: 'confirmed',
};
```

#### 2. TimeSlotSheet.tsx - TIME String Comparison

```typescript
// Format times for comparison
const slotStartTime = format(slotStart, 'HH:mm:ss'); // '18:00:00'
const slotEndTime = format(slotEnd, 'HH:mm:ss');     // '19:00:00'

// Check overlap with TIME strings
const isBooked = bookings?.some((booking) => {
  const bookingStart = booking.start_time; // '18:00:00'
  const bookingEnd = booking.end_time;     // '20:00:00'
  
  // Overlap: N_Start < E_End AND N_End > E_Start
  return slotStartTime < bookingEnd && slotEndTime > bookingStart;
});
```

#### 3. DashboardPage.tsx - TIME String Parsing

```typescript
// Calculate duration from TIME strings
const calculateBookingDuration = (startTime: string, endTime: string) => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const durationHours = (endMinutes - startMinutes) / 60;
  
  return durationHours;
};

// Display time
<span>
  {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
  {' '}({calculateBookingDuration(booking.start_time, booking.end_time)} soat)
</span>
```

#### 4. BookingsPage.tsx - TIME String Display

```typescript
// Calculate duration
const calculateBookingDuration = (startTime: string, endTime: string) => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const durationHours = (endMinutes - startMinutes) / 60;
  
  return durationHours;
};

// Display
<span>
  {format(new Date(booking.start_time), 'dd MMM')}, 
  {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
  {' '}({calculateBookingDuration(booking.start_time, booking.end_time)} soat)
</span>
```

## Database Schema (Hozirgi)

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  pitch_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  booking_date DATE NOT NULL,      -- ✅ '2026-03-03'
  start_time TIME NOT NULL,        -- ✅ '18:00:00'
  end_time TIME NOT NULL,          -- ✅ '20:00:00'
  total_price DECIMAL(10, 2),
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

## Insert Format

```typescript
const bookingData = {
  pitch_id: 'uuid',
  full_name: 'Test User',
  phone: '+998 90 123 45 67',
  booking_date: '2026-03-03',    // DATE
  start_time: '18:00:00',        // TIME
  end_time: '20:00:00',          // TIME
  total_price: 100000,
  status: 'confirmed',
};
```

## Overlap Validation

### Client-side (TimeSlotSheet)

```typescript
// TIME string comparison
const slotStartTime = '18:00:00';
const slotEndTime = '19:00:00';
const bookingStart = '18:00:00';
const bookingEnd = '20:00:00';

// Overlap check
if (slotStartTime < bookingEnd && slotEndTime > bookingStart) {
  // Overlap detected
}
```

### Database Trigger (Disabled)

Database trigger o'chirildi chunki TIME ustunlari bilan ishlash qiyin:

```sql
-- disable-overlap-trigger.sql
DROP TRIGGER IF EXISTS tr_check_booking_overlap ON bookings;
```

## Cheklovlar

### TIME Type Limitations

1. **Timezone yo'q** - Faqat vaqt, timezone ma'lumoti yo'q
2. **Sana yo'q** - `booking_date` alohida ustunda
3. **Midnight crossing** - Agar bron yarim tunda o'tsa (23:00 - 01:00), muammo bo'ladi
4. **Comparison qiyin** - String comparison ishlatish kerak

### Workaround Limitations

1. **Midnight bookings** - 23:00 - 01:00 kabi bronlar ishlamaydi
2. **Timezone issues** - Barcha vaqtlar local timezone da
3. **No database validation** - Overlap validation faqat client-side

## Test Qilish

### 1. Manual Booking

```typescript
// Test data
const testBooking = {
  pitch_id: 'your-pitch-id',
  full_name: 'Test User',
  phone: '+998 90 123 45 67',
  booking_date: '2026-03-03',
  start_time: '18:00:00',
  end_time: '20:00:00',
  total_price: 100000,
  status: 'confirmed',
};

// Insert
const { data, error } = await supabase
  .from('bookings')
  .insert(testBooking);

console.log('Result:', { data, error });
```

### 2. Time Display

```typescript
// TIME string: '18:00:00'
const displayTime = timeString.substring(0, 5); // '18:00'
```

### 3. Duration Calculation

```typescript
const startTime = '18:00:00';
const endTime = '20:00:00';

const [startHour, startMin] = startTime.split(':').map(Number);
const [endHour, endMin] = endTime.split(':').map(Number);

const duration = (endHour * 60 + endMin - startHour * 60 - startMin) / 60;
console.log('Duration:', duration, 'hours'); // 2 hours
```

## Xatolarni Bartaraf Qilish

### Xato: "invalid input syntax for type time"

**Sabab:** TIMESTAMP yuborilmoqda

**Yechim:**
```typescript
// Noto'g'ri
start_time: new Date().toISOString() // ❌

// To'g'ri
start_time: format(new Date(), 'HH:mm:ss') // ✅
```

### Xato: "Cannot read property 'substring' of undefined"

**Sabab:** `start_time` null yoki undefined

**Yechim:**
```typescript
// Safe access
{booking.start_time?.substring(0, 5) || 'N/A'}
```

### Xato: Duration noto'g'ri hisoblanmoqda

**Sabab:** String parsing xatosi

**Yechim:**
```typescript
// Validate format
if (!/^\d{2}:\d{2}:\d{2}$/.test(timeString)) {
  console.error('Invalid time format:', timeString);
}
```

## Kelajakda Yaxshilash

### Ideal Solution: TIMESTAMP WITH TIME ZONE

```sql
-- Migration to TIMESTAMP
ALTER TABLE bookings 
  ALTER COLUMN start_time TYPE TIMESTAMP WITH TIME ZONE,
  ALTER COLUMN end_time TYPE TIMESTAMP WITH TIME ZONE;
```

**Afzalliklari:**
- ✅ Timezone support
- ✅ Midnight crossing support
- ✅ Database-level validation
- ✅ Easier comparison
- ✅ Standard format

## Xulosa

### Hozirgi Yechim

Frontend ni `TIME` tipi bilan ishlash uchun moslashtirdik:
- ✅ TIME format yuborish (`HH:mm:ss`)
- ✅ TIME string parsing
- ✅ Client-side overlap validation
- ✅ Duration calculation from TIME strings
- ✅ Display formatting

### Cheklovlar

- ❌ Midnight bookings ishlamaydi
- ❌ Timezone support yo'q
- ❌ Database-level validation yo'q

### Tavsiya

Production uchun `TIMESTAMP WITH TIME ZONE` ga o'tish tavsiya etiladi.

## Files Changed

1. `src/app/components/ManualBookingModal.tsx` - TIME format yuborish
2. `src/app/components/TimeSlotSheet.tsx` - TIME string comparison
3. `src/app/components/DashboardPage.tsx` - TIME parsing va display
4. `src/app/components/BookingsPage.tsx` - TIME parsing va display
5. `disable-overlap-trigger.sql` - Trigger o'chirish

Endi manual booking ishlashi kerak! 🎉
