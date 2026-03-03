-- Supabase Storage Setup for Pitch Images
-- Run this in your Supabase SQL Editor after running schema.sql

-- Create storage bucket for pitch images
INSERT INTO storage.buckets (id, name, public)
VALUES ('pitch_images', 'pitch_images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies to allow authenticated users to upload/delete images
CREATE POLICY "Allow authenticated users to upload pitch images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'pitch_images');

CREATE POLICY "Allow public to view pitch images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'pitch_images');

CREATE POLICY "Allow authenticated users to delete pitch images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'pitch_images');

CREATE POLICY "Allow authenticated users to update pitch images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'pitch_images');
