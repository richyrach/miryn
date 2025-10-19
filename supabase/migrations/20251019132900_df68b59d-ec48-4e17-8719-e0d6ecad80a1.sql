-- Fix public_profiles view to not be SECURITY DEFINER
-- Drop and recreate without security definer
DROP VIEW IF EXISTS public_profiles;
CREATE VIEW public_profiles 
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.user_id,
  p.handle,
  p.display_name,
  p.bio,
  p.location,
  p.avatar_url,
  p.banner_url,
  p.skills,
  p.hireable,
  p.primary_cta,
  p.primary_cta_url,
  p.intro_url,
  p.created_at,
  p.updated_at,
  COALESCE(
    (
      SELECT array_agg(role::text ORDER BY 
        CASE role
          WHEN 'owner' THEN 1
          WHEN 'admin' THEN 2
          WHEN 'moderator' THEN 3
          WHEN 'content_mod' THEN 4
          WHEN 'junior_mod' THEN 5
          WHEN 'support' THEN 6
          WHEN 'partner' THEN 7
          WHEN 'verified' THEN 8
          WHEN 'developer' THEN 9
          WHEN 'vip' THEN 10
          WHEN 'early_supporter' THEN 11
          ELSE 12
        END
      )
      FROM user_roles ur
      WHERE ur.user_id = p.user_id
    ),
    ARRAY[]::text[]
  ) as roles
FROM profiles p;