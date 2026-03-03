# Real-time Updates Debug Guide

## Issue: Real-time updates not reaching Admin Dashboard

## Debugging Steps Implemented

### 1. Enhanced Console Logging
Added comprehensive logging throughout the real-time subscription:

- 🔌 Subscription setup confirmation
- 📅 Today's date filter value
- 🆕 New booking received (INSERT events)
- 🔄 Booking updated (UPDATE events)
- 🗑️ Booking deleted (DELETE events)
- 📡 Subscription status changes
- ✅ Success confirmations
- ❌ Error messages

### 2. Subscription Status Callback
Added a status callback to `.subscribe()` to monitor connection state:

```typescript
.subscribe((status, err) => {
  console.log('📡 Subscription status:', status);
  // Possible statuses: SUBSCRIBED, CHANNEL_ERROR, TIMED_OUT, CLOSED
});
```

### 3. Broadcast Configuration
Added `broadcast: { self: true }` to ensure the channel receives its own changes:

```typescript
const channel = supabase.channel('bookings-realtime', {
  config: {
    broadcast: { self: true }
  }
})
```

## Common Issues & Solutions

### Issue 1: Supabase Realtime Not Enabled
**Check:** Go to Supabase Dashboard → Database → Replication
**Solution:** Enable replication for the `bookings` table

**Steps:**
1. Open Supabase Dashboard
2. Navigate to Database → Replication
3. Find the `bookings` table
4. Enable replication by toggling it ON
5. Save changes

### Issue 2: Row Level Security (RLS) Blocking Realtime
**Check:** RLS policies might prevent real-time events from being broadcast

**Solution:** Ensure RLS policies allow SELECT on bookings table:

```sql
-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'bookings';

-- Create policy to allow admins to see all bookings
CREATE POLICY "Admins can view all bookings"
ON bookings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM pitches
    WHERE pitches.id = bookings.pitch_id
    AND pitches.user_id = auth.uid()
  )
);

-- OR for testing, temporarily allow all authenticated users
CREATE POLICY "Allow all authenticated users to view bookings"
ON bookings FOR SELECT
TO authenticated
USING (true);
```

### Issue 3: Network/Firewall Blocking WebSocket
**Check:** Real-time uses WebSocket connections which might be blocked

**Solution:**
- Check browser console for WebSocket errors
- Ensure port 443 (WSS) is not blocked
- Try from a different network
- Check browser extensions that might block WebSockets

### Issue 4: Supabase Client Version
**Check:** Ensure you're using a recent version of `@supabase/supabase-js`

**Solution:**
```bash
npm update @supabase/supabase-js
# or
npm install @supabase/supabase-js@latest
```

### Issue 5: Multiple Subscriptions
**Check:** Multiple subscriptions with the same channel name can cause conflicts

**Solution:** The code now properly cleans up subscriptions:
```typescript
return () => {
  unsubscribe(); // Properly removes channel on unmount
};
```

## Testing Real-time Updates

### Test 1: Check Subscription Status
1. Open Admin Dashboard
2. Open browser console (F12)
3. Look for: `✅ Successfully subscribed to bookings real-time updates`
4. If you see `❌ Channel error` or `⏱️ Subscription timed out`, there's a connection issue

### Test 2: Create a Test Booking
1. Keep Admin Dashboard open with console visible
2. Create a new booking from the user app
3. Watch console for:
   - `🆕 New booking received:`
   - `📦 Payload data:`
   - `✅ Adding booking to list`

### Test 3: Update a Booking
1. Approve or reject a pending booking
2. Watch console for:
   - `🔄 Booking updated:`
   - `✏️ Updating booking in list:`
   - `✅ Booking updated in list`

### Test 4: Manual Database Insert
Test if real-time works at all by manually inserting a booking:

```sql
INSERT INTO bookings (
  pitch_id,
  full_name,
  phone,
  booking_date,
  start_time,
  end_time,
  status
) VALUES (
  'your-pitch-id',
  'Test User',
  '+998901234567',
  CURRENT_DATE,
  '10:00:00',
  '12:00:00',
  'pending'
);
```

Watch the dashboard console for real-time events.

## Expected Console Output (Success)

When everything works correctly, you should see:

```
🔌 Setting up real-time subscription for bookings...
📅 Today's date filter: 2026-03-03
📡 Subscription status: SUBSCRIBED
✅ Successfully subscribed to bookings real-time updates

[When new booking arrives]
🆕 New booking received: { ... }
📦 Payload data: { "id": "...", "full_name": "...", ... }
📊 Fetched booking data: { ... }
📅 Booking date: 2026-03-03 vs Today: 2026-03-03
✅ Adding booking to list
📝 Previous bookings count: 5
📝 Updated bookings count: 6
🔔 Playing notification sound
```

## Quick Fixes to Try

### Fix 1: Restart Supabase Connection
```typescript
// Add this to your component
const reconnectRealtime = async () => {
  await supabase.removeAllChannels();
  subscribeToBookings();
};
```

### Fix 2: Check Environment Variables
Ensure `.env.local` has correct values:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Fix 3: Enable Realtime in Supabase Dashboard
1. Go to Database → Replication
2. Enable replication for `bookings` table
3. Click "Save"
4. Refresh your app

## Still Not Working?

If real-time still doesn't work after all checks:

1. **Check Supabase Status**: Visit https://status.supabase.com
2. **Check Browser Compatibility**: Try in Chrome/Firefox
3. **Check Network Tab**: Look for WebSocket connection in DevTools
4. **Contact Support**: Provide console logs to Supabase support

## Verification Checklist

- [ ] Console shows "Successfully subscribed to bookings real-time updates"
- [ ] Replication enabled for `bookings` table in Supabase
- [ ] RLS policies allow SELECT on bookings
- [ ] No WebSocket errors in browser console
- [ ] Environment variables are correct
- [ ] Using latest @supabase/supabase-js version
- [ ] No firewall/network blocking WebSocket connections
- [ ] Admin is logged in with correct account
