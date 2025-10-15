-- Create trigger to unpublish projects when user is banned
CREATE OR REPLACE FUNCTION public.handle_user_banned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Unpublish all projects owned by the banned user
  UPDATE public.projects
  SET published = false
  WHERE owner_id IN (
    SELECT id FROM public.profiles WHERE user_id = NEW.user_id
  );
  
  RETURN NEW;
END;
$$;

-- Trigger when user is added to banned_users
CREATE TRIGGER on_user_banned
AFTER INSERT ON public.banned_users
FOR EACH ROW
EXECUTE FUNCTION public.handle_user_banned();

-- Create trigger to re-publish projects when user is unbanned
CREATE OR REPLACE FUNCTION public.handle_user_unbanned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only proceed if user was actually unbanned (unbanned_at is set)
  IF NEW.unbanned_at IS NOT NULL AND OLD.unbanned_at IS NULL THEN
    -- Note: Projects stay unpublished by default for manual review
    -- Admin can manually re-publish if needed
    NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_user_unbanned
AFTER UPDATE ON public.banned_users
FOR EACH ROW
EXECUTE FUNCTION public.handle_user_unbanned();