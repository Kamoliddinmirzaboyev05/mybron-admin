-- Upgrade Image Upload System to Support Multiple Images
-- This script converts image_url (single) to images (array)
-- Run this in your Supabase SQL Editor

-- ============================================
-- STEP 1: Add new images column (text array)
-- ============================================

ALTER TABLE pitches 
  ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- ============================================
-- STEP 2: Migrate existing image_url data to images array
-- ============================================

-- Copy single image_url to images array if it exists
UPDATE pitches 
SET images = ARRAY[image_url]
WHERE image_url IS NOT NULL 
  AND image_url != '' 
  AND (images IS NULL OR array_length(images, 1) IS NULL);

-- ============================================
-- STEP 3: Drop old image_url column (optional - uncomment if you want to remove it)
-- ============================================

-- ALTER TABLE pitches DROP COLUMN IF EXISTS image_url;

-- ============================================
-- STEP 4: Verification queries (run separately)
-- ============================================

-- Check the structure
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'pitches' AND column_name IN ('images', 'image_url');

-- Check migrated data
-- SELECT id, owner_id, name, images, array_length(images, 1) as image_count 
-- FROM pitches 
-- ORDER BY created_at DESC 
-- LIMIT 10;

-- ============================================
-- Notes:
-- ============================================
-- - images column is TEXT[] (array of text)
-- - Default value is '{}' (empty array)
-- - Existing image_url data is preserved in images array
-- - You can keep image_url column for backward compatibility or drop it
