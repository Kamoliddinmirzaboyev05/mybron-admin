# Column Names Fix - 400 Bad Request (PGRST204)

## Muammo

**Xato:** 400 Bad Request (PGRST204)

**Sabab:** Frontend `customer_name` va `customer_phone` yubormoqda, lekin database `full_name` va `phone` ustunlarini kutmoqda.

**Xato xabari:**
```
column "customer_name" of relation "bookings" does not exist
```

## Yechim

### 1. Database Schema O'zgarishi

**Opsiya A: Database ustunlarini rename qilish (tavsiya etiladi)**

```sql
-- rename-booking-columns.sql
ALTER TABLE bookings RENAME COLUMN customer_name TO full_name;
ALTER TABLE bookings RENAME COLUMN customer_phone TO phone;
```

**Opsiya B: Frontend ni database ga moslashtirish**

Frontend kodini `full_name` va `phone` ishlatish uchun o'zgartirish.

### 2. Frontend O'zgarishlari

#### ManualBookingModal.tsx

**Oldingi kod (noto'g'ri):**
```typescript
const bookingData = {
  pitch_id: pitch.id,
  customer_name: customerName.trim(),  // ❌
  customer_phone: customerPhone.trim(), // ❌
  start_time: selectedTimeSlot.start.toISOString(),
  end_time: selectedTimeSlot.end.toISOString(),
  booking_date: format(selectedDate, 'yyyy-MM-dd'),
  total_price: totalPrice,
  status: 'confirmed',
};
```

**Yangi kod (to'g'ri):**
```typescript
const bookingData = {
  pitch_id: pitch.id,
  full_name: customerName.trim(),      // ✅
  phone: customerPhone.trim(),         // ✅
  start_time: selectedTimeSlot.start.toISOString(),
  end_time: selectedTimeSlot.end.toISOString(),
  booking_date: format(selectedDate, 'yyyy-MM-dd'),
  total_price: totalPrice,
  status: 'confirmed',
};
```

#### DashboardPage.tsx

**Interface:**
```typescript
interface Booking {
  id: string;
  pitch_id: string;
  full_name: string;      // ✅ (was customer_name)
  phone: string;          // ✅ (was customer_phone)
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
```

**Display:**
```typescript
// Oldingi
<p>{booking.customer_name}</p>
<span>{booking.customer_phone}</span>

// Yangi
<p>{booking.full_name}</p>
<span>{booking.phone}</span>
```

#### BookingsPage.tsx

**Interface va Display:**
```typescript
interface Booking {
  full_name: string;  // ✅
  phone: string;      // ✅
  // ...
}

// Display
<p>{booking.full_name}</p>
<span>{booking.phone}</span>
```

## Database Schema

### Bookings Table (Yangi)

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  pitch_id UUID NOT NULL,
  
  -- Customer info
  full_name TEXT NOT NULL,     -- ✅ (was customer_name)
  phone TEXT NOT NULL,         -- ✅ (was customer_phone)
  
  -- Date/Time
  booking_date DATE,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  
  -- Pricing
  total_price DECIMAL(10, 2),
  
  -- Status
  status TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

## Migration

### Opsiya A: Database Rename (Tavsiya etiladi)

```bash
# Supabase SQL Editor da:
psql -f rename-booking-columns.sql
```

**Fayl: rename-booking-columns.sql**
```sql
-- Rename columns
ALTER TABLE bookings RENAME COLUMN customer_name TO full_name;
ALTER TABLE bookings RENAME COLUMN customer_phone TO phone;

-- Verify
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'bookings' 
  AND column_name IN ('full_name', 'phone');
```

### Opsiya B: Frontend O'zgartirish

Barcha komponentlarda `customer_name` → `full_name` va `customer_phone` → `phone` o'zgartirish.

## To'g'ri Column Names

### Database Columns (Bookings Table)

| Column Name | Type | Required | Description |
|------------|------|----------|-------------|
| `pitch_id` | UUID | ✅ | Pitch ID |
| `full_name` | TEXT | ✅ | Customer full name |
| `phone` | TEXT | ✅ | Customer phone |
| `booking_date` | DATE | ✅ | Booking date (YYYY-MM-DD) |
| `start_time` | TIMESTAMP | ✅ | Start time |
| `end_time` | TIMESTAMP | ✅ | End time |
| `total_price` | DECIMAL | ❌ | Total price |
| `status` | TEXT | ✅ | Status (confirmed/pending/rejected/manual) |

