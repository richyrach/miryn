-- Fix RLS issues for conversations, user_roles, and notifications

-- Issue 1: Fix conversation participants - allow users to add themselves to new conversations
-- The current policy requires user to already be in conversation, but they need to add themselves first
DROP POLICY IF EXISTS "Users can add participants to conversations they're in" ON public.conversation_participants;

CREATE POLICY "Users can add participants to conversations they're in"
ON public.conversation_participants
FOR INSERT
WITH CHECK (
  user_id = auth.uid() OR  -- Allow users to add themselves
  user_in_conversation(auth.uid(), conversation_id)  -- Or if they're already in the conversation
);

-- Issue 2: Fix user_roles deletion - allow admins to remove roles they can moderate
DROP POLICY IF EXISTS "Only owner can delete roles" ON public.user_roles;

CREATE POLICY "Admins can delete roles they can moderate"
ON public.user_roles
FOR DELETE
USING (
  has_role(auth.uid(), 'owner'::app_role) OR
  (is_admin(auth.uid()) AND can_moderate_user(auth.uid(), user_id))
);

-- Issue 3: Fix notifications foreign key - ensure it references profiles.user_id instead of auth.users
-- First, check if there's a foreign key constraint and drop it if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'notifications_user_id_fkey'
  ) THEN
    ALTER TABLE public.notifications DROP CONSTRAINT notifications_user_id_fkey;
  END IF;
END $$;

-- Add proper foreign key to auth.users (which is what user_id should reference)
ALTER TABLE public.notifications
ADD CONSTRAINT notifications_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;