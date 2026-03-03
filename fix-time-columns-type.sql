-- Fix time columns to use TIMESTAMP WITH TIME ZONE instead of TIME
-- This resolves the 22007 error: invalid input syntax for type time

-- Check current column types
SELECT column_name, data_type, udt_name
FROM information_schema.columns 
WHERE table_name = 'bookings' 
  AND column_name IN ('start_time', 'end_time')
ORDER BY column_name;

-- If columns are TIME type, we need to change them to TIMESTAMP WITH TIME ZONE

-- Step 1: Add new columns with correct type
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS start_time_new TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS end_time_new TIMESTAMP WITH TIME ZONE;

-- Step 2: Migrate existing data (if any)
-- Combine booking_date with time to create timestamp
UPDATE bookings 
SET 
  start_time_new = (booking_date + start_time::TIME)::TIMESTAMP WITH TIME ZONE,
  end_time_new = (booking_date + end_time::TIME)::TIMESTAMP WITH TIME ZONE
WHERE start_time_new IS NULL 
  AND booking_date IS NOT NULL 
  AND start_time IS NOT NULL;

-- Step 3: Drop old columns (CAREFUL - backup first!)
ALTER TABLE bookings DROP COLUMN IF EXISTS start_time CASCADE;
ALTER TABLE bookings DROP COLUMN IF EXISTS end_time CASCADE;

-- Step 4: Rename new columns
ALTER TABLE bookings RENAME COLUMN start_time_new TO start_time;
ALTER TABLE bookings RENAME COLUMN end_time_new TO end_time;

-- Step 5: Add NOT NULL constraints
ALTER TABLE bookings 
  ALTER COLUMN start_time SET NOT NULL,
  ALTER COLUMN end_time SET NOT NULL;

-- Step 6: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_end_time ON bookings(end_time);

-- Step 7: Update the overlap trigger to work with TIMESTAMP
CREATE OR REPLACE FUNCTION check_booking_overlap()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's any overlapping booking for the same pitch
  -- Overlap logic: N_Start < E_End AND N_End > E_Start
  IF EXISTS (
    SELECT 1 
    FROM bookings 
    WHERE pitch_id = NEW.pitch_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND status IN ('confirmed', 'manual')
      AND NEW.start_time < end_time 
      AND NEW.end_time > start_time
  ) THEN
    RAISE EXCEPTION 'Ushbu vaqt oralig''ida allaqachon bron mavjud!';
  END IF;
  
  -- Automatically set booking_date from start_time
  NEW.booking_date := DATE(NEW.start_time);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS tr_check_booking_overlap ON bookings;
CREATE TRIGGER tr_check_booking_overlap
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_booking_overlap();

-- Verify the changes
SELECT column_name, data_type, udt_name
FROM information_schema.columns 
WHERE table_name = 'bookings' 
  AND column_name IN ('start_time', 'end_time', 'booking_date')
ORDER BY column_name;

-- Expected result:
-- booking_date | date | date
-- end_time | timestamp with time zone | timestamptz
-- start_time | timestamp with time zone | timestamptz

COMMENT ON COLUMN bookings.start_time IS 'Booking start time (TIMESTAMP WITH TIME ZONE)';
COMMENT ON COLUMN bookings.end_time IS 'Booking end time (TIMESTAMP WITH TIME ZONE)';
