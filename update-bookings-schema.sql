-- Update bookings table for manual booking functionality
-- Add missing columns and create overlap validation trigger

-- Add total_price column if not exists
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS total_price DECIMAL(10, 2);

-- Add booking_date column for easier date filtering
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS booking_date DATE;

-- Add full_name column (alias for customer_name for consistency)
-- Note: We'll use customer_name as full_name in the application

-- Update existing bookings to set booking_date from start_time
UPDATE bookings 
SET booking_date = DATE(start_time)
WHERE booking_date IS NULL;

-- Create index on booking_date for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date);

-- Function to check for booking overlaps
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
  
  -- Set booking_date from start_time
  NEW.booking_date := DATE(NEW.start_time);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for overlap checking
DROP TRIGGER IF EXISTS tr_check_booking_overlap ON bookings;
CREATE TRIGGER tr_check_booking_overlap
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_booking_overlap();

-- Add comments for documentation
COMMENT ON COLUMN bookings.total_price IS 'Total price calculated as: duration_in_hours * price_per_hour';
COMMENT ON COLUMN bookings.booking_date IS 'Date extracted from start_time for easier filtering';
COMMENT ON TRIGGER tr_check_booking_overlap ON bookings IS 'Prevents overlapping bookings for the same pitch';
