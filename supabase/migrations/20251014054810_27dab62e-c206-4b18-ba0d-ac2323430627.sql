-- Create a secure public view of profiles that excludes user_id
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  handle,
  display_name,
  bio,
  avatar_url,
  location,
  hireable,
  skills,
  intro_url,
  primary_cta,
  primary_cta_url,
  created_at,
  updated_at
FROM public.profiles;

-- Grant SELECT on the view
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Update the profiles table RLS policy to be more restrictive
-- Remove the overly permissive "everyone can view" policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Add a policy that only allows users to see their own full profile data
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add a policy for service role to view all profiles (for admin purposes)
CREATE POLICY "Service role can view all profiles" 
ON public.profiles 
FOR SELECT 
TO service_role
USING (true);