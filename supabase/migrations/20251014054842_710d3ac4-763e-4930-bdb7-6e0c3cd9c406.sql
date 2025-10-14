-- Drop and recreate the view without SECURITY DEFINER
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
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