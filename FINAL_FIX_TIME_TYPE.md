# Final Fix - Time Column Type Error (22007)

## Muammo

**Xato:** 400 Bad Request (22007)

**Xato xabari:**
```
invalid input syntax for type time: "2026-03-03T09:00:53.852Z"
```

**Sabab:** Database da `start_time` va `end_time` ustunlari `TIME` tipida, lekin frontend `TIMESTAMP WITH TIME ZONE` (ISO string) yubormoqda.

## Database Schema Muammosi

### Hozirgi Schema (Noto'g'ri)
```sql
CREATE TABLE bookings (
  start_time TIME,              -- ❌ Faqat vaqt (HH:mm:ss)
  end_time TIME,                -- ❌ Faqat vaqt (HH:mm:ss)
  booking_date DATE             -- ✅ Sana (YYYY-MM-DD)
);
```

**Muammo:** `TIME` tipi faqat vaqtni saqlaydi (masalan, `18:00:00`), lekin biz to'liq timestamp yubormoqdamiz (`2026-03-03T18:00:00Z`).

### To'g'ri Schema
```sql
CREATE TABLE bookings (
  start_time TIMESTAMP WITH TIME ZONE,  -- ✅ To'liq timestamp
  end_time TIMESTAMP WITH TIME ZONE,    -- ✅ To'liq timestamp
  booking_date DATE                     -- ✅ Sana (filter uchun)
);
```

## Yechim

### Opsiya 1: Database Schema ni O'zgartirish (Tavsiya etiladi)

**Migration fayl:** `fix-time-columns-type.sql`

```sql
-- 1. Yangi ustunlar qo'shish
ALTER TABLE bookings 
ADD COLUMN start_time_new TIMESTAMP WITH TIME ZONE,
ADD COLUMN end_time_new TIMESTAMP WITH TIME ZONE;

-- 2. Ma'lumotlarni ko'chirish (agar mavjud bo'lsa)
UPDATE bookings 
SET 
  start_time_new = (booking_date + start_time::TIME)::TIMESTAMP WITH TIME ZONE,
  end_time_new = (booking_date + end_time::TIME)::TIMESTAMP WITH TIME ZONE
WHERE start_time_new IS NULL;

-- 3. Eski ustunlarni o'chirish
ALTER TABLE bookings DROP COLUMN start_time CASCADE;
ALTER TABLE bookings DROP COLUMN end_time CASCADE;

-- 4. Yangi ustunlarni rename qilish
ALTER TABLE bookings RENAME COLUMN start_time_new TO start_time;
ALTER TABLE bookings RENAME COLUMN end_time_new TO end_time;

-- 5. NOT NULL constraint qo'shish
ALTER TABLE bookings 
  ALTER COLUMN start_time SET NOT NULL,
  ALTER COLUMN end_time SET NOT NULL;
```

### Opsiya 2: Frontend ni Moslashtirish (Vaqtinchalik)

Agar database ni o'zgartira olmasangiz, frontend da faqat vaqtni yuborish:

```typescript
// ManualBookingModal.tsx

// Helper function: Extract time from Date
const formatTimeOnly = (date: Date): string => {
  return format(date, 'HH:mm:ss'); // '18:00:00'
};

const bookingData = {
  pitch_id: pitch.id,
  full_name: customerName.trim(),
  phone: customerPhone.trim(),
  booking_date: format(selectedDate, 'yyyy-MM-dd'),
  start_time: formatTimeOnly(selectedTimeSlot.start), // ✅ '18:00:00'
  end_time: formatTimeOnly(selectedTimeSlot.end),     // ✅ '20:00:00'
  total_price: totalPrice,
  status: 'confirmed',
};
```

**Muammo:** Bu yechim to'liq emas, chunki timezone ma'lumoti yo'qoladi va overlap validation qiyin bo'ladi.

## Tavsiya Etilgan Yechim

### 1. Database Migration

```bash
# Supabase SQL Editor da:
# fix-time-columns-type.sql faylini ishga tushiring
```

**Muhim:** Bu migration mavjud ma'lumotlarni o'chiradi! Agar production da ma'lumotlar bo'lsa, avval backup oling.

### 2. Frontend Kodi (O'zgartirish shart emas)

Frontend kodi allaqachon to'g'ri - ISO timestamp yubormoqda:

```typescript
const bookingData = {
  start_time: selectedTimeSlot.start.toISOString(), // ✅
  end_time: selectedTimeSlot.end.toISOString(),     // ✅
  booking_date: format(selectedDate, 'yyyy-MM-dd'), // ✅
  // ...
};
```

