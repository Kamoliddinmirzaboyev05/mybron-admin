-- Add owner_id and price_per_hour columns to pitches table
-- This allows proper user-pitch association and hourly pricing

-- Add owner_id column to link pitch to user
ALTER TABLE pitches 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add price_per_hour column (rename from price for clarity)
ALTER TABLE pitches 
ADD COLUMN IF NOT EXISTS price_per_hour DECIMAL(10, 2);

-- Migrate existing price data to price_per_hour
UPDATE pitches 
SET price_per_hour = price 
WHERE price_per_hour IS NULL AND price IS NOT NULL;

-- Create index on owner_id for better performance
CREATE INDEX IF NOT EXISTS idx_pitches_owner_id ON pitches(owner_id);

-- Update RLS policies to use owner_id
DROP POLICY IF EXISTS "Allow authenticated users to read pitches" ON pitches;
DROP POLICY IF EXISTS "Allow authenticated users to insert pitches" ON pitches;
DROP POLICY IF EXISTS "Allow authenticated users to update pitches" ON pitches;

-- New policies with owner_id
CREATE POLICY "Users can view their own pitches" ON pitches
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own pitches" ON pitches
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own pitches" ON pitches
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own pitches" ON pitches
  FOR DELETE USING (auth.uid() = owner_id);

-- Add comments
COMMENT ON COLUMN pitches.owner_id IS 'User who owns this pitch';
COMMENT ON COLUMN pitches.price_per_hour IS 'Hourly rate for booking this pitch';
