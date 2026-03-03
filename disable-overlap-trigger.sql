-- Temporarily disable overlap trigger to allow TIME-based bookings
-- This is a workaround until columns are changed to TIMESTAMP WITH TIME ZONE

-- Drop the trigger
DROP TRIGGER IF EXISTS tr_check_booking_overlap ON bookings;

-- Comment out the function (keep for reference)
-- We'll rely on client-side validation in TimeSlotSheet.tsx

COMMENT ON TABLE bookings IS 'Overlap validation is done client-side in TimeSlotSheet component';

-- Note: This is a temporary solution. 
-- For production, migrate to TIMESTAMP WITH TIME ZONE columns using fix-time-columns-type.sql
