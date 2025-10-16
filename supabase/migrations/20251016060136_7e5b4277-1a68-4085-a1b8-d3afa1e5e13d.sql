-- Add trigger for service request notifications
CREATE TRIGGER on_service_request_created
  AFTER INSERT ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_service_request();

-- Add new role types
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'partner';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'verified';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'developer';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'early_supporter';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'vip';

-- Create function to delete user accounts (admin only)
CREATE OR REPLACE FUNCTION public.delete_user_account(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can delete user accounts';
  END IF;

  -- Check if target can be moderated by caller
  IF NOT can_moderate_user(auth.uid(), target_user_id) THEN
    RAISE EXCEPTION 'You cannot moderate this user';
  END IF;

  -- Delete user's profile (cascade will handle related data)
  DELETE FROM profiles WHERE user_id = target_user_id;
  
  -- Delete user roles
  DELETE FROM user_roles WHERE user_id = target_user_id;
  
  -- Delete from auth.users (this will cascade to everything else)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- Enable realtime for banned_users
ALTER PUBLICATION supabase_realtime ADD TABLE public.banned_users;

-- Enable realtime for user_warnings
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_warnings;