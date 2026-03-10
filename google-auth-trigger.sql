-- 1. Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Ensure profiles table exists and has necessary columns
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns for Google Auth data
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 3. Create or replace the function to handle new user insertion
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email, role)
  VALUES (
    NEW.id,
    -- Get full_name from metadata, fallback to name, then email part
    COALESCE(
      NEW.raw_user_meta_data->>'full_name', 
      NEW.raw_user_meta_data->>'name', 
      split_part(NEW.email, '@', 1)
    ),
    -- Get avatar_url from metadata (Google uses avatar_url or picture)
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url', 
      NEW.raw_user_meta_data->>'picture'
    ),
    NEW.email,
    -- Default role
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    email = EXCLUDED.email,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Set up Storage for Avatars (Optional, if you want to allow uploading later)
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
