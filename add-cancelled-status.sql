-- Add 'cancelled' status to bookings table
-- This allows admins to cancel confirmed bookings

-- Update the status check constraint to include 'cancelled'
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('pending', 'confirmed', 'rejected', 'manual', 'cancelled'));

-- Add comment
COMMENT ON COLUMN bookings.status IS 'Booking status: pending, confirmed, rejected, manual, cancelled';

-- Verify the constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'bookings'::regclass 
  AND conname = 'bookings_status_check';
