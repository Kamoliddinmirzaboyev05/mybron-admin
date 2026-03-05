# Pitch Slots Integration - Complete

## Date: March 5, 2026
## Status: ✅ Complete

---

## Overview

Integrated `pitch_slots` table as the single source of truth for availability. Both Admin and User now use the same system to check and book time slots.

---

## Architecture

### Single Source of Truth: `pitch_slots` Table

```
pitch_slots
├── id (UUID)
├── pitch_id (UUID) → references pitches(id)
├── slot_date (DATE)
├── start_time (TIME)
├── end_time (TIME)
├── is_available (BOOLEAN) ← Key field!
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

**Key Concept:**
- `is_available = true` → Slot is free
- `is_available = false` → Slot is booked

---

## Database Setup

### 1. Create Table & Triggers

Run the SQL migration file: `CREATE_PITCH_SLOTS_TABLE.sql`

This will:
- ✅ Create `pitch_slots` table
- ✅ Create `trg_sync_slots()` trigger function
- ✅ Install trigger on `bookings` table
- ✅ Create `generate_pitch_slots()` helper function
- ✅ Sync existing bookings to `pitch_slots`

### 2. Generate Slots for Your Pitches

```sql
-- Generate slots for next 30 days
SELECT generate_pitch_slots(
  'your-pitch-id-here',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days'
);
```

**Important:** Run this for each pitch in your system!

---

## How It Works

### Automatic Synchronization

The `trg_sync_slots()` trigger automatically updates `pitch_slots` when:

#### 1. Booking Created (INSERT)
```sql
INSERT INTO bookings (pitch_id, booking_date, start_time, end_time, status)
VALUES ('pitch-123', '2026-03-05', '12:00:00', '13:00:00', 'confirmed');

-- Trigger automatically runs:
UPDATE pitch_slots 
SET is_available = false 
WHERE pitch_id = 'pitch-123' 
  AND slot_date = '2026-03-05'
  AND start_time = '12:00:00'
  AND end_time = '13:00:00';
```

#### 2. Booking Confirmed (UPDATE to 'confirmed')
```sql
UPDATE bookings SET status = 'confirmed' WHERE id = 'booking-456';

-- Trigger marks slot as unavailable
```

#### 3. Booking Cancelled (UPDATE to 'cancelled')
```sql
UPDATE bookings SET status = 'cancelled' WHERE id = 'booking-456';

-- Trigger marks slot as available (if no other bookings exist)
```

#### 4. Booking Deleted (DELETE)
```sql
DELETE FROM bookings WHERE id = 'booking-456';

-- Trigger marks slot as available (if no other bookings exist)
```

---

## Admin Panel Integration

### TimeSlotSheet.tsx

**New Logic:**
1. Fetch slots from `pitch_slots` table
2. Check `is_available` field
3. Fallback to `bookings` table if slot doesn't exist

```typescript
// Fetch available slots from pitch_slots
const { data: pitchSlots } = await supabase
  .from('pitch_slots')
  .select('start_time, end_time, is_available')
  .eq('pitch_id', pitch.id)
  .eq('slot_date', selectedDate)
  .order('start_time', { ascending: true });

// Check availability
const pitchSlot = pitchSlots?.find((ps) => {
  const psStart = ps.start_time.substring(0, 5);
  const psEnd = ps.end_time.substring(0, 5);
  return psStart === slotStartTime && psEnd === slotEndTime;
});

const isAvailable = pitchSlot ? pitchSlot.is_available : true;
```

**Benefits:**
- ✅ Admin sees real-time availability
- ✅ No double bookings
- ✅ Same data as users see

### ManualBookingModal.tsx

**New Validation:**
Before creating a booking, check if slot is available:

```typescript
// Check if slot is available
const { data: slotCheck } = await supabase
  .from('pitch_slots')
  .select('is_available')
  .eq('pitch_id', pitch.id)
  .eq('slot_date', bookingData.booking_date)
  .eq('start_time', bookingData.start_time)
  .eq('end_time', bookingData.end_time)
  .single();

if (slotCheck && !slotCheck.is_available) {
  toast.error('Bu vaqt allaqachon band qilingan!');
  return; // Stop booking
}
```

**Benefits:**
- ✅ Prevents admin from double-booking
- ✅ Shows clear error message
- ✅ Real-time validation

---

## User Side (Already Working)

Users already benefit from `pitch_slots`:
- See only available slots
- Cannot book occupied slots
- Real-time updates

---

## Data Flow

### User Books a Slot

```
1. User selects slot (12:00 - 13:00)
2. Frontend checks pitch_slots.is_available = true ✅
3. User submits booking
4. INSERT INTO bookings (status = 'pending')
5. Trigger runs: UPDATE pitch_slots SET is_available = false
6. Admin sees slot as occupied
7. Other users cannot book this slot
```

### Admin Approves Booking

```
1. Admin clicks "Tasdiqlash"
2. UPDATE bookings SET status = 'confirmed'
3. Trigger runs: UPDATE pitch_slots SET is_available = false
4. Slot remains occupied
```

### Admin Rejects Booking

```
1. Admin clicks "Rad etish"
2. UPDATE bookings SET status = 'cancelled'
3. Trigger runs: UPDATE pitch_slots SET is_available = true
4. Slot becomes available again
5. Users can now book this slot
```

### Admin Creates Manual Booking

```
1. Admin opens Manual Booking modal
2. Selects date and time
3. Frontend checks pitch_slots.is_available
4. If available: proceeds with booking
5. If occupied: shows error "Bu vaqt allaqachon band qilingan!"
6. INSERT INTO bookings (status = 'confirmed')
7. Trigger runs: UPDATE pitch_slots SET is_available = false
8. Slot marked as occupied
```

---

## Query Examples

### Check Available Slots for a Date

```sql
SELECT 
  start_time,
  end_time,
  is_available
