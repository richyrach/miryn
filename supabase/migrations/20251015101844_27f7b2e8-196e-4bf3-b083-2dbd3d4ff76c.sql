-- Create notifications system
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('message', 'order', 'announcement', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- System can insert notifications (will be used by triggers and admins)
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, read, created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to notify on new message
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new messages
CREATE TRIGGER on_message_created
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION notify_new_message();

-- Create function to notify on new service request
CREATE OR REPLACE FUNCTION notify_new_service_request()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new service requests
CREATE TRIGGER on_service_request_created
AFTER INSERT ON service_requests
FOR EACH ROW
EXECUTE FUNCTION notify_new_service_request();

-- Create announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  active BOOLEAN DEFAULT true NOT NULL
);

-- Enable RLS on announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Admins can create announcements
CREATE POLICY "Admins can create announcements"
ON public.announcements FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Admins can update announcements
CREATE POLICY "Admins can update announcements"
ON public.announcements FOR UPDATE
USING (is_admin(auth.uid()));

-- Everyone can view active announcements
CREATE POLICY "Everyone can view active announcements"
ON public.announcements FOR SELECT
USING (active = true);

-- Admins can view all announcements
CREATE POLICY "Admins can view all announcements"
ON public.announcements FOR SELECT
USING (is_admin(auth.uid()));

-- Create function to create announcement notifications
CREATE OR REPLACE FUNCTION create_announcement_notifications()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create notifications when announcement is created
CREATE TRIGGER on_announcement_created
AFTER INSERT ON announcements
FOR EACH ROW
WHEN (NEW.active = true)
EXECUTE FUNCTION create_announcement_notifications();