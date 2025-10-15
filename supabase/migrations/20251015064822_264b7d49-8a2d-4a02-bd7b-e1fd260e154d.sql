-- Add trigger to assign owner role on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created_assign_owner ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_owner
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.assign_owner_role();

-- Drop and recreate the public_profiles view with correct column order
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
  COALESCE(ur.role::text, 'user') AS role
FROM public.profiles p
LEFT JOIN LATERAL (
  SELECT role FROM public.user_roles ur
  WHERE ur.user_id = p.user_id
  ORDER BY 
    CASE ur.role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 WHEN 'moderator' THEN 3 ELSE 4 END
  LIMIT 1
) ur ON TRUE;

-- Grant select on view to anon/authenticated
GRANT SELECT ON public.public_profiles TO anon, authenticated;