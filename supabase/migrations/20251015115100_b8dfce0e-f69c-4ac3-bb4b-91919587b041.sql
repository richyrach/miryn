-- Fix foreign key causing announcement notification failures and re-assert conversations INSERT policy
BEGIN;

-- 1) Ensure profiles.user_id is unique (required to reference from notifications)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_user_id_unique'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
  END IF;
END$$;

-- 2) Point notifications.user_id to profiles.user_id instead of auth.users(id)
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.profiles(user_id)
  ON DELETE CASCADE;

-- 3) Recreate trigger to fan out notifications on active announcements
DROP TRIGGER IF EXISTS on_announcement_created ON public.announcements;
CREATE TRIGGER on_announcement_created
AFTER INSERT ON public.announcements
FOR EACH ROW
WHEN (NEW.active = true)
EXECUTE FUNCTION public.create_announcement_notifications();

-- 4) Re-assert conversations INSERT policy (authenticated users can create)
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations"
ON public.conversations
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (true);

COMMIT;