## To'liq Database Schema

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pitch_id UUID NOT NULL REFERENCES pitches(id) ON DELETE CASCADE,
  
  -- Customer info
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  
  -- Date/Time (TIMESTAMP for full datetime support)
  booking_date DATE NOT NULL,                    -- Filter uchun
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,  -- To'liq timestamp
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,    -- To'liq timestamp
  
  -- Pricing
  total_price DECIMAL(10, 2),
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'rejected', 'manual')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bookings_pitch_id ON bookings(pitch_id);
CREATE INDEX idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Overlap trigger
CREATE OR REPLACE FUNCTION check_booking_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM bookings 
    WHERE pitch_id = NEW.pitch_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND status IN ('confirmed', 'manual')
      AND NEW.start_time < end_time 
      AND NEW.end_time > start_time
  ) THEN
    RAISE EXCEPTION 'Ushbu vaqt oralig''ida allaqachon bron mavjud!';
  END IF;
  
  NEW.booking_date := DATE(NEW.start_time);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_check_booking_overlap
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_booking_overlap();
```

## Data Types Tushuntirish

### TIME vs TIMESTAMP

| Type | Format | Example | Use Case |
|------|--------|---------|----------|
| `TIME` | HH:mm:ss | `18:00:00` | Faqat vaqt (sana yo'q) |
| `TIMESTAMP` | YYYY-MM-DD HH:mm:ss | `2026-03-03 18:00:00` | To'liq sana va vaqt |
| `TIMESTAMP WITH TIME ZONE` | ISO 8601 | `2026-03-03T18:00:00+05:00` | Timezone bilan |

### Bizning Holat

**Kerak:** `TIMESTAMP WITH TIME ZONE`

**Sabab:**
1. To'liq sana va vaqt kerak
2. Timezone support kerak
3. Overlap validation uchun to'liq timestamp kerak
4. Frontend ISO string yuboradi

## Migration Qadamlari

### 1. Backup Oling

```sql
-- Mavjud ma'lumotlarni export qiling
SELECT * FROM bookings;
```

### 2. Migration Ishga Tushiring

```bash
# Supabase SQL Editor da:
# fix-time-columns-type.sql ni copy-paste qiling va Run bosing
```

### 3. Verify Qiling

```sql
-- Column types ni tekshiring
SELECT column_name, data_type, udt_name
FROM information_schema.columns 
WHERE table_name = 'bookings' 
  AND column_name IN ('start_time', 'end_time', 'booking_date')
ORDER BY column_name;

-- Expected:
-- booking_date | date | date
-- end_time | timestamp with time zone | timestamptz
-- start_time | timestamp with time zone | timestamptz
```

### 4. Test Qiling

```typescript
// Frontend da test booking yarating
const testBooking = {
  pitch_id: 'your-pitch-id',
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
  console.log('Success!', data);
}
```

## Xatolarni Bartaraf Qilish

### Xato: "invalid input syntax for type time"

**Sabab:** Database `TIME` tipini kutmoqda, lekin `TIMESTAMP` yuborilmoqda

**Yechim:** Migration ishga tushiring (`fix-time-columns-type.sql`)

### Xato: "column start_time_new already exists"

**Sabab:** Migration yarim qolgan

**Yechim:**
```sql
-- Tozalash
DROP TABLE IF EXISTS bookings CASCADE;
-- Keyin schema.sql dan qayta yarating
```

### Xato: "cannot drop column start_time because other objects depend on it"

**Sabab:** Index yoki constraint bog'langan

**Yechim:**
```sql
-- CASCADE bilan o'chirish
ALTER TABLE bookings DROP COLUMN start_time CASCADE;
```

## Xulosa

### Muammo
Database `TIME` tipini kutmoqda, frontend `TIMESTAMP` yubormoqda.

### Yechim
Database schema ni `TIMESTAMP WITH TIME ZONE` ga o'zgartirish.

### Migration
```bash
psql -f fix-time-columns-type.sql
```

### Natija
- ✅ 22007 xatosi hal qilindi
- ✅ To'liq timestamp support
- ✅ Timezone support
- ✅ Overlap validation ishlaydi
- ✅ Frontend kodi o'zgarmaydi

## Keyingi Qadamlar

1. ✅ `fix-time-columns-type.sql` ni ishga tushiring
2. ✅ Column types ni verify qiling
3. ✅ Test booking yarating
4. ✅ Dashboard va bookings page ni tekshiring
5. ✅ Overlap validation ni test qiling
