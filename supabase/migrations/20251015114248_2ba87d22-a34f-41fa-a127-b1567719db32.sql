-- Fix conversation_participants RLS policy to allow sequential inserts
DROP POLICY IF EXISTS "Users can add participants to conversations they're in" ON conversation_participants;

CREATE POLICY "Users can add participants to conversations they're in"
ON conversation_participants
FOR INSERT
WITH CHECK (
  -- Allow adding yourself
  user_id = auth.uid() 
  OR 
  -- Allow adding others to conversations you're already in
  EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
    AND cp.user_id = auth.uid()
  )
);

-- Ensure conversations can be created by authenticated users
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;

CREATE POLICY "Users can create conversations"
ON conversations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Ensure notification functions have SECURITY DEFINER (reassert for safety)
DROP FUNCTION IF EXISTS public.create_announcement_notifications() CASCADE;

CREATE OR REPLACE FUNCTION public.create_announcement_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create notification for all users
  INSERT INTO notifications (user_id, type, title, message, link)
  SELECT 
    user_id,
    'announcement',
    NEW.title,
    NEW.message,
    NULL
  FROM profiles;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger for announcements
DROP TRIGGER IF EXISTS on_announcement_created ON public.announcements;

CREATE TRIGGER on_announcement_created
  AFTER INSERT ON public.announcements
  FOR EACH ROW
  WHEN (NEW.active = true)
  EXECUTE FUNCTION create_announcement_notifications();

-- Ensure other notification functions are also SECURITY DEFINER
DROP FUNCTION IF EXISTS public.notify_new_message() CASCADE;

CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient_id UUID;
  sender_handle TEXT;
BEGIN
  -- Get the recipient's user_id (the other person in the conversation)
  SELECT user_id INTO recipient_id
  FROM conversation_participants
  WHERE conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id
  LIMIT 1;
  
  -- Get sender's handle
  SELECT handle INTO sender_handle
  FROM profiles
  WHERE user_id = NEW.sender_id;
  
  -- Create notification for recipient
  IF recipient_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      recipient_id,
      'message',
      'New Message',
      'You have a new message from @' || COALESCE(sender_handle, 'someone'),
      '/messages'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.notify_new_service_request() CASCADE;

CREATE OR REPLACE FUNCTION public.notify_new_service_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seller_user_id UUID;
  requester_handle TEXT;
  service_title TEXT;
BEGIN
  -- Get seller's user_id
  SELECT user_id INTO seller_user_id
  FROM profiles
  WHERE id = NEW.seller_profile_id;
  
  -- Get requester's handle
  SELECT handle INTO requester_handle
  FROM profiles
  WHERE user_id = NEW.requester_id;
  
  -- Get service title
  SELECT title INTO service_title
  FROM services
  WHERE id = NEW.service_id;
  
  -- Create notification for seller
  IF seller_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      seller_user_id,
      'order',
      'New Service Request',
      '@' || COALESCE(requester_handle, 'Someone') || ' requested: ' || COALESCE(service_title, 'your service'),
      '/services'
    );
  END IF;
  
  RETURN NEW;
END;
$$;