-- Rename booking columns to match frontend expectations
-- This fixes PGRST204 error: column "customer_name" does not exist

-- Step 1: Rename customer_name to full_name
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'customer_name'
  ) THEN
    ALTER TABLE bookings RENAME COLUMN customer_name TO full_name;
  END IF;
END $$;

-- Step 2: Rename customer_phone to phone
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'customer_phone'
  ) THEN
    ALTER TABLE bookings RENAME COLUMN customer_phone TO phone;
  END IF;
END $$;

-- Step 3: Ensure columns exist with correct names
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '';

-- Step 4: Add comments
COMMENT ON COLUMN bookings.full_name IS 'Customer full name';
COMMENT ON COLUMN bookings.phone IS 'Customer phone number';

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
  AND column_name IN ('full_name', 'phone', 'booking_date', 'start_time', 'end_time', 'pitch_id', 'total_price', 'status')
ORDER BY column_name;
