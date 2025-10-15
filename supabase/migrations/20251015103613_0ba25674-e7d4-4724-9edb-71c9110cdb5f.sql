-- Fix Security Definer View issue by using SECURITY INVOKER with proper RLS

-- Step 1: Add RLS policy to profiles table for public access
-- This allows anyone to view public profile information through proper RLS instead of bypassing it
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
TO anon, authenticated
USING (true);

-- Step 2: Recreate view with SECURITY INVOKER
-- This makes the view use the querying user's permissions (which will pass through RLS)
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker = true)  -- Use querying user's permissions instead of view creator's
AS
SELECT 
  p.id,
  p.handle,
  p.display_name,
  p.bio,
  p.location,
  p.skills,
  p.hireable,
  p.intro_url,
  p.primary_cta,
  p.primary_cta_url,
  p.avatar_url,
  p.banner_url,
  p.created_at,
  p.updated_at,
  COALESCE(ur.role::text, 'user'::text) AS role
FROM profiles p
LEFT JOIN LATERAL (
  SELECT ur_1.role FROM user_roles ur_1
  WHERE ur_1.user_id = p.user_id
  ORDER BY CASE ur_1.role
    WHEN 'owner'::app_role THEN 1
    WHEN 'admin'::app_role THEN 2
    WHEN 'moderator'::app_role THEN 3
    ELSE 4
  END
  LIMIT 1
) ur ON true;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO anon, authenticated;