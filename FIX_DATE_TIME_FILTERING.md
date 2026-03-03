# Date/Time Filtering Fix - 400 Bad Request (22007)

## Muammo

**Xato:** 400 Bad Request (22007)

**Sabab:** Frontend to'liq ISO Date string yubormoqda, lekin database `booking_date` (DATE) va `start_time`/`end_time` (TIMESTAMP) ustunlarini kutmoqda.

**Noto'g'ri:**
```typescript
.gte('start_time', new Date().toISOString()) // ❌ "2026-03-03T12:00:00.000Z"
```

**To'g'ri:**
```typescript
.eq('booking_date', '2026-03-03') // ✅ DATE format
```

## Yechim

### 1. Database Schema

`booking_date` ustuni qo'shildi va avtomatik to'ldiriladi:

```sql
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS booking_date DATE;

-- Trigger avtomatik to'ldiradi
CREATE OR REPLACE FUNCTION check_booking_overlap()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically set booking_date from start_time
  NEW.booking_date := DATE(NEW.start_time);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 2. DashboardPage.tsx

**Oldingi kod (noto'g'ri):**
```typescript
const startOfToday = startOfDay(today).toISOString();
const endOfToday = endOfDay(today).toISOString();

const { data, error } = await supabase
  .from('bookings')
  .select('...')
  .gte('start_time', startOfToday)  // ❌ ISO string
  .order('start_time', { ascending: true });
```

**Yangi kod (to'g'ri):**
```typescript
const todayDate = format(today, 'yyyy-MM-dd'); // '2026-03-03'

const { data, error } = await supabase
  .from('bookings')
  .select('...')
  .eq('booking_date', todayDate)  // ✅ DATE format
  .order('start_time', { ascending: true });
```

### 3. TimeSlotSheet.tsx

**Oldingi kod (noto'g'ri):**
```typescript
const startOfSelectedDay = startOfDay(date).toISOString();
const endOfSelectedDay = endOfDay(date).toISOString();

const { data: bookings, error } = await supabase
  .from('bookings')
  .select('start_time, end_time')
  .eq('pitch_id', pitch.id)
  .in('status', ['confirmed', 'manual'])
  .gte('start_time', startOfSelectedDay)  // ❌ ISO string
  .lte('start_time', endOfSelectedDay);   // ❌ ISO string
```

**Yangi kod (to'g'ri):**
```typescript
const selectedDate = format(date, 'yyyy-MM-dd'); // '2026-03-03'

const { data: bookings, error } = await supabase
  .from('bookings')
  .select('start_time, end_time')
  .eq('pitch_id', pitch.id)
  .eq('booking_date', selectedDate)  // ✅ DATE format
  .in('status', ['confirmed', 'manual']);
```

### 4. ManualBookingModal.tsx

**To'g'ri format:**
```typescript
const bookingData = {
  pitch_id: pitch.id,
  customer_name: customerName.trim(),
  customer_phone: customerPhone.trim(),
  start_time: selectedTimeSlot.start.toISOString(), // TIMESTAMP
  end_time: selectedTimeSlot.end.toISOString(),     // TIMESTAMP
  booking_date: format(selectedDate, 'yyyy-MM-dd'), // DATE ✅
  total_price: totalPrice,
  status: 'confirmed',
};
```

## Database Ustunlar

### Bookings Table

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  pitch_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  
  -- Date/Time columns
  booking_date DATE,              -- '2026-03-03' ✅
  start_time TIMESTAMP WITH TIME ZONE,  -- '2026-03-03T18:00:00+05:00' ✅
  end_time TIMESTAMP WITH TIME ZONE,    -- '2026-03-03T20:00:00+05:00' ✅
  
  total_price DECIMAL(10, 2),
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

### Index

```sql
CREATE INDEX idx_bookings_booking_date ON bookings(booking_date);
```

## Format Konversiyalari

### Date-fns bilan

```typescript
import { format } from 'date-fns';

// DATE format (YYYY-MM-DD)
const dateStr = format(new Date(), 'yyyy-MM-dd');
// Result: '2026-03-03'

// TIME format (HH:mm:ss)
const timeStr = format(new Date(), 'HH:mm:ss');
// Result: '18:00:00'

