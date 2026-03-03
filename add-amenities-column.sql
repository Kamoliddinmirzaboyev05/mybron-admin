-- Add Amenities Column to Pitches Table
-- This script adds amenities support for pitch management
-- Run this in your Supabase SQL Editor

-- ============================================
-- STEP 1: Add amenities column (text array)
-- ============================================

ALTER TABLE pitches 
  ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}';

-- ============================================
-- STEP 2: Add some sample data (optional)
-- ============================================

-- Update existing pitches with default amenities
-- UPDATE pitches 
-- SET amenities = ARRAY['Kechki yoritish', 'Parkovka']
-- WHERE amenities IS NULL OR array_length(amenities, 1) IS NULL;

-- ============================================
-- STEP 3: Verification queries (run separately)
-- ============================================

-- Check the structure
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'pitches' AND column_name = 'amenities';

-- Check data
-- SELECT id, name, amenities, array_length(amenities, 1) as amenity_count 
-- FROM pitches 
-- ORDER BY created_at DESC 
-- LIMIT 10;

-- ============================================
-- Notes:
-- ============================================
-- - amenities column is TEXT[] (array of text)
-- - Default value is '{}' (empty array)
-- - Stores amenity names in Uzbek
