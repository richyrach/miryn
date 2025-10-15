-- Create function to check if one user can moderate another based on role hierarchy
CREATE OR REPLACE FUNCTION public.can_moderate_user(moderator_id UUID, target_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  moderator_role app_role;
  target_role app_role;
BEGIN
  -- Get moderator's highest role
  SELECT role INTO moderator_role
  FROM user_roles
  WHERE user_id = moderator_id
  ORDER BY CASE role
    WHEN 'owner' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'moderator' THEN 3
    ELSE 4
  END
  LIMIT 1;
  
  -- Get target's highest role
  SELECT role INTO target_role
  FROM user_roles
  WHERE user_id = target_id
  ORDER BY CASE role
    WHEN 'owner' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'moderator' THEN 3
    ELSE 4
  END
  LIMIT 1;
  
  -- Owner can moderate anyone
  IF moderator_role = 'owner' THEN
    RETURN TRUE;
  END IF;
  
  -- Admin can moderate moderators and users, but not owners or other admins
  IF moderator_role = 'admin' THEN
    RETURN target_role NOT IN ('owner', 'admin');
  END IF;
  
  -- Moderators can only moderate regular users (no role or user role)
  IF moderator_role = 'moderator' THEN
    RETURN target_role IS NULL OR target_role NOT IN ('owner', 'admin', 'moderator');
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update banned_users RLS policy to use hierarchy check
DROP POLICY IF EXISTS "Admins can ban users" ON public.banned_users;

CREATE POLICY "Admins can ban appropriate users"
ON public.banned_users FOR INSERT
WITH CHECK (
  is_admin(auth.uid()) AND 
  can_moderate_user(auth.uid(), user_id)
);

-- Update user_warnings RLS policy to use hierarchy check  
DROP POLICY IF EXISTS "Admins can create warnings" ON public.user_warnings;

CREATE POLICY "Admins can warn appropriate users"
ON public.user_warnings FOR INSERT
WITH CHECK (
  is_admin(auth.uid()) AND
  can_moderate_user(auth.uid(), user_id)
);