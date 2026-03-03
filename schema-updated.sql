-- Updated Schema for Admin Panel with Owner Management
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update pitches table with new fields
ALTER TABLE pitches 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS price_per_hour DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS landmark TEXT,
ADD COLUMN IF NOT EXISTS start_time TIME DEFAULT '08:00:00',
ADD COLUMN IF NOT EXISTS end_time TIME DEFAULT '23:00:00',
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Migrate old data to new columns
UPDATE pitches 
SET 
  price_per_hour = COALESCE(price_per_hour, price),
  location = COALESCE(location, address),
  start_time = COALESCE(start_time, working_hours_start),
  end_time = COALESCE(end_time, working_hours_end)
WHERE price_per_hour IS NULL OR location IS NULL OR start_time IS NULL OR end_time IS NULL;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Update pitches policies for owner-based access
DROP POLICY IF EXISTS "Allow authenticated users to read pitches" ON pitches;
DROP POLICY IF EXISTS "Allow authenticated users to insert pitches" ON pitches;
DROP POLICY IF EXISTS "Allow authenticated users to update pitches" ON pitches;

CREATE POLICY "Anyone can view active pitches" ON pitches
  FOR SELECT USING (is_active = true OR owner_id = auth.uid());

CREATE POLICY "Owners can insert their pitches" ON pitches
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their pitches" ON pitches
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their pitches" ON pitches
  FOR DELETE USING (auth.uid() = owner_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pitches_owner_id ON pitches(owner_id);
CREATE INDEX IF NOT EXISTS idx_pitches_is_active ON pitches(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pitches_updated_at ON pitches;
CREATE TRIGGER update_pitches_updated_at 
  BEFORE UPDATE ON pitches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at 
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
