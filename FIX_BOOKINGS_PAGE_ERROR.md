# Fix BookingsPage RangeError - Invalid Time Value

## Muammo

**Xato:** `Uncaught RangeError: Invalid time value`

**Joyi:** BookingsPage.tsx

**Sabab:** `start_time` va `end_time` endi oddiy TIME string (`'15:00:00'`), lekin kod ularni `new Date()` ga o'tkazmoqda.

## Xato Kodi

```typescript
// ❌ Noto'g'ri - TIME string ni Date ga aylantirish mumkin emas
<span>
  {format(new Date(booking.start_time), 'dd MMM')}, 
  {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
</span>
```

**Muammo:**
- `booking.start_time` = `'15:00:00'` (TIME string)
- `new Date('15:00:00')` = Invalid Date
- `format(Invalid Date, 'dd MMM')` = RangeError

## Yechim

### BookingsPage.tsx

**To'g'ri kod:**
```typescript
// ✅ To'g'ri - booking_date dan sana olish
<span>
  {booking.booking_date ? format(new Date(booking.booking_date), 'dd MMM') : 'N/A'}, 
  {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
  {' '}({calculateBookingDuration(booking.start_time, booking.end_time)} soat)
</span>
```

**O'zgarishlar:**
1. ✅ `new Date(booking.start_time)` → `new Date(booking.booking_date)`
2. ✅ Sana uchun `booking_date` ishlatish
3. ✅ Vaqt uchun `start_time.substring(0, 5)` ishlatish

## Database Schema

### Bookings Table

```sql
CREATE TABLE bookings (
  id UUID,
  pitch_id UUID,
  full_name TEXT,
  phone TEXT,
  
  -- Date/Time columns
  booking_date DATE,           -- ✅ '2026-03-03' (sana uchun)
  start_time TIME,             -- ✅ '15:00:00' (vaqt uchun)
  end_time TIME,               -- ✅ '17:00:00' (vaqt uchun)
  
  total_price DECIMAL(10, 2),
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

## To'g'ri Ishlatish

### 1. Sana Ko'rsatish

```typescript
// ✅ booking_date dan
{booking.booking_date ? format(new Date(booking.booking_date), 'dd MMM') : 'N/A'}

// Natija: "03 Mar"
```

### 2. Vaqt Ko'rsatish

```typescript
// ✅ TIME string dan
{booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}

// Natija: "15:00 - 17:00"
```

### 3. To'liq Sana va Vaqt

Agar to'liq timestamp kerak bo'lsa:

```typescript
// Combine date and time
const fullStartTime = new Date(`${booking.booking_date}T${booking.start_time}`);
const fullEndTime = new Date(`${booking.booking_date}T${booking.end_time}`);

// Format
{format(fullStartTime, 'dd MMM, HH:mm')} - {format(fullEndTime, 'HH:mm')}

// Natija: "03 Mar, 15:00 - 17:00"
```

### 4. Duration Calculation

```typescript
const calculateBookingDuration = (startTime: string, endTime: string) => {
  // Parse TIME strings (HH:mm:ss)
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const durationHours = (endMinutes - startMinutes) / 60;
  
  return durationHours;
};

// Usage
{calculateBookingDuration(booking.start_time, booking.end_time)} soat
```

## Barcha Komponentlar

### ✅ ManualBookingModal.tsx

```typescript
// Insert data
const bookingData = {
  booking_date: format(selectedDate, 'yyyy-MM-dd'),
  start_time: format(selectedTimeSlot.start, 'HH:mm:ss'),
  end_time: format(selectedTimeSlot.end, 'HH:mm:ss'),
  // ...
};
```

### ✅ TimeSlotSheet.tsx

```typescript
// Fetch bookings
.eq('booking_date', format(date, 'yyyy-MM-dd'))

// Compare times
const slotStartTime = format(slotStart, 'HH:mm:ss');
const slotEndTime = format(slotEnd, 'HH:mm:ss');
```

### ✅ DashboardPage.tsx

```typescript
// Display time
{booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}

