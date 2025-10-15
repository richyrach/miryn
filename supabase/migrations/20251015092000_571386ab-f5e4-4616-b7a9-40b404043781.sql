-- Fix PUBLIC_DATA_EXPOSURE: Secure profiles table RLS policies
-- Drop the overly permissive policy that exposes user_id to everyone
DROP POLICY IF EXISTS "Public can view non-sensitive profile data" ON public.profiles;

-- Create a restrictive policy that blocks direct table access for public
-- This forces all public access to go through the public_profiles view
CREATE POLICY "Block direct public access to profiles"
ON public.profiles FOR SELECT
TO anon
USING (false);

-- Ensure authenticated users can still view their own full profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Grant SELECT access to the public_profiles view for all users
-- This view already excludes user_id and other sensitive fields
GRANT SELECT ON public.public_profiles TO anon, authenticated;