FROM pitch_slots
WHERE pitch_id = 'your-pitch-id'
  AND slot_date = '2026-03-05'
  AND is_available = true
ORDER BY start_time;
```

### See Who Booked a Slot

```sql
SELECT 
  ps.slot_date,
  ps.start_time,
  ps.end_time,
  ps.is_available,
  b.full_name,
  b.phone,
  b.status
FROM pitch_slots ps
LEFT JOIN bookings b ON (
  b.pitch_id = ps.pitch_id AND
  b.booking_date = ps.slot_date AND
  b.start_time = ps.start_time AND
  b.end_time = ps.end_time AND
  b.status IN ('confirmed', 'pending')
)
WHERE ps.pitch_id = 'your-pitch-id'
  AND ps.slot_date = '2026-03-05'
ORDER BY ps.start_time;
```

### Find Inconsistencies (Debug)

```sql
-- Slots marked as unavailable but no active booking
SELECT ps.*
FROM pitch_slots ps
WHERE ps.is_available = false
  AND NOT EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.pitch_id = ps.pitch_id
      AND b.booking_date = ps.slot_date
      AND b.start_time = ps.start_time
      AND b.end_time = ps.end_time
      AND b.status IN ('confirmed', 'pending')
  );
```

---

## Maintenance

### Generate Slots for New Dates

Run this weekly/monthly to generate slots for future dates:

```sql
-- Generate slots for next 30 days
SELECT generate_pitch_slots(
  'pitch-id',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days'
);
```

### Regenerate All Slots

If you need to rebuild the entire `pitch_slots` table:

```sql
-- 1. Clear existing slots
TRUNCATE pitch_slots;

-- 2. Generate slots for each pitch
SELECT generate_pitch_slots(
  pitch_id,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '90 days'
)
FROM pitches;

-- 3. Sync existing bookings
INSERT INTO pitch_slots (pitch_id, slot_date, start_time, end_time, is_available)
SELECT DISTINCT 
  pitch_id,
  booking_date,
  start_time,
  end_time,
  false
FROM bookings
WHERE status IN ('confirmed', 'pending')
ON CONFLICT (pitch_id, slot_date, start_time, end_time) 
DO UPDATE SET is_available = false;
```

---

## Testing Checklist

### Database
- [x] pitch_slots table created
- [x] Trigger trg_sync_slots installed
- [x] Function generate_pitch_slots works
- [x] Existing bookings synced

### Admin Panel
- [x] TimeSlotSheet fetches from pitch_slots
- [x] Shows only available slots
- [x] Fallback to bookings if slot missing
- [x] ManualBookingModal validates availability
- [x] Error shown if slot occupied

### User Side
- [x] Users see same availability as admin
- [x] Cannot book occupied slots
- [x] Real-time updates work

### Synchronization
- [x] New booking marks slot unavailable
- [x] Cancelled booking marks slot available
- [x] Deleted booking marks slot available
- [x] Multiple bookings handled correctly

---

## Troubleshooting

### Slots Not Showing

**Problem:** No slots appear in TimeSlotSheet

**Solution:**
```sql
-- Generate slots for the pitch
SELECT generate_pitch_slots(
  'your-pitch-id',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '7 days'
);
```

### Slot Shows Available But Is Booked

**Problem:** Slot marked as available but booking exists

**Solution:**
```sql
-- Manually sync the slot
UPDATE pitch_slots
SET is_available = false
WHERE pitch_id = 'pitch-id'
  AND slot_date = '2026-03-05'
  AND start_time = '12:00:00'
  AND end_time = '13:00:00';
```

### Trigger Not Working

**Problem:** Bookings don't update pitch_slots

**Solution:**
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'trigger_sync_slots';

-- Reinstall trigger
DROP TRIGGER IF EXISTS trigger_sync_slots ON bookings;
CREATE TRIGGER trigger_sync_slots
AFTER INSERT OR UPDATE OR DELETE ON bookings
FOR EACH ROW
EXECUTE FUNCTION trg_sync_slots();
```

---

## Files Modified

1. `CREATE_PITCH_SLOTS_TABLE.sql` - Database migration (NEW)
2. `src/app/components/TimeSlotSheet.tsx` - Fetch from pitch_slots
3. `src/app/components/ManualBookingModal.tsx` - Validate availability

---

## Summary

✅ **pitch_slots table** - Single source of truth created
✅ **Automatic sync** - Trigger updates slots on booking changes
✅ **Admin integration** - Uses pitch_slots for availability
✅ **Validation** - Prevents double bookings
✅ **Real-time** - Admin and users see same data
✅ **Fallback** - Works even if slots not generated yet

The system now has a robust, centralized availability management system that prevents double bookings and keeps admin and users in sync!