// Calculate duration
const [startHour, startMin] = booking.start_time.split(':').map(Number);
```

### ✅ BookingsPage.tsx

```typescript
// Display date and time
{booking.booking_date ? format(new Date(booking.booking_date), 'dd MMM') : 'N/A'}, 
{booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
```

## Xatolarni Bartaraf Qilish

### Xato: "Invalid time value"

**Sabab:** TIME string ni `new Date()` ga o'tkazmoqda

**Yechim:**
```typescript
// Noto'g'ri ❌
new Date(booking.start_time) // '15:00:00' → Invalid Date

// To'g'ri ✅
new Date(booking.booking_date) // '2026-03-03' → Valid Date
```

### Xato: "Cannot read property 'substring' of undefined"

**Sabab:** `start_time` yoki `end_time` null

**Yechim:**
```typescript
// Safe access
{booking.start_time?.substring(0, 5) || 'N/A'}
{booking.end_time?.substring(0, 5) || 'N/A'}
```

### Xato: "Invalid Date" in console

**Sabab:** Date format noto'g'ri

**Yechim:**
```typescript
// Validate before using
if (booking.booking_date && !isNaN(new Date(booking.booking_date).getTime())) {
  // Valid date
  format(new Date(booking.booking_date), 'dd MMM')
} else {
  'N/A'
}
```

## Test Qilish

### 1. Display Test

```typescript
// Sample booking
const booking = {
  booking_date: '2026-03-03',
  start_time: '15:00:00',
  end_time: '17:00:00',
};

// Display
console.log(format(new Date(booking.booking_date), 'dd MMM')); // "03 Mar"
console.log(booking.start_time.substring(0, 5)); // "15:00"
console.log(booking.end_time.substring(0, 5)); // "17:00"
```

### 2. Duration Test

```typescript
const duration = calculateBookingDuration('15:00:00', '17:00:00');
console.log(duration); // 2
```

### 3. Full Timestamp Test

```typescript
const fullTime = new Date(`${booking.booking_date}T${booking.start_time}`);
console.log(fullTime); // 2026-03-03T15:00:00
console.log(format(fullTime, 'dd MMM, HH:mm')); // "03 Mar, 15:00"
```

## Best Practices

### 1. Always Use booking_date for Date Display

```typescript
// ✅ Good
{format(new Date(booking.booking_date), 'dd MMM')}

// ❌ Bad
{format(new Date(booking.start_time), 'dd MMM')}
```

### 2. Use substring() for Time Display

```typescript
// ✅ Good
{booking.start_time.substring(0, 5)}

// ❌ Bad
{format(new Date(booking.start_time), 'HH:mm')}
```

### 3. Combine for Full Timestamp

```typescript
// ✅ Good
const fullTime = new Date(`${booking.booking_date}T${booking.start_time}`);

// ❌ Bad
const fullTime = new Date(booking.start_time);
```

### 4. Safe Access with Optional Chaining

```typescript
// ✅ Good
{booking.start_time?.substring(0, 5) || 'N/A'}

// ❌ Bad
{booking.start_time.substring(0, 5)}
```

## Summary

### Muammo
TIME string ni `new Date()` ga o'tkazish Invalid Date yaratadi.

### Yechim
- Sana uchun: `booking_date` ishlatish
- Vaqt uchun: `start_time.substring(0, 5)` ishlatish
- To'liq timestamp uchun: Combine `booking_date` + `start_time`

### O'zgarishlar
- ✅ BookingsPage.tsx - `new Date(booking.booking_date)` ishlatish
- ✅ Safe access bilan null check
- ✅ Duration calculation TIME string dan

### Natija
- ✅ RangeError hal qilindi
- ✅ Sana va vaqt to'g'ri ko'rsatiladi
- ✅ Duration to'g'ri hisoblanadi
- ✅ Barcha komponentlar ishlaydi

## Files Changed

1. `src/app/components/BookingsPage.tsx` - Date display fix
2. `FIX_BOOKINGS_PAGE_ERROR.md` - Ushbu hujjat

Endi BookingsPage xatosiz ishlashi kerak! 🎉
