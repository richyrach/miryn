-- Add auto_assigned column to user_roles to track auto vs manual role assignments
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS auto_assigned BOOLEAN DEFAULT false;

-- Create function to auto-verify users at 100+ followers
CREATE OR REPLACE FUNCTION public.auto_verify_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  follower_count INTEGER;
  target_user_id UUID;
BEGIN
  -- Get the user_id from the profile
  SELECT user_id INTO target_user_id
  FROM profiles
  WHERE id = NEW.following_id;
  
  -- Get follower count
  SELECT COUNT(*) INTO follower_count
  FROM follows
  WHERE following_id = NEW.following_id;
  
  -- Auto-assign verified role if >= 100 followers and not already verified
  IF follower_count >= 100 AND target_user_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role, auto_assigned)
    VALUES (target_user_id, 'verified', true)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-verify on new follow
DROP TRIGGER IF EXISTS trigger_auto_verify ON follows;
CREATE TRIGGER trigger_auto_verify
AFTER INSERT ON follows
FOR EACH ROW EXECUTE FUNCTION public.auto_verify_user();

-- Also check for auto-unverify when unfollowing (only remove auto-assigned verified)
CREATE OR REPLACE FUNCTION public.auto_unverify_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  follower_count INTEGER;
  target_user_id UUID;
BEGIN
  -- Get the user_id from the profile
  SELECT user_id INTO target_user_id
  FROM profiles
  WHERE id = OLD.following_id;
  
  -- Get follower count after delete
  SELECT COUNT(*) INTO follower_count
  FROM follows
  WHERE following_id = OLD.following_id;
  
  -- Remove auto-assigned verified role if < 100 followers
  IF follower_count < 100 AND target_user_id IS NOT NULL THEN
    DELETE FROM user_roles
    WHERE user_id = target_user_id
      AND role = 'verified'
      AND auto_assigned = true;
  END IF;
  
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_unverify ON follows;
CREATE TRIGGER trigger_auto_unverify
AFTER DELETE ON follows
FOR EACH ROW EXECUTE FUNCTION public.auto_unverify_user();

-- Update public_profiles view to include roles as array
DROP VIEW IF EXISTS public_profiles;
CREATE VIEW public_profiles AS
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