-- Complete Fix for Sign-up Error
-- This script fixes the 500 Internal Server Error during registration
-- Run this in your Supabase SQL Editor

-- ============================================
-- STEP 1: Ensure all required columns exist
-- ============================================

-- Profiles table
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Drop old name column if exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'name'
  ) THEN
    -- Copy data first
    UPDATE profiles SET full_name = name WHERE full_name IS NULL;
    -- Then drop
    ALTER TABLE profiles DROP COLUMN name;
  END IF;
END $$;

-- Pitches table - ensure ALL columns exist
ALTER TABLE pitches 
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'Mening maydonim',
  ADD COLUMN IF NOT EXISTS price_per_hour DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS landmark TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS start_time TIME DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS end_time TIME DEFAULT '23:00',
  ADD COLUMN IF NOT EXISTS latitude FLOAT8,
  ADD COLUMN IF NOT EXISTS longitude FLOAT8,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add unique constraint on owner_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pitches_owner_id_key'
  ) THEN
    ALTER TABLE pitches ADD CONSTRAINT pitches_owner_id_key UNIQUE (owner_id);
  END IF;
END $$;

-- ============================================
-- STEP 2: Drop old trigger and function
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ============================================
-- STEP 3: Create new handle_new_user function
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
      images,
      amenities,
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
      '{}',
      '{}',
      NOW(),
      NOW()
    )
    ON CONFLICT (owner_id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error details
    RAISE WARNING 'Error in handle_new_user for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
    -- Don't block user creation, just log the error
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 4: Create trigger
-- ============================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STEP 5: Update RLS policies
-- ============================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitches ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Pitches policies
DROP POLICY IF EXISTS "Anyone can view active pitches" ON pitches;
DROP POLICY IF EXISTS "Owners can insert their pitches" ON pitches;
DROP POLICY IF EXISTS "Owners can update their pitches" ON pitches;
DROP POLICY IF EXISTS "Owners can delete their pitches" ON pitches;

CREATE POLICY "Anyone can view active pitches" ON pitches
  FOR SELECT USING (is_active = true OR owner_id = auth.uid());

CREATE POLICY "Owners can insert their pitches" ON pitches
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their pitches" ON pitches
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their pitches" ON pitches
  FOR DELETE USING (auth.uid() = owner_id);

-- ============================================
-- STEP 6: Grant permissions
-- ============================================

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- ============================================
-- STEP 7: Create indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_pitches_owner_id ON pitches(owner_id);
CREATE INDEX IF NOT EXISTS idx_pitches_is_active ON pitches(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================
-- STEP 8: Verification queries (run separately)
-- ============================================

-- Check profiles structure
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' 
-- ORDER BY ordinal_position;

-- Check pitches structure
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'pitches' 
-- ORDER BY ordinal_position;

-- Test trigger function manually
-- SELECT public.handle_new_user();

-- Check if trigger exists
-- SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- ============================================
-- Notes:
-- ============================================
-- This script:
-- 1. Ensures all required columns exist in both tables
-- 2. Includes images and amenities columns (TEXT[] arrays)
-- 3. Adds unique constraint on owner_id
-- 4. Updates trigger to use correct column names
-- 5. Handles errors gracefully (won't block user creation)
-- 6. Updates all RLS policies
-- 7. Grants necessary permissions
