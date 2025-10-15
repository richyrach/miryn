-- Phase 1: Fix Storage RLS Policies and Clean Up Accounts

-- =====================================================
-- 1. Fix Storage RLS Policies for Image Uploads
-- =====================================================

-- Allow authenticated users to insert their own files in avatars bucket
CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to insert their own files in banners bucket
CREATE POLICY "Users can upload banners"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'banners' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own avatar files
CREATE POLICY "Users can update their avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own banner files
CREATE POLICY "Users can update their banners"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'banners' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own avatar files
CREATE POLICY "Users can delete their avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own banner files
CREATE POLICY "Users can delete their banners"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'banners' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- 2. Clean Up Extra Account
-- =====================================================

-- Delete the richyrachreal@gmail.com account
-- This will cascade delete the profile and any related data
DELETE FROM auth.users 
WHERE email = 'richyrachreal@gmail.com';

-- =====================================================
-- 3. Ensure Owner Role Assignment
-- =====================================================

-- The trigger assign_owner_role() already handles this automatically
-- when a user with email 'richyrachfansgmial@gmail.com' signs up.
-- Let's verify and insert the role if it doesn't exist

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'owner'::app_role
FROM auth.users
WHERE email = 'richyrachfansgmial@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;