-- Fix messaging and announcement RLS issues

-- Issue 1: Fix conversation_participants RLS policy
-- The current policy fails because it checks if user is already in conversation
-- But we need to allow adding participants during initial conversation creation
DROP POLICY IF EXISTS "Users can add participants to conversations they're in" ON public.conversation_participants;

CREATE POLICY "Users can add participants to conversations they're in"
ON public.conversation_participants
FOR INSERT
WITH CHECK (
  -- Allow adding yourself
  user_id = auth.uid() 
  OR 
  -- Allow adding others to conversations where you're already a participant
  -- This check will pass after the first participant (creator) is added
  EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
    AND cp.user_id = auth.uid()
  )
);

-- Issue 2: Disable the automatic trigger that adds creator
-- We'll manually add both participants in the application code instead
DROP TRIGGER IF EXISTS on_conversation_created ON public.conversations;
DROP TRIGGER IF EXISTS trg_add_creator_participant ON public.conversations;

-- Issue 3: Make notification functions SECURITY DEFINER
-- These functions need elevated permissions to insert notifications for all users

-- Fix create_announcement_notifications function
DROP FUNCTION IF EXISTS public.create_announcement_notifications() CASCADE;

CREATE OR REPLACE FUNCTION public.create_announcement_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- Allows bypassing RLS to create notifications for all users
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

-- Recreate the trigger
CREATE TRIGGER on_announcement_created
  AFTER INSERT ON public.announcements
  FOR EACH ROW
  WHEN (NEW.active = true)
  EXECUTE FUNCTION create_announcement_notifications();

-- Fix notify_new_message function
DROP FUNCTION IF EXISTS public.notify_new_message() CASCADE;

CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- Allows creating notifications for other users
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

-- Recreate the trigger
CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- Fix notify_new_service_request function
DROP FUNCTION IF EXISTS public.notify_new_service_request() CASCADE;

CREATE OR REPLACE FUNCTION public.notify_new_service_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- Allows creating notifications for other users
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

-- Recreate the trigger
CREATE TRIGGER on_service_request_created
  AFTER INSERT ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_service_request();