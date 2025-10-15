-- Fix CRITICAL bug: Make public_profiles view accessible to everyone
-- The issue: security_invoker=on makes the view inherit RLS from profiles table,
-- but profiles blocks anon users, so nobody can see any profiles

-- Drop and recreate the view without security_invoker (defaults to security definer)
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles AS
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
  SELECT ur_1.role
  FROM user_roles ur_1
  WHERE ur_1.user_id = p.user_id
  ORDER BY CASE ur_1.role
    WHEN 'owner'::app_role THEN 1
    WHEN 'admin'::app_role THEN 2
    WHEN 'moderator'::app_role THEN 3
    ELSE 4
  END
  LIMIT 1
) ur ON true;

-- Ensure the view is accessible to everyone (anon and authenticated users)
GRANT SELECT ON public.public_profiles TO anon, authenticated;