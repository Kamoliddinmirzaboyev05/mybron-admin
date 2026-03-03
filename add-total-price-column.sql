-- Add total_price column to bookings table for flexible duration support
-- This allows storing the calculated price based on duration and hourly rate

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS total_price DECIMAL(10, 2);

-- Update existing bookings to calculate total_price based on duration
-- Assumes 1 hour duration for existing bookings
UPDATE bookings b
SET total_price = p.price_per_hour * 
  EXTRACT(EPOCH FROM (b.end_time - b.start_time)) / 3600
FROM pitches p
WHERE b.pitch_id = p.id 
  AND b.total_price IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN bookings.total_price IS 'Total price calculated as: duration_in_hours * price_per_hour';
