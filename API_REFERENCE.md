# 📚 API Reference

Complete reference for database operations and Supabase integration.

## Table of Contents

1. [Database Schema](#database-schema)
2. [Authentication](#authentication)
3. [Pitches Operations](#pitches-operations)
4. [Bookings Operations](#bookings-operations)
5. [Real-time Subscriptions](#real-time-subscriptions)
6. [Row Level Security](#row-level-security)

---

## Database Schema

### Pitches Table

```sql
CREATE TABLE pitches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  address TEXT,
  images TEXT[] DEFAULT '{}',
  working_hours_start TIME DEFAULT '08:00:00',
  working_hours_end TIME DEFAULT '23:00:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
- Primary Key on `id`

### Bookings Table

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pitch_id UUID NOT NULL REFERENCES pitches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'rejected', 'manual')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
- Primary Key on `id`
- Index on `pitch_id`
- Index on `start_time`
- Index on `status`
- Index on `created_at` (descending)

**Foreign Keys:**
- `pitch_id` → `pitches.id` (CASCADE on delete)
- `user_id` → `auth.users.id` (SET NULL on delete)

**Status Values:**
- `pending`: Waiting for admin approval
- `confirmed`: Approved by admin
- `rejected`: Rejected by admin
- `manual`: Created directly by admin

---

## Authentication

All API operations use Supabase Authentication.

### Sign Up

```typescript
import { supabase } from './lib/supabase';

const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      name: 'John Doe',
    },
  },
});
```

**Response:**
```typescript
{
  data: {
    user: User | null,
    session: Session | null
  },
  error: AuthError | null
}
```

### Sign In

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});
```

### Sign Out

```typescript
const { error } = await supabase.auth.signOut();
```

### Get Current User

```typescript
const { data: { user } } = await supabase.auth.getUser();
```

### Get Current Session

```typescript
const { data: { session } } = await supabase.auth.getSession();
```

---

## Pitches Operations

### Fetch All Pitches

```typescript
const { data, error } = await supabase
  .from('pitches')
  .select('*')
  .order('name');
```

**Returns:**
```typescript
{
  data: Pitch[] | null,
  error: PostgrestError | null
}

interface Pitch {
  id: string;
  name: string;
  price: number;
  address: string;
  images: string[];
  working_hours_start: string;
  working_hours_end: string;
  created_at: string;
  updated_at: string;
}
```

### Fetch Single Pitch

```typescript
const { data, error } = await supabase
  .from('pitches')
  .select('*')
  .eq('id', pitchId)
  .single();
```

### Create Pitch

```typescript
const { data, error } = await supabase
  .from('pitches')
  .insert({
    name: 'Pitch C',
    price: 70000,
    address: 'Tashkent, Mirobod district',
    working_hours_start: '08:00:00',
    working_hours_end: '23:00:00',
  });
```

### Update Pitch

```typescript
const { data, error } = await supabase
  .from('pitches')
  .update({
    name: 'Updated Name',
    price: 75000,
    address: 'New Address',
    working_hours_start: '09:00:00',
    working_hours_end: '22:00:00',
  })
  .eq('id', pitchId);
```

### Delete Pitch

```typescript
const { error } = await supabase
  .from('pitches')
  .delete()
  .eq('id', pitchId);
```

---

## Bookings Operations

### Fetch All Bookings

```typescript
const { data, error } = await supabase
  .from('bookings')
  .select(`
    *,
    pitches (
      name,
      price
    )
  `)
  .order('start_time', { ascending: false });
```

**Returns with Join:**
```typescript
interface BookingWithPitch {
  id: string;
  pitch_id: string;
  customer_name: string;
  customer_phone: string;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string;
  pitches: {
    name: string;
    price: number;
  };
}
```

### Fetch Bookings by Date Range

```typescript
import { startOfDay, endOfDay } from 'date-fns';

const today = new Date();
const startOfToday = startOfDay(today).toISOString();
const endOfToday = endOfDay(today).toISOString();

const { data, error } = await supabase
  .from('bookings')
  .select('*')
  .gte('start_time', startOfToday)
  .lte('start_time', endOfToday);
```

### Fetch Bookings by Status

```typescript
const { data, error } = await supabase
  .from('bookings')
  .select('*')
  .eq('status', 'pending');
```

### Fetch Bookings for Specific Pitch

```typescript
const { data, error } = await supabase
  .from('bookings')
  .select('*')
  .eq('pitch_id', pitchId)
  .eq('status', 'confirmed');
```

### Create Booking (Manual by Admin)

```typescript
const { data, error } = await supabase
  .from('bookings')
  .insert({
    pitch_id: 'uuid-here',
    customer_name: 'John Doe',
    customer_phone: '+998901234567',
    start_time: '2026-02-27T15:00:00Z',
    end_time: '2026-02-27T16:00:00Z',
    status: 'confirmed', // Manual bookings are auto-confirmed
  });
```

### Update Booking Status (Approve/Reject)

```typescript
// Approve
const { data, error } = await supabase
  .from('bookings')
  .update({ status: 'confirmed' })
  .eq('id', bookingId);

// Reject
const { data, error } = await supabase
  .from('bookings')
  .update({ status: 'rejected' })
  .eq('id', bookingId);
```

### Delete Booking

```typescript
const { error } = await supabase
  .from('bookings')
  .delete()
  .eq('id', bookingId);
```

### Check Slot Availability

```typescript
import { startOfDay, endOfDay } from 'date-fns';

async function checkSlotAvailability(
  pitchId: string,
  slotStart: Date,
  slotEnd: Date
): Promise<boolean> {
  const { data, error } = await supabase
    .from('bookings')
    .select('start_time, end_time')
    .eq('pitch_id', pitchId)
    .eq('status', 'confirmed')
    .gte('start_time', startOfDay(slotStart).toISOString())
    .lte('start_time', endOfDay(slotStart).toISOString());

  if (error) return false;

  // Check for overlaps
  const hasOverlap = data?.some((booking) => {
    const bookingStart = new Date(booking.start_time);
    const bookingEnd = new Date(booking.end_time);
    return (
      (slotStart >= bookingStart && slotStart < bookingEnd) ||
      (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
      (slotStart <= bookingStart && slotEnd >= bookingEnd)
    );
  });

  return !hasOverlap;
}
```

---

## Real-time Subscriptions

### Subscribe to Booking Changes

```typescript
const channel = supabase
  .channel('bookings-changes')
  .on(
    'postgres_changes',
    { 
      event: '*', 
      schema: 'public', 
      table: 'bookings' 
    },
    (payload) => {
      console.log('Change received!', payload);
      // Refresh your data here
      fetchBookings();
    }
  )
  .subscribe();

// Cleanup
return () => {
  supabase.removeChannel(channel);
};
```

### Subscribe to Specific Events

```typescript
// Insert only
const channel = supabase
  .channel('bookings-inserts')
  .on(
    'postgres_changes',
    { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'bookings' 
    },
    (payload) => {
      console.log('New booking!', payload.new);
    }
  )
  .subscribe();

// Update only
const channel = supabase
  .channel('bookings-updates')
  .on(
    'postgres_changes',
    { 
      event: 'UPDATE', 
      schema: 'public', 
      table: 'bookings' 
    },
    (payload) => {
      console.log('Booking updated!', payload.new);
    }
  )
  .subscribe();

// Delete only
const channel = supabase
  .channel('bookings-deletes')
  .on(
    'postgres_changes',
    { 
      event: 'DELETE', 
      schema: 'public', 
      table: 'bookings' 
    },
    (payload) => {
      console.log('Booking deleted!', payload.old);
    }
  )
  .subscribe();
```

---

## Row Level Security

All tables have RLS enabled. Policies allow authenticated users to perform all operations.

### Current Policies

**Pitches:**
```sql
-- Read
CREATE POLICY "Allow authenticated users to read pitches" ON pitches
  FOR SELECT USING (auth.role() = 'authenticated');

-- Insert
CREATE POLICY "Allow authenticated users to insert pitches" ON pitches
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Update
CREATE POLICY "Allow authenticated users to update pitches" ON pitches
  FOR UPDATE USING (auth.role() = 'authenticated');
```

**Bookings:**
```sql
-- Read
CREATE POLICY "Allow authenticated users to read bookings" ON bookings
  FOR SELECT USING (auth.role() = 'authenticated');

-- Insert
CREATE POLICY "Allow authenticated users to insert bookings" ON bookings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Update
CREATE POLICY "Allow authenticated users to update bookings" ON bookings
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Delete
CREATE POLICY "Allow authenticated users to delete bookings" ON bookings
  FOR DELETE USING (auth.role() = 'authenticated');
```

### Customizing Policies

If you want more granular control (e.g., only certain users can modify pitches):

```sql
-- Example: Only allow specific users to update pitches
CREATE POLICY "Only admins can update pitches" ON pitches
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM admin_users
    )
  );
```

---

## Aggregations & Statistics

### Today's Revenue

```typescript
import { startOfDay, endOfDay } from 'date-fns';

const today = new Date();
const { data, error } = await supabase
  .from('bookings')
  .select(`
    pitches (price)
  `)
  .gte('start_time', startOfDay(today).toISOString())
  .lte('start_time', endOfDay(today).toISOString())
  .in('status', ['confirmed', 'manual']);

const revenue = data?.reduce((sum, booking) => {
  return sum + (booking.pitches?.price || 0);
}, 0);
```

### Bookings Count by Status

```typescript
const { count: pendingCount } = await supabase
  .from('bookings')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'pending');

const { count: confirmedCount } = await supabase
  .from('bookings')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'confirmed');
```

### Most Popular Pitch

```typescript
const { data, error } = await supabase
  .from('bookings')
  .select('pitch_id, pitches(name)')
  .eq('status', 'confirmed');

// Count bookings per pitch
const pitchCounts = data?.reduce((acc, booking) => {
  acc[booking.pitch_id] = (acc[booking.pitch_id] || 0) + 1;
  return acc;
}, {});
```

---

## Error Handling

Always handle errors from Supabase operations:

```typescript
const { data, error } = await supabase
  .from('bookings')
  .select('*');

if (error) {
  console.error('Database error:', error.message);
  // Show user-friendly message
  alert('Failed to fetch bookings. Please try again.');
  return;
}

// Use data safely
console.log('Bookings:', data);
```

---

## Performance Tips

1. **Use Indexes**: The schema includes indexes on frequently queried columns
2. **Select Only What You Need**: Don't use `select('*')` if you only need specific fields
3. **Pagination**: For large datasets, use `.range(start, end)`
4. **Caching**: Cache pitch data since it changes infrequently
5. **Real-time Sparingly**: Only subscribe to real-time updates where necessary

---

## Advanced Queries

### Complex Filtering

```typescript
// Bookings for today, specific pitch, confirmed status
const { data, error } = await supabase
  .from('bookings')
  .select('*, pitches(*)')
  .eq('pitch_id', pitchId)
  .eq('status', 'confirmed')
  .gte('start_time', startOfDay(new Date()).toISOString())
  .lte('start_time', endOfDay(new Date()).toISOString())
  .order('start_time');
```

### Pagination

```typescript
const pageSize = 20;
const page = 0;

const { data, error, count } = await supabase
  .from('bookings')
  .select('*', { count: 'exact' })
  .range(page * pageSize, (page + 1) * pageSize - 1);

console.log(`Showing ${data?.length} of ${count} bookings`);
```

---

This API reference covers all the main operations you'll need for the Sports Pitch Management Admin Panel. For more advanced Supabase features, refer to the [official Supabase documentation](https://supabase.com/docs).
