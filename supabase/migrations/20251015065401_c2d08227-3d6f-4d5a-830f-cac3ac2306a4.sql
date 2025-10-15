-- Fix Security Definer View issue by enabling SECURITY INVOKER on public_profiles
-- This ensures the view respects RLS policies of the querying user

-- Drop and recreate the view with security_invoker option
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker=on) 
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
  COALESCE(ur.role::text, 'user') AS role
FROM public.profiles p
LEFT JOIN LATERAL (
  SELECT role FROM public.user_roles ur
  WHERE ur.user_id = p.user_id
  ORDER BY 
    CASE ur.role 
      WHEN 'owner' THEN 1 
      WHEN 'admin' THEN 2 
      WHEN 'moderator' THEN 3 
      ELSE 4 
    END
  LIMIT 1
) ur ON TRUE;

-- Grant select permissions
GRANT SELECT ON public.public_profiles TO anon, authenticated;