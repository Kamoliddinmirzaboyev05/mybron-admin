-- ============================================
-- Enable Real-time for Bookings Table
-- ============================================
-- Run this in Supabase SQL Editor to ensure real-time works

-- Step 1: Enable replication for bookings table
-- This allows real-time to broadcast changes
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;

-- Step 2: Verify replication is enabled
-- You should see 'bookings' in the results
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- Step 3: Check existing RLS policies on bookings
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'bookings';

-- Step 4: Ensure SELECT policy exists for authenticated users
-- This is REQUIRED for real-time to work with RLS enabled

-- Option A: Allow pitch owners to see their bookings (RECOMMENDED)
CREATE POLICY IF NOT EXISTS "Pitch owners can view their bookings"
ON bookings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM pitches
    WHERE pitches.id = bookings.pitch_id
    AND pitches.user_id = auth.uid()
  )
);

-- Option B: For testing - allow all authenticated users (TEMPORARY)
-- Uncomment if you want to test without restrictions
-- CREATE POLICY IF NOT EXISTS "Allow all authenticated to view bookings"
-- ON bookings FOR SELECT
-- TO authenticated
-- USING (true);

-- Step 5: Verify RLS is enabled on bookings table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'bookings';
-- rowsecurity should be 't' (true)

-- Step 6: Test real-time by inserting a test booking
-- Replace 'your-pitch-id' with an actual pitch ID from your database
-- DO $$
-- DECLARE
--   test_pitch_id uuid;
-- BEGIN
--   -- Get a random pitch ID for testing
--   SELECT id INTO test_pitch_id FROM pitches LIMIT 1;
  
--   -- Insert test booking
--   INSERT INTO bookings (
--     pitch_id,
--     full_name,
--     phone,
--     booking_date,
--     start_time,
--     end_time,
--     status
--   ) VALUES (
--     test_pitch_id,
--     'Test Real-time User',
--     '+998901234567',
--     CURRENT_DATE,
--     '14:00:00',
--     '16:00:00',
--     'pending'
--   );
  
--   RAISE NOTICE 'Test booking created. Check your dashboard for real-time update!';
-- END $$;

-- Step 7: Check if there are any triggers that might interfere
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'bookings';

-- Step 8: Verify bookings table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings'
ORDER BY ordinal_position;

-- ============================================
-- Troubleshooting Queries
-- ============================================

-- Check if user has access to view bookings
-- Run this while logged in as admin
SELECT 
  b.*,
  p.name as pitch_name,
  p.user_id as pitch_owner
FROM bookings b
JOIN pitches p ON p.id = b.pitch_id
WHERE b.booking_date = CURRENT_DATE
ORDER BY b.created_at DESC;

-- Check current user's pitches
SELECT 
  id,
  name,
  user_id,
  created_at
FROM pitches
WHERE user_id = auth.uid();

-- Verify real-time publication exists
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';

-- ============================================
-- Clean up test data (optional)
-- ============================================
-- DELETE FROM bookings WHERE full_name = 'Test Real-time User';
