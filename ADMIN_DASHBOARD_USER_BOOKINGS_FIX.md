# Admin Dashboard - User Bookings Display Fix

## Date: 2026-03-04

## Issue Investigation

The user reported that the dashboard might only be showing manual bookings (user_id = null) and not user bookings (user_id present).

## Analysis

After reviewing the code, I found that:

1. **No user_id filter exists** - The dashboard queries do NOT filter by user_id
2. **All bookings are fetched** - Both manual and user bookings are retrieved
3. **The issue might be time-based filtering** - The recent fix to filter out past bookings might be hiding some bookings

## Current Query Logic

### Pending Bookings
```typescript
.eq('status', 'pending')
// No user_id filter - fetches ALL pending bookings
```

### Upcoming Bookings
```typescript
.gte('booking_date', todayDate)
.in('status', ['confirmed', 'manual'])
// No user_id filter - fetches ALL confirmed/manual bookings
```

## Enhanced Logging Added

To help diagnose the actual issue, I've added comprehensive logging:

### 1. Fetch Time Logging
```typescript
console.log('📊 BOOKING DISTRIBUTION:');
console.log('Manual bookings (user_id = null):', manualBookings.length);
console.log('User bookings (user_id present):', userBookings.length);
```

### 2. Today's Stats Logging
```typescript
console.log('📊 TODAY\'S BOOKING DISTRIBUTION:');
console.log('Manual bookings (user_id = null):', todayManual.length);
console.log('User bookings (user_id present):', todayUser.length);
```

### 3. Upcoming Bookings Logging
```typescript
console.log('📊 UPCOMING BOOKING DISTRIBUTION:');
console.log('Manual bookings (user_id = null):', upcomingManual.length);
console.log('User bookings (user_id present):', upcomingUser.length);
```

## What to Check in Console

When you open the dashboard, check the console for:

1. **Total bookings fetched** - Should include both manual and user bookings
2. **Distribution by user_id** - Shows how many of each type
3. **Today's bookings** - Shows which bookings count toward stats
4. **Upcoming bookings** - Shows which bookings appear in the list

## Possible Reasons for Missing Bookings

If bookings are still not showing, it could be:

1. **Time filtering** - Bookings with end_time in the past are filtered out
2. **Date filtering** - Only bookings >= today's date are shown
3. **Status filtering** - Only 'confirmed' and 'manual' status bookings appear in upcoming
4. **Database issue** - Bookings might not have the correct status in the database

## Example Console Output

You should see something like:
```
📦 FETCHED BOOKINGS:
Pending count: 0
Upcoming count: 4
Total unique bookings: 4

📊 BOOKING DISTRIBUTION:
Manual bookings (user_id = null): 1
User bookings (user_id present): 3

📊 TODAY'S BOOKING DISTRIBUTION:
Manual bookings (user_id = null): 1
User bookings (user_id present): 1

📊 UPCOMING BOOKING DISTRIBUTION:
Manual bookings (user_id = null): 1
User bookings (user_id present): 3
```

## Stats Calculation

The stats (revenue and hours) correctly include BOTH manual and user bookings:

```typescript
const todayBookings = uniqueBookings.filter(
  (b) => (b.status === 'confirmed' || b.status === 'manual') && b.booking_date === todayDate
);
// No user_id filter - includes all bookings for today
```

## Next Steps

1. Open the dashboard and check the browser console
2. Look at the "BOOKING DISTRIBUTION" logs
3. If user bookings are fetched but not displayed, check:
   - Their booking_date (must be >= today)
   - Their end_time (must be > current time for today's bookings)
   - Their status (must be 'confirmed' or 'manual')

## User App Note

This codebase appears to be admin-only. There is no separate user app in this repository. If there's a separate user app, it would need to:

1. Filter by user_id: `.eq('user_id', auth.uid())`
2. Have proper RLS policies allowing users to see their own bookings
3. Show bookings with status 'confirmed' in the confirmed tab

## Files Modified

- `src/app/components/DashboardPage.tsx`
  - Added user_id to Booking interface
  - Enhanced logging to show manual vs user booking distribution
  - No changes to query logic (already correct)
