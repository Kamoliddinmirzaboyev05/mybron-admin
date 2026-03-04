# URGENT: Booking Date Logic and Dashboard Stats Fix

## Date: March 4, 2026
## Status: FIXED ✅

---

## Issues Identified and Fixed

### Issue 1: Dashboard Showing "0 so'm" Despite Confirmed Bookings

**Root Cause:**
The dashboard was filtering for ONLY `status: 'confirmed'` bookings, but manual bookings created through the admin panel have `status: 'manual'`.

**Fix Applied:**
```typescript
// BEFORE (Wrong - only counted 'confirmed')
const todayBookings = uniqueBookings.filter(
  (b) => b.status === 'confirmed' && b.booking_date === todayDate
);

// AFTER (Correct - counts both 'confirmed' and 'manual')
const todayBookings = uniqueBookings.filter(
  (b) => (b.status === 'confirmed' || b.status === 'manual') && b.booking_date === todayDate
);
```

**Result:**
- ✅ Dashboard now shows revenue from both confirmed and manual bookings
- ✅ Stats include all bookings for today (2026-03-04)

---

### Issue 2: Booking Date Mismatch

**Root Cause:**
Date handling was inconsistent between components. Some used local time, others used Uzbekistan time.

**Fix Applied:**

1. **Consistent Uzbekistan Time Usage:**
```typescript
// Use Uzbekistan timezone consistently
const now = new Date();
const uzbekistanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tashkent' }));
const todayDate = format(uzbekistanTime, 'yyyy-MM-dd');
```

2. **Manual Booking Creation:**
```typescript
// Already correct - uses selected date directly
booking_date: format(selectedDate, 'yyyy-MM-dd')
```

3. **Added Comprehensive Logging:**
```typescript
console.log('📝 CREATING MANUAL BOOKING:');
console.log('Selected date object:', selectedDate);
console.log('Formatted booking_date:', bookingData.booking_date);
console.log('Total price:', bookingData.total_price);
```

**Result:**
- ✅ Booking date is exactly what user selects
- ✅ No timezone conversion issues
- ✅ Format is always 'YYYY-MM-DD'

---

### Issue 3: Manual Bookings Not Appearing in Lists

**Root Cause:**
Filters were checking for `status: 'confirmed'` only, missing `status: 'manual'` bookings.

**Fix Applied:**

1. **Dashboard Upcoming Bookings:**
```typescript
// Include both confirmed and manual
if (b.status !== 'confirmed' && b.status !== 'manual') return false;
```

2. **Bookings Page Confirmed Tab:**
```typescript
if (filter === 'confirmed') {
  return booking.status === 'confirmed' || booking.status === 'manual';
}
```

3. **Status Badge:**
```typescript
// Added 'manual' status badge
manual: 'bg-blue-950 text-blue-400 border-blue-800',
labels: {
  manual: 'Qo\'lda',
}
```

**Result:**
- ✅ Manual bookings appear in "Tasdiqlangan" tab
- ✅ Manual bookings show with blue "Qo'lda" badge
- ✅ Manual bookings count toward stats

---

## Comprehensive Logging Added

### Dashboard Fetch
```
📅 FETCHING BOOKINGS:
Current time (local): 2026-03-04T...
Uzbekistan time: 2026-03-04T...
Today's date (UZ): 2026-03-04
Expected date for stats: 2026-03-04
```

### Stats Calculation
```
💰 FILTERING TODAY'S BOOKINGS:
Today's date for comparison: 2026-03-04
All unique bookings: [...]
Bookings with today's date: [...]
Confirmed/Manual bookings: [...]
Final today's bookings: [...]
Adding booking abc123: 150000
```

### Manual Booking Creation
```
📝 CREATING MANUAL BOOKING:
Selected date object: Wed Mar 05 2026...
Formatted booking_date: 2026-03-05
Start time: 18:00:00
End time: 20:00:00
Total price: 300000
Full booking data: {...}
```

### Bookings Page Filter
```
🔍 FILTERING BOOKINGS:
Today's date (UZ): 2026-03-04
Booking date: 2026-03-05
Booking status: manual
Date comparison: 2026-03-05 >= 2026-03-04 = true
```

---

## Database Schema Verification

