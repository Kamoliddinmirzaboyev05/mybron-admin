-- Complete Database Fix for Admin Panel
-- This script fixes all column naming issues and recreates the trigger
-- Run this in your Supabase SQL Editor

-- ============================================
-- STEP 1: Fix profiles table structure
-- ============================================

-- Rename 'name' column to 'full_name' if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'name'
  ) THEN
    ALTER TABLE profiles RENAME COLUMN name TO full_name;
  END IF;
END $$;

-- Ensure full_name column exists
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Ensure role column has correct constraint
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
  ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('user', 'admin', 'superadmin'));

-- ============================================
-- STEP 2: Fix pitches table structure
-- ============================================

-- Add missing columns if they don't exist
ALTER TABLE pitches 
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS price_per_hour DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS latitude FLOAT8,
  ADD COLUMN IF NOT EXISTS longitude FLOAT8,
  ADD COLUMN IF NOT EXISTS landmark TEXT;

-- Migrate old data if old columns exist
DO $$ 
BEGIN
  -- Migrate price to price_per_hour
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pitches' AND column_name = 'price'
  ) THEN
    UPDATE pitches 
    SET price_per_hour = COALESCE(price_per_hour, price)
    WHERE price_per_hour IS NULL OR price_per_hour = 0;
  END IF;

  -- Migrate address to location
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pitches' AND column_name = 'address'
  ) THEN
    UPDATE pitches 
    SET location = COALESCE(location, address)
    WHERE location IS NULL OR location = '';
  END IF;
END $$;

-- Ensure required columns exist
ALTER TABLE pitches 
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'Mening maydonim',
  ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS start_time TIME DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS end_time TIME DEFAULT '23:00',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

-- ============================================
-- STEP 3: Drop old trigger and function
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ============================================
-- STEP 4: Create new handle_new_user function
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_full_name TEXT;
  user_role TEXT;
BEGIN
  -- Extract full_name and role from metadata with defaults
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'admin');

  -- Insert into profiles table
  INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    user_full_name,
    user_role,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = NOW();

  -- Create default pitch for admin users
  IF user_role IN ('admin', 'superadmin') THEN
    INSERT INTO public.pitches (
      owner_id,
      name,
      price_per_hour,
      location,
      landmark,
      start_time,
      end_time,
      latitude,
      longitude,
      is_active,
      image_url,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      'Mening maydonim',
      0,
      '',
      '',
      '08:00',
      '23:00',
      NULL,
      NULL,
      false,
      NULL,
      NOW(),
      NOW()
    )
    ON CONFLICT (owner_id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error details
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 5: Create trigger
-- ============================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STEP 6: Update RLS policies for pitches
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can view active pitches" ON pitches;
DROP POLICY IF EXISTS "Owners can insert their pitches" ON pitches;
DROP POLICY IF EXISTS "Owners can update their pitches" ON pitches;
DROP POLICY IF EXISTS "Owners can delete their pitches" ON pitches;

-- Create new policies
CREATE POLICY "Anyone can view active pitches" ON pitches
  FOR SELECT USING (is_active = true OR owner_id = auth.uid());

CREATE POLICY "Owners can insert their pitches" ON pitches
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their pitches" ON pitches
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their pitches" ON pitches
  FOR DELETE USING (auth.uid() = owner_id);

-- ============================================
-- STEP 7: Grant permissions
-- ============================================

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- ============================================
-- STEP 8: Create indexes for better performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_pitches_owner_id ON pitches(owner_id);
CREATE INDEX IF NOT EXISTS idx_pitches_is_active ON pitches(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================
-- Verification queries (run separately)
-- ============================================

-- Check profiles structure
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles';

-- Check pitches structure
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'pitches';

-- Check recent profiles
-- SELECT id, full_name, role, created_at FROM profiles ORDER BY created_at DESC LIMIT 5;

-- Check recent pitches
-- SELECT id, owner_id, name, price_per_hour, image_url, is_active FROM pitches ORDER BY created_at DESC LIMIT 5;