// TIMESTAMP format (ISO)
const timestampStr = new Date().toISOString();
// Result: '2026-03-03T18:00:00.000Z'
```

### Native JS bilan

```typescript
// DATE format
const dateStr = new Date().toISOString().split('T')[0];
// Result: '2026-03-03'

// TIME format
const timeStr = new Date().toTimeString().split(' ')[0];
// Result: '18:00:00'
```

## Filter Qoidalari

### ✅ To'g'ri

```typescript
// 1. booking_date bilan filter
.eq('booking_date', '2026-03-03')

// 2. booking_date range
.gte('booking_date', '2026-03-01')
.lte('booking_date', '2026-03-31')

// 3. start_time bilan sort
.order('start_time', { ascending: true })
```

### ❌ Noto'g'ri

```typescript
// 1. ISO string bilan filter
.gte('start_time', new Date().toISOString())

// 2. Date object bilan filter
.eq('booking_date', new Date())

// 3. TIME ustuniga TIMESTAMP yuborish
.eq('start_time', '2026-03-03T18:00:00Z')
```

## Migration

### 1. Database Migration

```bash
# Supabase SQL Editor da:
psql -f fix-booking-time-columns.sql
```

### 2. Mavjud Ma'lumotlarni Yangilash

```sql
-- booking_date ni to'ldirish
UPDATE bookings 
SET booking_date = DATE(start_time)
WHERE booking_date IS NULL;
```

### 3. Frontend Deploy

```bash
# Yangi kod deploy qiling
npm run build
# yoki
yarn build
```

## Test Qilish

### 1. Bugungi Bronlarni Ko'rish

```typescript
// DashboardPage.tsx
const todayDate = format(new Date(), 'yyyy-MM-dd');
const { data } = await supabase
  .from('bookings')
  .eq('booking_date', todayDate);

console.log('Today bookings:', data);
```

### 2. Vaqt Slotlarini Olish

```typescript
// TimeSlotSheet.tsx
const selectedDate = format(date, 'yyyy-MM-dd');
const { data } = await supabase
  .from('bookings')
  .eq('pitch_id', pitchId)
  .eq('booking_date', selectedDate);

console.log('Bookings for date:', data);
```

### 3. Yangi Bron Yaratish

```typescript
// ManualBookingModal.tsx
const bookingData = {
  booking_date: format(selectedDate, 'yyyy-MM-dd'),
  start_time: selectedTimeSlot.start.toISOString(),
  end_time: selectedTimeSlot.end.toISOString(),
  // ...
};

const { error } = await supabase
  .from('bookings')
  .insert(bookingData);

if (!error) {
  console.log('Booking created successfully');
}
```

## Xatolarni Bartaraf Qilish

### Xato: "invalid input syntax for type date"

**Sabab:** Date formatida xato

**Yechim:**
```typescript
// Noto'g'ri
.eq('booking_date', new Date())

// To'g'ri
.eq('booking_date', format(new Date(), 'yyyy-MM-dd'))
```

### Xato: "column booking_date does not exist"

**Sabab:** Migration ishga tushmagan

**Yechim:**
```sql
-- SQL Editor da
ALTER TABLE bookings ADD COLUMN booking_date DATE;
UPDATE bookings SET booking_date = DATE(start_time);
```

### Xato: "operator does not exist: timestamp with time zone >= text"

**Sabab:** TIMESTAMP ustuniga DATE string yuborilmoqda

**Yechim:**
```typescript
// Noto'g'ri
.gte('start_time', '2026-03-03')

// To'g'ri
.eq('booking_date', '2026-03-03')
```

## Xulosa

### O'zgarishlar

1. ✅ `booking_date` ustuni qo'shildi
2. ✅ DashboardPage: `.eq('booking_date', todayDate)`
3. ✅ TimeSlotSheet: `.eq('booking_date', selectedDate)`
4. ✅ ManualBookingModal: `booking_date` yuboriladi
5. ✅ Database trigger avtomatik `booking_date` ni to'ldiradi

### Foydalanish

- **Filter:** `booking_date` (DATE format)
- **Sort:** `start_time` (TIMESTAMP)
- **Display:** `format(start_time, 'HH:mm')`

### Natija

- ✅ 400 Bad Request xatosi hal qilindi
- ✅ To'g'ri date/time filtering
- ✅ Tezroq query (index bilan)
- ✅ Aniq va tushunarli kod