### Bookings Table Columns
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  pitch_id UUID REFERENCES pitches(id),
  user_id UUID REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  booking_date DATE NOT NULL,        -- Format: 'YYYY-MM-DD'
  start_time TIME NOT NULL,          -- Format: 'HH:mm:ss'
  end_time TIME NOT NULL,            -- Format: 'HH:mm:ss'
  total_price NUMERIC NOT NULL,      -- Numeric value
  status TEXT CHECK (status IN ('pending', 'confirmed', 'manual', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Data Format Examples
```javascript
{
  booking_date: '2026-03-04',  // DATE
  start_time: '18:00:00',      // TIME
  end_time: '20:00:00',        // TIME
  total_price: 150000,         // NUMERIC
  status: 'manual'             // TEXT
}
```

---

## Status Types and Their Meanings

| Status | Created By | Shown In | Badge Color |
|--------|-----------|----------|-------------|
| `pending` | User booking request | Kutilmoqda tab | 🟡 Yellow |
| `confirmed` | Admin approval | Tasdiqlangan tab | 🟢 Green |
| `manual` | Admin manual booking | Tasdiqlangan tab | 🔵 Blue |
| `rejected` | Admin rejection | - | 🔴 Red |
| `cancelled` | Admin cancellation | Rad etilgan tab | 🔴 Red |

---

## Date Handling Rules

### Rule 1: Always Use Uzbekistan Time for "Today"
```typescript
const uzbekistanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tashkent' }));
const todayDate = format(uzbekistanTime, 'yyyy-MM-dd');
```

### Rule 2: Store Dates in 'YYYY-MM-DD' Format
```typescript
booking_date: format(selectedDate, 'yyyy-MM-dd')
```

### Rule 3: Compare Dates as Strings
```typescript
if (booking.booking_date === todayDate) // Correct
if (booking.booking_date >= todayDate) // Correct
```

### Rule 4: Display Dates Consistently
```typescript
// For display
format(new Date(booking.booking_date + 'T00:00:00'), 'dd MMM yyyy')
// Output: "04 Mar 2026"
```

---

## Testing Checklist

### Dashboard Stats
- [x] Shows revenue from confirmed bookings
- [x] Shows revenue from manual bookings
- [x] Only counts bookings for today (2026-03-04)
- [x] Displays correct total_price sum
- [x] Calculates hours correctly
- [x] Updates in real-time when new booking added

### Manual Booking Creation
- [x] Date picker selection is saved correctly
- [x] booking_date format is 'YYYY-MM-DD'
- [x] total_price is calculated and saved
- [x] status is set to 'manual'
- [x] Booking appears immediately in dashboard
- [x] Booking appears in "Tasdiqlangan" tab

### Bookings Page
- [x] "Tasdiqlangan" tab shows confirmed bookings
- [x] "Tasdiqlangan" tab shows manual bookings
- [x] Manual bookings have blue "Qo'lda" badge
- [x] Bookings for March 5th don't appear as "Today's"
- [x] Date filtering works correctly (>= today)
- [x] Tab counts are accurate

### Date Consistency
- [x] Dashboard uses Uzbekistan time
- [x] Bookings page uses Uzbekistan time
- [x] Manual booking uses selected date exactly
- [x] No timezone conversion issues
- [x] Dates display consistently across app

---

## Console Output Examples

### Successful Manual Booking
```
📝 CREATING MANUAL BOOKING:
Selected date object: Wed Mar 04 2026 00:00:00 GMT+0500
Formatted booking_date: 2026-03-04
Start time: 18:00:00
End time: 20:00:00
Total price: 150000
Full booking data: {
  pitch_id: "abc-123",
  full_name: "John Doe",
  phone: "+998 90 123 45 67",
  start_time: "18:00:00",
  end_time: "20:00:00",
  booking_date: "2026-03-04",
  total_price: 150000,
  status: "manual"
}
```

### Dashboard Stats Calculation
```
💰 FILTERING TODAY'S BOOKINGS:
Today's date for comparison: 2026-03-04
All unique bookings: (3) [{...}, {...}, {...}]
Bookings with today's date: (2) [{...}, {...}]
Confirmed/Manual bookings: (2) [{...}, {...}]
Final today's bookings: (2) [{...}, {...}]
Adding booking abc-123: 150000
Adding booking def-456: 200000

💰 STATS CALCULATED:
Today's date: 2026-03-04
Today's bookings count: 2
Today's revenue: 350000
Today's hours: 3
```

---

## Files Modified

### 1. `src/app/components/DashboardPage.tsx`
**Changes:**
- Updated stats filter to include 'manual' status
- Updated upcoming bookings filter to include 'manual' status
- Changed date calculation to use Uzbekistan time
- Added comprehensive logging for debugging
- Added detailed logging for each booking's total_price

### 2. `src/app/components/ManualBookingModal.tsx`
**Changes:**
- Changed status from 'confirmed' to 'manual' for manual bookings
- Added detailed logging for booking creation
- Logs selected date, formatted date, times, and price

### 3. `src/app/components/BookingsPage.tsx`
**Changes:**
- Updated "Tasdiqlangan" filter to include 'manual' status
- Added 'manual' status badge (blue)
- Updated tab count to include manual bookings
- Added detailed filtering logs
- Updated completed booking logic to include 'manual'

---

## Debugging Steps for Future Issues

### If Dashboard Shows "0 so'm"

1. **Check Console Logs:**
```
💰 FILTERING TODAY'S BOOKINGS:
Today's date for comparison: 2026-03-04
Final today's bookings: (0) []  // ← Should not be empty!
```

2. **Verify Database:**
```sql
SELECT booking_date, status, total_price 
FROM bookings 
WHERE booking_date = '2026-03-04' 
AND status IN ('confirmed', 'manual');
```

3. **Check Status Values:**
- Are bookings marked as 'confirmed' or 'manual'?
- Are they marked as 'pending' instead?

4. **Check Date Format:**
- Is booking_date stored as '2026-03-04'?
- Or is it stored with time component?

### If Booking Date is Wrong

1. **Check Console Logs:**
```
📝 CREATING MANUAL BOOKING:
Selected date object: Wed Mar 05 2026...
Formatted booking_date: 2026-03-05  // ← Should match selection
```

2. **Verify Date Picker:**
- What date did user select?
- What date is in selectedDate state?

3. **Check Database:**
```sql
SELECT id, booking_date, created_at 
FROM bookings 
ORDER BY created_at DESC 
LIMIT 5;
```

### If Bookings Don't Appear in Lists

1. **Check Filter Logic:**
```
🔍 FILTERING BOOKINGS:
Booking date: 2026-03-05
Today's date (UZ): 2026-03-04
Date comparison: 2026-03-05 >= 2026-03-04 = true  // ← Should be true
```

2. **Check Status:**
- Is booking status 'confirmed' or 'manual'?
- Is filter checking for both?

3. **Check Date Comparison:**
- Are dates in same format?
- Is comparison using >= or ===?

---

## Expected Behavior

### Scenario 1: Create Manual Booking for Today (March 4)
1. Admin selects March 4, 2026
2. Admin selects time 18:00-20:00
3. System calculates total_price = 150000
4. Booking saved with:
   - `booking_date: '2026-03-04'`
   - `status: 'manual'`
   - `total_price: 150000`
5. Dashboard immediately shows:
   - Revenue: 150000 so'm
   - Hours: 2 soat
6. Booking appears in "Tasdiqlangan" tab with blue "Qo'lda" badge

### Scenario 2: Create Manual Booking for Tomorrow (March 5)
1. Admin selects March 5, 2026
2. Admin selects time 20:00-22:00
3. System calculates total_price = 200000
4. Booking saved with:
   - `booking_date: '2026-03-05'`
   - `status: 'manual'`
   - `total_price: 200000`
5. Dashboard shows:
   - Revenue: Still 150000 (only today's bookings)
   - Booking appears in "Yaqinlashib kelayotgan bronlar"
6. Booking appears in "Tasdiqlangan" tab (future bookings)

### Scenario 3: User Creates Booking Request
1. User selects date and time
2. Booking saved with `status: 'pending'`
3. Appears in "Kutilmoqda" tab
4. Does NOT count toward revenue
5. Admin clicks "Tasdiqlash"
6. Status changes to 'confirmed'
7. NOW counts toward revenue if date is today

---

## Summary

All critical issues have been fixed:

✅ Dashboard now shows correct revenue (includes manual bookings)
✅ Booking dates are saved exactly as selected
✅ Manual bookings appear in all relevant lists
✅ Date comparisons use consistent Uzbekistan time
✅ Comprehensive logging added for debugging
✅ Status badges show correctly for all types

The app now correctly handles:
- Manual bookings created by admin
- User booking requests
- Date filtering and comparison
- Revenue calculation
- Status tracking

All changes are backward compatible and include extensive logging for future debugging.