### Frontend Insert Object

```typescript
const bookingData = {
  pitch_id: string,        // ✅
  full_name: string,       // ✅
  phone: string,           // ✅
  booking_date: string,    // ✅ 'YYYY-MM-DD'
  start_time: string,      // ✅ ISO timestamp
  end_time: string,        // ✅ ISO timestamp
  total_price: number,     // ✅
  status: string,          // ✅ 'confirmed'
};
```

## Test Qilish

### 1. Database Columns Tekshirish

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
  AND column_name IN ('full_name', 'phone', 'customer_name', 'customer_phone')
ORDER BY column_name;
```

**Kutilgan natija:**
```
column_name | data_type
------------|----------
full_name   | text
phone       | text
```

### 2. Insert Test

```typescript
const testBooking = {
  pitch_id: 'uuid-here',
  full_name: 'Test User',
  phone: '+998 90 123 45 67',
  booking_date: '2026-03-03',
  start_time: '2026-03-03T18:00:00Z',
  end_time: '2026-03-03T20:00:00Z',
  total_price: 100000,
  status: 'confirmed',
};

const { data, error } = await supabase
  .from('bookings')
  .insert(testBooking);

if (error) {
  console.error('Error:', error);
} else {
  console.log('Success:', data);
}
```

### 3. Select Test

```typescript
const { data, error } = await supabase
  .from('bookings')
  .select('id, full_name, phone, booking_date')
  .limit(1);

console.log('Booking:', data);
// Expected: { id: '...', full_name: '...', phone: '...', booking_date: '...' }
```

## Xatolarni Bartaraf Qilish

### Xato: "column customer_name does not exist"

**Sabab:** Database da `full_name` bor, lekin frontend `customer_name` yubormoqda

**Yechim:**
```typescript
// Frontend da
const bookingData = {
  full_name: customerName,  // ✅ (not customer_name)
  phone: customerPhone,     // ✅ (not customer_phone)
};
```

### Xato: "null value in column full_name violates not-null constraint"

**Sabab:** `full_name` bo'sh yuborilmoqda

**Yechim:**
```typescript
// Validation qo'shing
if (!customerName.trim()) {
  setToast({ message: 'Mijoz ismini kiriting', type: 'error' });
  return;
}
```

### Xato: "column full_name does not exist"

**Sabab:** Database migration ishga tushmagan

**Yechim:**
```sql
-- SQL Editor da
ALTER TABLE bookings RENAME COLUMN customer_name TO full_name;
ALTER TABLE bookings RENAME COLUMN customer_phone TO phone;
```

## O'zgarishlar Ro'yxati

### Database
- ✅ `customer_name` → `full_name`
- ✅ `customer_phone` → `phone`

### Frontend Components
- ✅ ManualBookingModal.tsx - Insert object
- ✅ DashboardPage.tsx - Interface va display
- ✅ BookingsPage.tsx - Interface va display

### Files Changed
1. `rename-booking-columns.sql` - Database migration
2. `src/app/components/ManualBookingModal.tsx` - Insert logic
3. `src/app/components/DashboardPage.tsx` - Interface va UI
4. `src/app/components/BookingsPage.tsx` - Interface va UI

## Xulosa

### Muammo
Frontend va database column nomlari mos kelmagan:
- Frontend: `customer_name`, `customer_phone`
- Database: `full_name`, `phone`

### Yechim
Database ustunlarini rename qilish yoki frontend ni moslashtirish.

### Natija
- ✅ PGRST204 xatosi hal qilindi
- ✅ Column nomlari mos keladi
- ✅ Insert muvaffaqiyatli ishlaydi
- ✅ Display to'g'ri ko'rsatiladi

## Keyingi Qadamlar

1. Database migration ni ishga tushiring
2. Frontend kodini deploy qiling
3. Manual booking ni test qiling
4. Dashboard va bookings page ni tekshiring
