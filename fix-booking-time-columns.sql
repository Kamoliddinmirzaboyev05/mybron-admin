-- Fix booking time columns to use DATE and TIME types
-- This resolves the 400 Bad Request (22007) error

-- Step 1: Add new columns with correct types
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS booking_date_new DATE,
ADD COLUMN IF NOT EXISTS start_time_new TIME,
ADD COLUMN IF NOT EXISTS end_time_new TIME;

-- Step 2: Migrate existing data
UPDATE bookings 
SET 
  booking_date_new = DATE(start_time),
  start_time_new = start_time::TIME,
  end_time_new = end_time::TIME
WHERE booking_date_new IS NULL;

-- Step 3: Drop old columns (be careful - backup first!)
-- ALTER TABLE bookings DROP COLUMN IF EXISTS start_time;
-- ALTER TABLE bookings DROP COLUMN IF EXISTS end_time;

-- Step 4: Rename new columns to original names
-- ALTER TABLE bookings RENAME COLUMN booking_date_new TO booking_date;
-- ALTER TABLE bookings RENAME COLUMN start_time_new TO start_time;
-- ALTER TABLE bookings RENAME COLUMN end_time_new TO end_time;

-- Alternative: Keep TIMESTAMP columns but ensure booking_date is always set
-- This is safer and maintains backward compatibility
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS booking_date DATE;

UPDATE bookings 
SET booking_date = DATE(start_time)
WHERE booking_date IS NULL;

-- Create index on booking_date
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date);

-- Update the overlap trigger to work with TIMESTAMP
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

COMMENT ON COLUMN bookings.booking_date IS 'Date extracted from start_time for filtering (YYYY-MM-DD)';
